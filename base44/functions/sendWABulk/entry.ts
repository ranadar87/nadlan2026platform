import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const HARD_DAILY_LIMIT = 80;

// נרמל מספר טלפון לפורמט בינלאומי
function normalizePhone(phone) {
  let p = (phone || "").replace(/[\-\s]/g, "");
  if (p.startsWith("0")) p = "972" + p.slice(1);
  return p;
}

// נקה שם מסוגריים מיוחדים שנשמרו בDB
function cleanName(name) {
  return (name || "").replace(/[{}]/g, "").trim();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { campaignId, processPending } = body;
    if (!campaignId) return Response.json({ error: 'campaignId נדרש' }, { status: 400 });

    const rawUrl = (Deno.env.get("RAILWAY_URL") || "").replace(/\/$/, "");
    const railwayUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
    const railwaySecret = Deno.env.get("RAILWAY_API_SECRET");
    const webhookUrl = Deno.env.get("BASE44_WEBHOOK_URL");

    if (!webhookUrl) return Response.json({ error: 'Missing BASE44_WEBHOOK_URL' }, { status: 500 });

    // טען קמפיין
    const campaigns = await base44.asServiceRole.entities.Campaign.filter({ id: campaignId });
    if (!campaigns.length) return Response.json({ error: 'קמפיין לא נמצא' }, { status: 404 });
    const campaign = campaigns[0];

    if (campaign.type !== "whatsapp") return Response.json({ error: 'פונקציה זו רק ל-WhatsApp' }, { status: 400 });

    // בדוק חיבור WhatsApp
    const sessionId = `user_${user.id}`;
    const sessionCheck = await fetch(`${railwayUrl}/session/status/${sessionId}`, {
      headers: { Authorization: `Bearer ${railwaySecret}` },
    });
    if (!sessionCheck.ok) return Response.json({ error: 'WhatsApp לא מחובר' }, { status: 400 });
    const sessionData = await sessionCheck.json();
    if (sessionData.status !== "connected") return Response.json({ error: 'WhatsApp לא מחובר — אנא סרוק QR' }, { status: 400 });

    const variations = (campaign.message_variations || []).filter(v => v.content && v.content.trim());
    if (!variations.length) return Response.json({ error: 'אין תוכן הודעה' }, { status: 400 });

    // ── שלב 1: יצירת כל CampaignMessages כ-pending (רק בקריאה הראשונה) ──
    if (!processPending) {
      const leadIds = campaign.target_lead_ids || [];
      if (!leadIds.length) return Response.json({ error: 'אין נמענים' }, { status: 400 });

      // בדוק אם כבר נוצרו messages לקמפיין הזה
      const existingMessages = await base44.asServiceRole.entities.CampaignMessage.filter({ campaign_id: campaignId });
      
      if (!existingMessages.length) {
        // צור messages עבור כל הלידים
        const fetchedLeads = await Promise.all(
          leadIds.map(id => base44.asServiceRole.entities.Lead.filter({ id }).then(r => r[0]).catch(() => null))
        );
        const validLeads = fetchedLeads.filter(l => l && l.phone);

        for (let i = 0; i < validLeads.length; i++) {
          const lead = validLeads[i];
          const variation = variations[i % variations.length];
          const content = (variation.content || "").replace(/\{name\}/g, cleanName(lead.full_name));
          await base44.asServiceRole.entities.CampaignMessage.create({
            campaign_id: campaignId,
            lead_id: lead.id,
            lead_name: lead.full_name,
            lead_phone: lead.phone,
            variation_used: variation.label || "A",
            message_content: content,
            status: "pending",
          });
        }

        await base44.asServiceRole.entities.Campaign.update(campaignId, {
          status: "running",
          total_recipients: validLeads.length,
          sent_count: 0,
          failed_count: 0,
        });
        console.log(`[INIT] Created ${validLeads.length} pending messages`);
      }
    }

    // ── שלב 2: חשב כמה ניתן לשלוח היום ──
    const userDailyLimit = Math.min(campaign.daily_limit || 50, HARD_DAILY_LIMIT);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const allMessages = await base44.asServiceRole.entities.CampaignMessage.filter({ campaign_id: campaignId });
    const sentToday = allMessages.filter(m =>
      (m.status === "sent" || m.status === "delivered" || m.status === "opened" || m.status === "replied") &&
      new Date(m.sent_at || m.created_date) >= todayStart
    ).length;

    const remainingToday = Math.max(0, userDailyLimit - sentToday);
    if (remainingToday === 0) {
      return Response.json({ ok: true, queued: 0, skipped: 0, message: `הגעת למגבלת ${userDailyLimit} הודעות להיום` });
    }

    // ── שלב 3: שלח את האצווה היומית ──
    const pendingMessages = allMessages.filter(m => m.status === "pending").slice(0, remainingToday);
    
    if (!pendingMessages.length) {
      // אין יותר pending — עדכן לcompleted
      const sentTotal = allMessages.filter(m => m.status !== "pending" && m.status !== "failed").length;
      if (sentTotal > 0) {
        await base44.asServiceRole.entities.Campaign.update(campaignId, { status: "completed" });
      }
      return Response.json({ ok: true, queued: 0, message: "כל ההודעות נשלחו" });
    }

    console.log(`[SEND] Sending batch of ${pendingMessages.length} (daily limit: ${userDailyLimit}, sent today: ${sentToday})`);

    let queuedCount = 0;
    let failedCount = 0;

    for (const msg of pendingMessages) {
      const lead = await base44.asServiceRole.entities.Lead.filter({ id: msg.lead_id }).then(r => r[0]).catch(() => null);
      if (!lead) { failedCount++; continue; }

      // החלף {name} בשם נקי (ללא סוגריים)
      const cleanContent = (msg.message_content || "").replace(/\{name\}/g, cleanName(lead.full_name));

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
          message: cleanContent,
          mediaUrl: campaign.global_media_url || null,
          messageId: msg.id,
          delayMin: campaign.delay_min_seconds || 30,
          delayMax: campaign.delay_max_seconds || 120,
          sendWindowStart: campaign.scheduled_time_start || "09:00",
          sendWindowEnd: campaign.scheduled_time_end || "18:00",
        }),
      });

      let sendData = {};
      try { sendData = await sendRes.json(); } catch {}

      if (sendRes.ok && sendData.queued !== false) {
        // עדכן ל-sent מיד
        await base44.asServiceRole.entities.CampaignMessage.update(msg.id, {
          status: "sent",
          sent_at: new Date().toISOString(),
          message_content: cleanContent,
        }).catch(() => null);
        queuedCount++;
      } else {
        await base44.asServiceRole.entities.CampaignMessage.update(msg.id, {
          status: "failed",
          error_message: sendData.error || `HTTP ${sendRes.status}`,
        }).catch(() => null);
        failedCount++;
        console.warn(`[FAIL] ${lead.phone}: HTTP ${sendRes.status}`, sendData);
      }
    }

    // ── שלב 4: עדכן סטטיסטיקות הקמפיין ──
    const updatedMessages = await base44.asServiceRole.entities.CampaignMessage.filter({ campaign_id: campaignId }).catch(() => []);
    const totalSent = updatedMessages.filter(m => ["sent","delivered","opened","replied"].includes(m.status)).length;
    const totalFailed = updatedMessages.filter(m => m.status === "failed").length;
    const totalPending = updatedMessages.filter(m => m.status === "pending").length;
    const newStatus = totalPending === 0 ? "completed" : "running";

    await base44.asServiceRole.entities.Campaign.update(campaignId, {
      sent_count: totalSent,
      failed_count: totalFailed,
      status: newStatus,
    }).catch(() => null);

    console.log(`[DONE] queued=${queuedCount} failed=${failedCount} pending=${totalPending} status=${newStatus}`);

    return Response.json({
      ok: true,
      campaignId,
      queued: queuedCount,
      failed: failedCount,
      total: pendingMessages.length,
      totalSent,
      totalPending,
      campaignStatus: newStatus,
    });

  } catch (error) {
    console.error("[CRITICAL]", error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});