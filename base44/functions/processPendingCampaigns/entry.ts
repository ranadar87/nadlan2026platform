import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const HARD_DAILY_LIMIT = 80;

function normalizePhone(phone) {
  let p = (phone || "").replace(/[\-\s]/g, "");
  if (p.startsWith("0")) p = "972" + p.slice(1);
  return p;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const rawUrl = (Deno.env.get("RAILWAY_URL") || "").replace(/\/$/, "");
    const railwayUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
    const railwaySecret = Deno.env.get("RAILWAY_API_SECRET");
    const webhookUrl = Deno.env.get("BASE44_WEBHOOK_URL");

    if (!webhookUrl) return Response.json({ error: 'Missing BASE44_WEBHOOK_URL' }, { status: 500 });

    const now = new Date();
    const nowISO = now.toISOString();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // שחרר הודעות תקועות ב-sending יותר מ-2 דקות
    const stuckTime = new Date(now.getTime() - 2 * 60 * 1000).toISOString();
    const stuckMessages = await base44.asServiceRole.entities.CampaignMessage.filter({ status: "sending" });
    for (const stuck of stuckMessages) {
      if (stuck.sending_started_at && stuck.sending_started_at < stuckTime) {
        await base44.asServiceRole.entities.CampaignMessage.update(stuck.id, {
          status: "pending",
          sending_started_at: null,
        }).catch(() => null);
        console.log(`[UNSTUCK] Released stuck message: ${stuck.id}`);
      }
    }

    // מצא את כל ההודעות ה-pending
    const pendingMessages = await base44.asServiceRole.entities.CampaignMessage.filter({ status: "pending" });

    if (!pendingMessages.length) {
      return Response.json({ ok: true, processed: 0, message: "אין הודעות ממתינות" });
    }

    // מיין לפי scheduled_at — הכי קרובות קודם
    pendingMessages.sort((a, b) => {
      const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
      const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
      return ta - tb;
    });

    // קח רק הודעה אחת שהגיע זמנה
    const nextDue = pendingMessages.find(msg => {
      // בדוק זמן scheduled_at
      if (msg.scheduled_at && new Date(msg.scheduled_at) > now) return false;
      return true;
    });

    if (!nextDue) {
      return Response.json({ ok: true, processed: 0, message: "אין הודעות שהגיע זמנן עדיין" });
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    // טען קמפיין
    const campaigns = await base44.asServiceRole.entities.Campaign.filter({ id: nextDue.campaign_id });
    const campaign = campaigns[0];

    if (!campaign || ["paused","completed","stopped"].includes(campaign.status)) {
      return Response.json({ ok: true, processed: 0, skipped: 1, message: "קמפיין לא פעיל" });
    }

    // בדוק מגבלה יומית
    const campaignDailyLimit = Math.min(campaign.limit_daily || 80, HARD_DAILY_LIMIT);

    const allCampaignMessages = await base44.asServiceRole.entities.CampaignMessage.filter({ campaign_id: campaign.id });
    const sentToday = allCampaignMessages.filter(m => {
      const isActivelySent = ["sent","delivered","opened","replied"].includes(m.status);
      const sentAt = m.sent_at ? new Date(m.sent_at) : null;
      return isActivelySent && sentAt && sentAt >= todayStart;
    }).length;

    if (sentToday >= campaignDailyLimit) {
      return Response.json({ ok: true, processed: 0, skipped: 1, message: `הגדנו מגבלה יומית (${sentToday}/${campaignDailyLimit})` });
    }

    // FIX 4: בדוק חלון שעות רק אם ה-scheduled_at לא הוגדר
    // (אם הוגדר scheduled_at מפורש — כבד אותו ושלח)
    if (!nextDue.scheduled_at) {
      const windowStart = campaign.scheduled_time_start || "09:00";
      const windowEnd = campaign.scheduled_time_end || "18:00";
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (currentTimeStr < windowStart || currentTimeStr > windowEnd) {
        return Response.json({ ok: true, processed: 0, skipped: 1, message: `יוצא מחלון השעות ${windowStart}–${windowEnd}` });
      }
    }

    // בדוק חיבור WA
    const ownerId = campaign.owner_user_id;
    if (!ownerId) {
      return Response.json({ ok: true, processed: 0, skipped: 1, message: "קמפיין ללא בעלים" });
    }

    const sessionId = `user_${ownerId}`;
    const sessionRes = await fetch(`${railwayUrl}/session/status/${sessionId}`, {
      headers: { Authorization: `Bearer ${railwaySecret}` },
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);

    if (!sessionRes?.ok) {
      return Response.json({ ok: true, processed: 0, skipped: 1, message: "WA session לא נמצא" });
    }

    const sessionData = await sessionRes.json().catch(() => ({}));
    if (sessionData.status !== "connected") {
      return Response.json({ ok: true, processed: 0, skipped: 1, message: "WA לא מחובר" });
    }

    // סמן כ-sending
    await base44.asServiceRole.entities.CampaignMessage.update(nextDue.id, {
      status: "sending",
      sending_started_at: nowISO,
    }).catch(() => null);

    // נקי סוגריים מהודעה לפני שליחה
    let msgToSend = nextDue.message_content;
    msgToSend = msgToSend.replace(/\{[^}]*\}/g, "").trim();

    // שלח
    const sendRes = await fetch(`${railwayUrl}/message/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${railwaySecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        to: normalizePhone(nextDue.lead_phone),
        message: msgToSend,
        messageId: nextDue.id,
        mediaUrl: nextDue.media_url || null,
        webhookUrl,
      }),
      signal: AbortSignal.timeout(15000),
    }).catch(() => null);

    let sendData = {};
    try { sendData = await sendRes?.json(); } catch {}

    if (sendRes?.ok) {
      await base44.asServiceRole.entities.CampaignMessage.update(nextDue.id, {
        status: "sent",
        sent_at: nowISO,
        sending_started_at: null,
      }).catch(() => null);
      sent = 1;
      console.log(`[SENT] ${nextDue.lead_phone}`);
    } else {
      const errorMsg = sendData?.error || `HTTP ${sendRes?.status || 'timeout'}`;
      await base44.asServiceRole.entities.CampaignMessage.update(nextDue.id, {
        status: "failed",
        message_error: errorMsg,
        sending_started_at: null,
      }).catch(() => null);
      failed = 1;
      console.error(`[FAIL] ${nextDue.lead_phone}: ${errorMsg}`);
    }

    // עדכן counters
    const freshMsgs = await base44.asServiceRole.entities.CampaignMessage.filter({ campaign_id: campaign.id });
    const sentCount = freshMsgs.filter(m => ["sent","delivered","opened","replied"].includes(m.status)).length;
    const pendingCount = freshMsgs.filter(m => ["pending","sending"].includes(m.status)).length;
    const failedCount = freshMsgs.filter(m => m.status === "failed").length;

    await base44.asServiceRole.entities.Campaign.update(campaign.id, {
      sent_count: sentCount,
      failed_count: failedCount,
      status: pendingCount === 0 ? "completed" : "running",
    }).catch(() => null);

    return Response.json({
      ok: true,
      processed: sent,
      failed,
      timestamp: nowISO,
    });

  } catch (error) {
    console.error("[processPendingCampaigns ERROR]", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});