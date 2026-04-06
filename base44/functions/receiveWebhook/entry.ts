import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    // בדוק x-railway-secret header
    const railwaySecret = Deno.env.get("RAILWAY_API_SECRET");
    const headerSecret = req.headers.get("x-railway-secret");

    if (!headerSecret || headerSecret !== railwaySecret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { event, data } = body;

    if (!event || !data) {
      return Response.json({ error: "Missing event or data" }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // חלץ userId מ-sessionId
    const sessionId = data.sessionId || "";
    const userMatch = sessionId.match(/^user_(.+)$/);
    if (!userMatch) {
      return Response.json({ error: "Invalid sessionId format" }, { status: 400 });
    }
    const userId = userMatch[1];

    // טיפול באירועים שונים
    if (event === "qr_updated") {
      // לעדכן whatsapp_qr_cache ו-whatsapp_qr_updated_at
      await base44.asServiceRole.entities.User.update(userId, {
        whatsapp_qr_cache: data.qr || null,
        whatsapp_qr_updated_at: new Date().toISOString()
      }).catch(() => null);

      return Response.json({ ok: true, message: "QR updated" });
    }

    if (event === "session_connected") {
      // עדכן User entity
      await base44.asServiceRole.entities.User.update(userId, {
        whatsapp_connected: true,
        whatsapp_phone: data.phone || null,
        whatsapp_connected_at: new Date().toISOString(),
        whatsapp_manually_disconnected: false
      }).catch(() => null);

      return Response.json({ ok: true, message: "Session connected" });
    }

    if (event === "session_disconnected") {
      // אפס חיבור אבל לא תעדכן whatsapp_manually_disconnected
      // (הוא יתעדכן רק כשהמשתמש יבחר לנתק)
      await base44.asServiceRole.entities.User.update(userId, {
        whatsapp_connected: false,
        whatsapp_phone: null
      }).catch(() => null);

      return Response.json({ ok: true, message: "Session disconnected" });
    }

    if (event === "session_failed") {
      // שמור metadata של failure בלוגים או ב-User metadata
      console.error("Session failed for user:", userId, data);

      return Response.json({ ok: true, message: "Session failure logged" });
    }

    // webhook משיגי הודעות
    if (event === "status") {
      const { messageId, status, timestamp } = data;

      if (!messageId || !status) {
        return Response.json({ error: "Missing messageId or status" }, { status: 400 });
      }

      // מצא את ה-CampaignMessage
      const messages = await base44.asServiceRole.entities.CampaignMessage.filter(
        { id: messageId },
        "-created_date",
        1
      ).catch(() => []);

      if (!messages.length) {
        return Response.json({ error: "Message not found" }, { status: 404 });
      }

      const msg = messages[0];
      const now = new Date().toISOString();
      const updates = {};

      // מיפוי status לשדות
      if (status === "sent") {
        updates.status = "sent";
        updates.sent_at = timestamp || now;
      } else if (status === "delivered") {
        updates.status = "delivered";
        updates.delivered_at = timestamp || now;
      } else if (status === "read" || status === "opened") {
        updates.status = "opened";
        updates.opened_at = timestamp || now;
      } else if (status === "replied") {
        updates.status = "replied";
        updates.replied_at = timestamp || now;
      } else if (status === "failed") {
        updates.status = "failed";
        updates.message_error = data.error || "Unknown error";
      }

      // עדכן את ה-message
      await base44.asServiceRole.entities.CampaignMessage.update(messageId, updates).catch(() => null);

      // עדכן counters בקמפיין
      if (msg.campaign_id) {
        const campaigns = await base44.asServiceRole.entities.Campaign.filter(
          { id: msg.campaign_id },
          "-created_date",
          1
        ).catch(() => []);

        if (campaigns.length) {
          const campaign = campaigns[0];
          const allMsgs = await base44.asServiceRole.entities.CampaignMessage.filter(
            { campaign_id: msg.campaign_id }
          ).catch(() => []);

          const counters = {
            sent_count: allMsgs.filter(m => ["sent", "delivered", "opened", "replied"].includes(m.status)).length,
            delivered_count: allMsgs.filter(m => ["delivered", "opened", "replied"].includes(m.status)).length,
            opened_count: allMsgs.filter(m => ["opened", "replied"].includes(m.status)).length,
            replied_count: allMsgs.filter(m => m.status === "replied").length,
            failed_count: allMsgs.filter(m => m.status === "failed").length,
          };

          await base44.asServiceRole.entities.Campaign.update(msg.campaign_id, counters).catch(() => null);
        }
      }

      return Response.json({ ok: true, message: "Message status updated" });
    }

    return Response.json({ error: "Unknown event" }, { status: 400 });

  } catch (error) {
    console.error("receiveWebhook error:", error);
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
});