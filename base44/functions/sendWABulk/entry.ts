import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const startTime = Date.now();
  let logEntries = [];
  let campaignIdForError = null;
  
  const addLog = (level, event, message, details = {}, status = null) => {
    const log = {
      level,
      event,
      message,
      details: { ...details, timestamp: new Date().toISOString() },
      status,
      duration_ms: Date.now() - startTime,
    };
    logEntries.push(log);
    console.log(`[${level}] ${event}: ${message}`, details);
  };

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    addLog("INFO", "AUTH_CHECK", "משתמש מאומת", { userId: user.id });

    const bodyText = await req.text();
    const body = JSON.parse(bodyText);
    const { campaignId, processPending } = body;
    campaignIdForError = campaignId;
    if (!campaignId) return Response.json({ error: 'campaignId נדרש' }, { status: 400 });
    addLog("DEBUG", "PAYLOAD_PARSED", "קבלת payload", { campaignId, processPending });

    const rawUrl = (Deno.env.get("RAILWAY_URL") || "").replace(/\/$/, "");
    const railwayUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
    const railwaySecret = Deno.env.get("RAILWAY_API_SECRET");
    const webhookUrl = Deno.env.get("BASE44_WEBHOOK_URL");
    
    if (!webhookUrl) {
      addLog("ERROR", "WEBHOOK_MISSING", "BASE44_WEBHOOK_URL not set — please add to env vars", {}, "failed");
      return Response.json({ error: 'Missing BASE44_WEBHOOK_URL env variable' }, { status: 500 });
    }

    const campaigns = await base44.asServiceRole.entities.Campaign.filter({ id: campaignId });
    if (!campaigns.length) {
      addLog("ERROR", "CAMPAIGN_NOT_FOUND", "קמפיין לא נמצא בDB", { campaignId }, "failed");
      return Response.json({ error: 'קמפיין לא נמצא' }, { status: 404 });
    }
    const campaign = campaigns[0];
    addLog("DEBUG", "CAMPAIGN_LOADED", "קמפיין נטען", { campaignId, name: campaign.name, type: campaign.type, status: campaign.status });

    if (campaign.type !== "whatsapp") {
      addLog("ERROR", "INVALID_CAMPAIGN_TYPE", "סוג קמפיין לא תמוך", { type: campaign.type }, "failed");
      return Response.json({ error: 'פונקציה זו רק ל-WhatsApp' }, { status: 400 });
    }

    // בדוק session
    const sessionId = `user_${user.id}`;
    addLog("DEBUG", "SESSION_CHECK", "בדיקת חיבור WhatsApp", { sessionId, railwayUrl: railwayUrl.replace(railwaySecret, "***") });
    const sessionCheck = await fetch(`${railwayUrl}/session/status/${sessionId}`, {
      headers: { Authorization: `Bearer ${railwaySecret}` },
    });
    if (!sessionCheck.ok) {
      addLog("ERROR", "RAILWAY_UNREACHABLE", "Railway לא נגיש", { status: sessionCheck.status, url: railwayUrl }, "failed");
      return Response.json({ error: 'WhatsApp לא מחובר' }, { status: 400 });
    }
    const sessionData = await sessionCheck.json();
    if (sessionData.status !== "connected") {
      addLog("WARN", "WHATSAPP_DISCONNECTED", "WhatsApp לא מחובר", { sessionStatus: sessionData.status }, "failed");
      return Response.json({ error: 'WhatsApp לא מחובר — אנא סרוק QR' }, { status: 400 });
    }
    addLog("DEBUG", "WHATSAPP_CONNECTED", "חיבור WhatsApp אומת", { sessionStatus: sessionData.status });

    // אם processPending, שלח רק pending messages - אחרת שלח את כל הlead IDs
    let leadsToSend = [];
    if (processPending) {
      const pendingMsgs = await base44.asServiceRole.entities.CampaignMessage.filter({
        campaign_id: campaignId,
        status: "pending",
      });
      const pendingLeadIds = [...new Set(pendingMsgs.map(m => m.lead_id))];
      const fetchedLeads = await Promise.all(
        pendingLeadIds.map(id => base44.asServiceRole.entities.Lead.filter({ id }).then(r => r[0]).catch(() => null))
      );
      leadsToSend = fetchedLeads.filter(l => l && l.phone);
      addLog("DEBUG", "PENDING_MODE", "מצב pending - בחירת leads ממתינים", { pendingCount: leadsToSend.length });
    } else {
      // מצב ישן - שלח את כל ה-target leads
      const leadIds = campaign.target_lead_ids || [];
      const fetchedLeads = await Promise.all(
        leadIds.map(id => base44.asServiceRole.entities.Lead.filter({ id }).then(r => r[0]).catch(() => null))
      );
      leadsToSend = fetchedLeads.filter(l => l && l.phone);
      addLog("DEBUG", "INITIAL_MODE", "מצב ראשוני - בחירת כל target leads", { totalCount: leadsToSend.length });
    }

    const variations = (campaign.message_variations || []).filter(v => v.content && v.content.trim());
    addLog("DEBUG", "VARIATION_FILTER", "סינון וריאציות", { totalVariations: campaign.message_variations?.length || 0, validVariations: variations.length });
    if (!leadsToSend.length || !variations.length) {
      addLog("ERROR", "MISSING_DATA", "חסרים נתונים קריטיים", { leadsCount: leadsToSend.length, variationsCount: variations.length }, "failed");
      return Response.json({ error: 'אין נמענים או תוכן הודעה' }, { status: 400 });
    }
    addLog("INFO", "BATCH_READY", "הכנת batch לשליחה", { leadsCount: leadsToSend.length, variationsCount: variations.length, webhookUrl });

    // עדכן סטטוס לrunning
    addLog("DEBUG", "STATUS_UPDATE", "עדכון סטטוס קמפיין ל-running", { totalRecipients: leadsToSend.length });
    await base44.asServiceRole.entities.Campaign.update(campaignId, {
      status: "running",
      total_recipients: leadsToSend.length,
    });

    // נרמל מספרי טלפון לפורמט בינלאומי
    const normalizePhone = (phone) => {
      let p = (phone || "").replace(/[\-\s]/g, "");
      if (p.startsWith("0")) p = "972" + p.slice(1);
      return p;
    };

    // ── הגבלה יומית מוחלטת: מקסימום 50 הודעות/יום ────────────────────────
    const HARD_DAILY_LIMIT = 50;
    const userDailyLimit = Math.min(campaign.daily_limit || 50, HARD_DAILY_LIMIT);

    // בדוק כמה הודעות נשלחו היום
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMessages = await base44.asServiceRole.entities.CampaignMessage.filter({
      campaign_id: campaignId,
      status: "sent",
    }).then(msgs => msgs.filter(m => new Date(m.sent_at || m.created_date) >= todayStart)).catch(() => []);
    const sentTodayCount = todayMessages.length;
    const remainingToday = Math.max(0, userDailyLimit - sentTodayCount);

    addLog("INFO", "DAILY_LIMIT_CHECK", "בדיקת מגבלה יומית", { sentToday: sentTodayCount, limit: userDailyLimit, remaining: remainingToday });

    if (remainingToday === 0) {
      addLog("WARN", "DAILY_LIMIT_REACHED", "מגבלת היום הגיעה — לא נשלח כלום", {}, "failed");
      return Response.json({ error: `הגעת למגבלת ${userDailyLimit} הודעות ליום. נסה מחר.` }, { status: 429 });
    }

    // חתוך את רשימת השליחה לפי המותר להיום
    const leadsForToday = leadsToSend.slice(0, remainingToday);
    addLog("INFO", "TODAY_BATCH", "קביעת אצוות היום", { total: leadsToSend.length, todayBatch: leadsForToday.length, remaining: remainingToday });

    const messages = [];
    addLog("INFO", "BATCH_START", "התחלת שליחה",
      { totalLeads: leadsForToday.length, totalVariations: variations.length });
    for (let i = 0; i < leadsForToday.length; i++) {
      const lead = leadsForToday[i];
      const variation = variations[i % variations.length];
      const content = (variation.content || "").replace("{name}", lead.full_name || "");

      // אם processPending, חפש אם already יש pending message לlead הזה
      let msg;
      if (processPending) {
        const existing = await base44.asServiceRole.entities.CampaignMessage.filter({
          campaign_id: campaignId,
          lead_id: lead.id,
          status: "pending",
        }).then(r => r[0]).catch(() => null);
        if (existing) {
          msg = existing;
          addLog("DEBUG", "REUSE_MESSAGE", "שימוש ב-message קיים", { leadId: lead.id, messageId: msg.id });
        } else {
          msg = await base44.asServiceRole.entities.CampaignMessage.create({
            campaign_id: campaignId,
            lead_id: lead.id,
            lead_name: lead.full_name,
            lead_phone: lead.phone,
            variation_used: variation.label || "A",
            message_content: content,
            status: "pending",
          });
        }
      } else {
        msg = await base44.asServiceRole.entities.CampaignMessage.create({
          campaign_id: campaignId,
          lead_id: lead.id,
          lead_name: lead.full_name,
          lead_phone: lead.phone,
          variation_used: variation.label || "A",
          message_content: content,
          status: "pending",
        });
      }

      const sendRes = await fetch(`${railwayUrl}/message/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${railwaySecret}`,
          "Content-Type": "application/json",
          "X-Webhook-Url": webhookUrl,
          "X-Webhook-Secret": railwaySecret,
        },
        body: JSON.stringify({
          sessionId,
          to: normalizePhone(lead.phone),
          message: content,
          mediaUrl: variation.media_url || campaign.global_media_url || null,
          messageId: msg.id,
          delayMin: campaign.delay_min_seconds || 30,
          delayMax: campaign.delay_max_seconds || 120,
          dailyLimit: campaign.daily_limit || 80,
          sendWindowStart: campaign.scheduled_time_start || "09:00",
          sendWindowEnd: campaign.scheduled_time_end || "18:00",
        }),
      });

      let sendData;
      try {
        sendData = await sendRes.json();
      } catch (parseErr) {
        addLog("ERROR", "RESPONSE_PARSE_ERROR", "שגיאה בקריאת JSON", { phone: lead.phone, httpStatus: sendRes.status, parseError: parseErr.message }, "failed");
        await base44.asServiceRole.entities.CampaignMessage.update(msg.id, {
          status: "failed",
          error_message: "שגיאה בעיבוד תשובה מServer",
        });
        messages.push({ leadId: lead.id, messageId: msg.id, queued: false });
        continue;
      }

      if (!sendRes.ok) {
        const errorMsg = "כישלון שליחה ל-" + lead.phone;
        addLog("WARN", "SEND_FAILED", errorMsg, { phone: lead.phone, httpStatus: sendRes.status, responseBody: sendData });
        await base44.asServiceRole.entities.CampaignMessage.update(msg.id, {
          status: "failed",
          error_message: sendData.error || ("HTTP " + sendRes.status),
        });
        messages.push({ leadId: lead.id, messageId: msg.id, queued: false });
        continue;
      }

      const queued = sendData && sendData.queued === true;
      messages.push({ leadId: lead.id, messageId: msg.id, queued });
      addLog("DEBUG", "SEND_QUEUED", "הודעה הוקעה", { phone: lead.phone, queued, variation: variation.label });
    }

    const successCount = messages.filter(m => m.queued).length;
    const failedCount = messages.filter(m => !m.queued).length;
    const finalStatus = failedCount === 0 ? "success" : successCount > 0 ? "partial" : "failed";
    addLog("INFO", "BATCH_COMPLETE", "סיום שליחה", { queued: successCount, failed: failedCount, total: messages.length }, finalStatus);
    
    // שמור את כל ה-logs
    try {
      for (const log of logEntries) {
        try {
          await base44.asServiceRole.entities.CampaignLog.create({
            campaign_id: campaignId,
            level: log.level,
            event: log.event,
            message: log.message,
            details: log.details,
            status: log.status,
            duration_ms: log.duration_ms,
            source_function: "sendWABulk",
            user_id: user.id,
          });
        } catch (logErr) {
          console.error("Log save failed for event", log.event, ":", logErr.message);
        }
      }
    } catch (logSaveErr) {
      console.error("Failed to save logs batch:", logSaveErr.message);
    }
    
    return Response.json({ ok: true, campaignId, queued: successCount, total: messages.length, messages });
  } catch (error) {
    addLog("CRITICAL", "EXCEPTION", "שגיאה קריטית", { errorMessage: error.message }, "failed");
    
    // שמור את ה-logs גם בכישלון
    try {
      for (const log of logEntries) {
        await base44.asServiceRole.entities.CampaignLog.create({
          campaign_id: campaignIdForError,
          level: log.level,
          event: log.event,
          message: log.message,
          details: log.details,
          status: log.status,
          duration_ms: log.duration_ms,
          source_function: "sendWABulk",
          stack_trace: log.level === "CRITICAL" ? error.stack : undefined,
        }).catch(() => null);
      }
    } catch (logErr) {
      console.error("Failed to save error logs:", logErr);
    }
    
    return Response.json({ error: error.message }, { status: 500 });
  }
});