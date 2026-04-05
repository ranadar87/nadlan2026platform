import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Railway → BASE44: מקבל כל אירוע WhatsApp ומעדכן DB
Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { event, data } = body;

    const base44 = createClientFromRequest(req);

    // message_id ב-Railway = campaign_message_id ב-BASE44
    const messageId = data?.message_id;
    if (!messageId) {
      return Response.json({ ok: true, skipped: true });
    }

    const statusMap = {
      "message.sent": "sent",
      "message.delivered": "delivered",
      "message.read": "opened",
      "message.replied": "replied",
      "message.failed": "failed",
    };

    const newStatus = statusMap[event];
    if (!newStatus) {
      return Response.json({ ok: true, skipped: true });
    }

    const timeField = {
      sent: "sent_at",
      delivered: "delivered_at",
      opened: "opened_at",
      replied: "replied_at",
    }[newStatus];

    const updateData = { status: newStatus };
    if (timeField) updateData[timeField] = new Date().toISOString();
    if (newStatus === "failed") updateData.error_message = data?.error || "שליחה נכשלה";

    // קבל campaign_id לפני העדכון כדי למנוע query נוסף
    const messageData = await base44.asServiceRole.entities.CampaignMessage.filter({ id: messageId }).then(r => r[0]);
    if (!messageData) return Response.json({ ok: true });
    
    const campaignId = messageData.campaign_id;
    
    // עדכן את ההודעה
    await base44.asServiceRole.entities.CampaignMessage.update(messageId, updateData);

    // עדכן counters בקמפיין
    const allMsgs = await base44.asServiceRole.entities.CampaignMessage.filter({ campaign_id: campaignId });
    const counts = {
      sent_count: allMsgs.filter(m => ["sent", "delivered", "opened", "replied"].includes(m.status)).length,
      delivered_count: allMsgs.filter(m => ["delivered", "opened", "replied"].includes(m.status)).length,
      opened_count: allMsgs.filter(m => ["opened", "replied"].includes(m.status)).length,
      replied_count: allMsgs.filter(m => m.status === "replied").length,
      failed_count: allMsgs.filter(m => m.status === "failed").length,
    };
    await base44.asServiceRole.entities.Campaign.update(campaignId, counts)

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});