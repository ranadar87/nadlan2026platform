import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // קבל את כל הקמפיינים הפעילים
    const activeCampaigns = await base44.asServiceRole.entities.Campaign.filter({ status: "running" });
    
    if (!activeCampaigns.length) {
      return Response.json({ ok: true, processed: 0, message: "אין קמפיינים פעילים" });
    }

    const results = [];

    for (const campaign of activeCampaigns) {
      // בדוק אם יש הודעות בסטטוס pending
      const pendingMessages = await base44.asServiceRole.entities.CampaignMessage.filter({
        campaign_id: campaign.id,
        status: "pending",
      });

      if (!pendingMessages.length) {
        // אם אין pending messages יותר, עדכן סטטוס לcompleted
        if (campaign.sent_count >= campaign.total_recipients) {
          await base44.asServiceRole.entities.Campaign.update(campaign.id, { status: "completed" });
        }
        results.push({ campaignId: campaign.id, action: "no_pending", count: 0 });
        continue;
      }

      // יש pending messages - קרא ל-sendWABulk עם דגל כדי לשלוח גם קיימות
      try {
        const sendResponse = await base44.asServiceRole.functions.invoke("sendWABulk", {
          campaignId: campaign.id,
          processPending: true,
        });

        results.push({
          campaignId: campaign.id,
          action: "sent",
          queued: sendResponse.queued,
          total: sendResponse.total,
        });
      } catch (invokeError) {
        console.error(`Error sending campaign ${campaign.id}:`, invokeError.message);
        results.push({
          campaignId: campaign.id,
          action: "error",
          error: invokeError.message,
        });
      }
    }

    return Response.json({
      ok: true,
      processed: activeCampaigns.length,
      results,
    });
  } catch (error) {
    console.error("processPendingCampaigns error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});