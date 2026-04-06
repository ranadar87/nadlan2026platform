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
    const currentTimeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // ── 1. מצא את כל הודעות ה-pending ──
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

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const msg of pendingMessages) {

      // ── 2. טען קמפיין ──
      const campaigns = await base44.asServiceRole.entities.Campaign.filter({ id: msg.campaign_id });
      const campaign = campaigns[0];

      if (!campaign || campaign.status === "paused" || campaign.status === "completed" || campaign.status === "stopped") {
        skipped++;
        continue;
      }

      // ── 3. בדוק scheduled_at תחילה — אם קבוע, בדוק אם הגיע הזמן ──
      if (msg.scheduled_at) {
        const scheduledAt = new Date(msg.scheduled_at);
        if (scheduledAt > now) {
          skipped++;
          continue;
        }
      } else {
        // אם לא קבוע, בדוק חלון שעות כללי ──
        const windowStart = campaign.scheduled_time_start || "09:00";
        const windowEnd = campaign.scheduled_time_end || "18:00";
        if (currentTimeStr < windowStart || currentTimeStr > windowEnd) {
          skipped++;
          continue;
        }
      }

      // ── 4. בדוק מגבלה יומית (קמפיין + HARD_LIMIT) ──
      const campaignDailyLimit = Math.min(campaign.daily_limit || 50, HARD_DAILY_LIMIT);

      const allCampaignMessages = await base44.asServiceRole.entities.CampaignMessage.filter({ campaign_id: campaign.id });
      const sentToday = allCampaignMessages.filter(m => {
        const isActivelySent = ["sent","delivered","opened","replied"].includes(m.status);
        const sentAt = m.sent_at ? new Date(m.sent_at) : null;
        return isActivelySent && sentAt && sentAt >= todayStart;
      }).length;

      if (sentToday >= campaignDailyLimit) {
        console.log(`[DAILY_LIMIT] Campaign ${campaign.id}: ${sentToday}/${campaignDailyLimit} today`);
        skipped++;
        continue;
      }

      // ── 6. בדוק חיבור WA של בעל הקמפיין ──
      const ownerId = campaign.owner_user_id;
      if (!ownerId) {
        console.warn(`[NO_OWNER_ID] Campaign ${campaign.id}: missing owner_user_id`);
        skipped++;
        continue;
      }
      const sessionId = `user_${ownerId}`;
      const sessionRes = await fetch(`${railwayUrl}/session/status/${sessionId}`, {
        headers: { Authorization: `Bearer ${railwaySecret}` },
        signal: AbortSignal.timeout(5000),
      }).catch(() => null);

      if (!sessionRes?.ok) {
        console.warn(`[NO_SESSION] Campaign ${campaign.id}: WA session not found`);
        skipped++;
        continue;
      }

      const sessionData = await sessionRes.json().catch(() => ({}));
      if (sessionData.status !== "connected") {
        console.warn(`[DISCONNECTED] Campaign ${campaign.id}: WA not connected`);
        skipped++;
        continue;
      }

      // ── 7. שלח את ההודעה ──
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
          to: normalizePhone(msg.lead_phone),
          message: msg.message_content,
          messageId: msg.id,
          mediaUrl: msg.media_url || null,
        }),
        signal: AbortSignal.timeout(15000),
      }).catch(() => null);

      let sendData = {};
      try { sendData = await sendRes?.json(); } catch {}

      if (sendRes?.ok) {
        // ── 8. עדכן ל-sent ──
        await base44.asServiceRole.entities.CampaignMessage.update(msg.id, {
          status: "sent",
          sent_at: nowISO,
        }).catch(() => null);

        sent++;
        console.log(`[SENT] ${msg.lead_phone} (campaign ${campaign.id})`);

        // ── 9. עדכן counters בקמפיין ──
        const freshMessages = await base44.asServiceRole.entities.CampaignMessage.filter({ campaign_id: campaign.id });
        const sentCount = freshMessages.filter(m => ["sent","delivered","opened","replied"].includes(m.status)).length;
        const pendingCount = freshMessages.filter(m => m.status === "pending").length;
        const failedCount = freshMessages.filter(m => m.status === "failed").length;

        await base44.asServiceRole.entities.Campaign.update(campaign.id, {
          sent_count: sentCount,
          failed_count: failedCount,
          status: pendingCount === 0 ? "completed" : "running",
        }).catch(() => null);

        if (pendingCount === 0) {
          console.log(`[COMPLETED] Campaign ${campaign.id} finished`);
        }

      } else {
        await base44.asServiceRole.entities.CampaignMessage.update(msg.id, {
          status: "failed",
          error_message: sendData?.error || `HTTP ${sendRes?.status || 'timeout'}`,
        }).catch(() => null);

        failed++;
        console.warn(`[FAIL] ${msg.lead_phone}: ${sendData?.error || 'no response'}`);
      }

      // שלח רק הודעה אחת בכל ריצה — ה-Cron יטפל בשאר
      break;
    }

    return Response.json({
      ok: true,
      processed: sent,
      skipped,
      failed,
      timestamp: nowISO,
    });

  } catch (error) {
    console.error("[processPendingCampaigns ERROR]", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});