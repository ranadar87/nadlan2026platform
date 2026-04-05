import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    // אמת שהבקשה מ-Railway
    const secret = req.headers.get("x-railway-secret");
    const expectedSecret = Deno.env.get("RAILWAY_API_SECRET");
    if (!secret || secret !== expectedSecret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, sessionId, messageId, status, timestamp, error, data } = body;

    // Handle session_connected event
    if (event === 'session_connected') {
      const userId = sessionId?.replace('user_', '');
      if (!userId) return Response.json({ error: 'Invalid sessionId' }, { status: 400 });
      await base44.asServiceRole.entities.User.update(userId, {
        whatsapp_connected: true,
        whatsapp_phone: data?.phone || null,
        whatsapp_manually_disconnected: false,
        whatsapp_connected_at: new Date().toISOString(),
      });
      return Response.json({ ok: true, event: 'session_connected', userId });
    }

    // Handle session_disconnected event
    if (event === 'session_disconnected') {
      const userId = sessionId?.replace('user_', '');
      if (!userId) return Response.json({ error: 'Invalid sessionId' }, { status: 400 });
      await base44.asServiceRole.entities.User.update(userId, {
        whatsapp_connected: false,
        whatsapp_phone: null,
      });
      return Response.json({ ok: true, event: 'session_disconnected', userId });
    }

    // Handle qr_updated event
    if (event === 'qr_updated') {
      const userId = sessionId?.replace('user_', '');
      if (userId && data?.qr) {
        await base44.asServiceRole.entities.User.update(userId, {
          whatsapp_qr_cache: data.qr,
          whatsapp_qr_updated_at: new Date().toISOString(),
        }).catch(() => null);
      }
      return Response.json({ ok: true, event: 'qr_updated', userId });
    }

    // Handle message status events (existing logic)
    if (!messageId) return Response.json({ error: 'Missing messageId' }, { status: 400 });

    const statusMap = {
      sent: "sent", delivered: "delivered",
      read: "opened", replied: "replied", failed: "failed"
    };
    const dbStatus = statusMap[status] || "pending";

    const updateData = { status: dbStatus };
    if (timestamp) {
      const ts = new Date(timestamp).toISOString();
      if (dbStatus === "sent")      updateData.sent_at      = ts;
      if (dbStatus === "delivered") updateData.delivered_at = ts;
      if (dbStatus === "opened")    updateData.opened_at    = ts;
      if (dbStatus === "replied")   updateData.replied_at   = ts;
    }
    if (error) updateData.error_message = error;

    const messages = await base44.asServiceRole.entities.CampaignMessage.filter({ id: messageId });
    const message = messages[0];
    if (!message) return Response.json({ error: 'Message not found' }, { status: 404 });

    await base44.asServiceRole.entities.CampaignMessage.update(messageId, updateData);

    // עדכן counters בקמפיין
    const campaigns = await base44.asServiceRole.entities.Campaign.filter({ id: message.campaign_id });
    if (campaigns[0]) {
      const allMsgs = await base44.asServiceRole.entities.CampaignMessage.filter({ campaign_id: message.campaign_id });
      await base44.asServiceRole.entities.Campaign.update(message.campaign_id, {
        sent_count:      allMsgs.filter(m => ['sent','delivered','opened','replied'].includes(m.status)).length,
        delivered_count: allMsgs.filter(m => ['delivered','opened','replied'].includes(m.status)).length,
        opened_count:    allMsgs.filter(m => ['opened','replied'].includes(m.status)).length,
        replied_count:   allMsgs.filter(m => m.status === 'replied').length,
        failed_count:    allMsgs.filter(m => m.status === 'failed').length,
      });
    }

    return Response.json({ ok: true, messageId, newStatus: dbStatus });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});