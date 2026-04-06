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

    // ── 0. שחרר הודעות תקועות ב-sending יותר מ-2 דקות ──
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

    // FIX: מצא את כל ההודעות שהגיע זמנן (עד 3 בריצה — מנע overload)
    const dueMessages = pendingMessages.filter(msg => {
      if (!msg.scheduled_at) return true;
      return new Date(msg.scheduled_at) <= now;
    }).slice(0, 3);

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const msg of dueMessages) {

      // ── 2. טען קמפיין ──
      const campaigns = await base44.asServiceRole.entities.Campaign.filter({ id: msg.campaign_id });
      const campaign = campaigns[0];

      if (!campaign || ["paused","completed","stopped"].includes(campaign.status)) {
        skipped++;
        continue;
      }

      // ── 3. בדוק מגבלה יומית (קמפיין + HARD_LIMIT) ──
      const campaignDailyLimit = Math.min(campaign.daily_limit || 50, HARD_DAILY_LIMIT);

      const allCampaignMessages = await base44.asServiceRole.entities.CampaignMessage.filter({ campaign_id: campaign.id });
      const sentToday = allCampaignMessages.filter(m => {
        const isActivelySent = ["sent","delivered","opened","replied"].includes(m.status);
        const sentAt = m.sent_at ? new Date(m.sent_at) : null;
        return isActivelySent && sentAt && sentAt >= todayStart;
      }).length;

      if (sentToday >= campaignDailyLimit) {
        skipped++;
        continue;
      }

      // ── 4. בדוק חיבור WA של בעל הקמפיין ──
      const ownerId = campaign.owner_user_id;
      if (!ownerId) { skipped++; continue; }

      const sessionId = `user_${ownerId}`;
      const sessionRes = await fetch(`${railwayUrl}/session/status/${sessionId}`, {
        headers: { Authorization: `Bearer ${railwaySecret}` },
        signal: AbortSignal.timeout(5000),
      }).catch(() => null);

      if (!sessionRes?.ok) { skipped++; continue; }
      const sessionData = await sessionRes.json().catch(() => ({}));
      if (sessionData.status !== "connected") { skipped++; continue; }

      // ── 5. LOCK: סמן כ-"sending" לפני השליחה — מנע double-send ──
      await base44.asServiceRole.entities.CampaignMessage.update(msg.id, {
        status: "sending",
        sending_started_at: nowISO,
      }).catch(() => null);

      // ── 6. שלח את ההודעה ──
      const sendRes = await fetch(`${railwayUrl}/message/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${railwaySecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          to: normalizePhone(msg.lead_phone),
          message: msg.message_content,
          messageId: msg.id,
          mediaUrl: msg.media_url || null,
          webhookUrl,
        }),
        signal: AbortSignal.timeout(15000),
      }).catch(() => null);

      let sendData = {};
      try { sendData = await sendRes?.json(); } catch {}

      if (sendRes?.ok) {
        // ── 7. עדכן ל-sent ──
        await base44.asServiceRole.entities.CampaignMessage.update(msg.id, {
          status: "sent",
          sent_at: nowISO,
          sending_started_at: null,
        }).catch(() => null);
        sent++;
        console.log(`[SENT] ${msg.lead_phone}`);
      } else {
        // ── 7. עדכן ל-failed ──
        await base44.asServiceRole.entities.CampaignMessage.update(msg.id, {
          status: "failed",
          error_message: sendData?.error || `HTTP ${sendRes?.status || 'timeout'}`,
          sending_started_at: null,
        }).catch(() => null);
        failed++;
      }

      // ── 8. עדכן counters בקמפיין ──
      const freshMsgs = await base44.asServiceRole.entities.CampaignMessage.filter({ campaign_id: campaign.id });
      const sentCount = freshMsgs.filter(m => ["sent","delivered","opened","replied"].includes(m.status)).length;
      const pendingCount = freshMsgs.filter(m => ["pending","sending"].includes(m.status)).length;
      const failedCount = freshMsgs.filter(m => m.status === "failed").length;

      await base44.asServiceRole.entities.Campaign.update(campaign.id, {
        sent_count: sentCount,
        failed_count: failedCount,
        status: pendingCount === 0 ? "completed" : "running",
      }).catch(() => null);
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