import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // בדוק x-railway-secret header
    const railwaySecret = Deno.env.get("RAILWAY_API_SECRET");
    const headerSecret = req.headers.get("x-railway-secret");

    if (!headerSecret || headerSecret !== railwaySecret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return Response.json({ error: 'sessionId נדרש' }, { status: 400 });
    }

    // זהה userId מ-sessionId
    const userMatch = sessionId.match(/^user_(.+)$/);
    if (!userMatch) {
      return Response.json({ error: 'Invalid sessionId' }, { status: 400 });
    }
    const userId = userMatch[1];

    // בדוק שהמשתמש קיים וחובר
    const users = await base44.asServiceRole.entities.User.filter({ id: userId });
    if (!users.length || !users[0].whatsapp_connected) {
      return Response.json({ error: 'User not connected' }, { status: 400 });
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // שחרר הודעות תקועות ב-sending יותר מ-3 דקות
    const stuckTime = new Date(now.getTime() - 3 * 60 * 1000).toISOString();
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

    // מצא קמפיינים פעילים של המשתמש
    const campaigns = await base44.asServiceRole.entities.Campaign.filter({
      owner_user_id: userId,
      status: "running"
    });

    if (!campaigns.length) {
      return Response.json({ ok: true, message: 'אין קמפיינים פעילים' });
    }

    const campaignIds = new Set(campaigns.map(c => c.id));

    // מצא הודעות pending
    const allPending = await base44.asServiceRole.entities.CampaignMessage.filter({ status: "pending" });
    const pendingForUser = allPending.filter(m => campaignIds.has(m.campaign_id));

    if (!pendingForUser.length) {
      return Response.json({ ok: true, message: 'אין הודעות ממתינות' });
    }

    // מיין לפי scheduled_at
    pendingForUser.sort((a, b) => {
      const ta = a.at_scheduled ? new Date(a.at_scheduled).getTime() : 0;
      const tb = b.at_scheduled ? new Date(b.at_scheduled).getTime() : 0;
      return ta - tb;
    });

    // מצא הודעה אחת שהגיע זמנה
    const nextDue = pendingForUser.find(msg => {
      if (!msg.at_scheduled) return true; // בלי זמן — שלח מיד
      return new Date(msg.at_scheduled) <= now;
    });

    if (!nextDue) {
      return Response.json({ ok: true, message: 'הודעה הבאה לא הגיעה לזמנה עדיין' });
    }

    // בדוק daily limit
    const campaign = campaigns.find(c => c.id === nextDue.campaign_id);
    if (!campaign) {
      return Response.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const dailyLimit = Math.min(campaign.limit_daily || 50, 80);
    const campaignMsgs = allPending.filter(m => m.campaign_id === campaign.id);
    const sentToday = campaignMsgs.filter(m => {
      const isActivelySent = ["sent", "delivered", "opened", "replied"].includes(m.status);
      const sentAt = m.sent_at ? new Date(m.sent_at) : null;
      return isActivelySent && sentAt && sentAt >= todayStart;
    }).length;

    if (sentToday >= dailyLimit) {
      return Response.json({ 
        ok: true, 
        skipped: 1,
        message: `הגדנו מגבלה יומית (${sentToday}/${dailyLimit})`
      });
    }

    // נעל את ההודעה ל-sending
    await base44.asServiceRole.entities.CampaignMessage.update(nextDue.id, {
      status: "sending",
      sending_started_at: now.toISOString(),
    }).catch(() => null);

    // החזר את ההודעה עבור Railway
    return Response.json({
      message: {
        id: nextDue.id,
        campaignId: nextDue.campaign_id,
        to: nextDue.lead_phone,
        text: nextDue.message_content,
        mediaUrl: nextDue.url_media || null
      }
    });

  } catch (error) {
    console.error("[getNextDueMessage ERROR]", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});