import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function normalizePhone(phone) {
  let p = (phone || "").replace(/[\-\s]/g, "");
  if (p.startsWith("0")) p = "972" + p.slice(1);
  return p;
}

function cleanName(name) {
  return (name || "").replace(/[{}]/g, "").trim();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { campaignId } = body;
    if (!campaignId) return Response.json({ error: 'campaignId נדרש' }, { status: 400 });

    // טען קמפיין
    const campaigns = await base44.asServiceRole.entities.Campaign.filter({ id: campaignId });
    if (!campaigns.length) return Response.json({ error: 'קמפיין לא נמצא' }, { status: 404 });
    const campaign = campaigns[0];

    if (campaign.type !== "whatsapp") return Response.json({ error: 'פונקציה זו רק ל-WhatsApp' }, { status: 400 });

    const variations = (campaign.message_variations || []).filter(v => v.content && v.content.trim());
    if (!variations.length) return Response.json({ error: 'אין תוכן הודעה' }, { status: 400 });

    const leadIds = campaign.target_lead_ids || [];
    if (!leadIds.length) return Response.json({ error: 'אין נמענים' }, { status: 400 });

    // שמור owner_user_id בקמפיין (נדרש ל-processPendingCampaigns)
    if (!campaign.owner_user_id) {
      await base44.asServiceRole.entities.Campaign.update(campaignId, { owner_user_id: user.id }).catch(() => null);
    }

    // בדוק אם כבר נוצרו messages לקמפיין
    const existingMessages = await base44.asServiceRole.entities.CampaignMessage.filter({ campaign_id: campaignId });
    if (existingMessages.length) {
      return Response.json({ ok: true, queued: existingMessages.length, message: 'הודעות כבר תוזמנו' });
    }

    // טען לידים
    const fetchedLeads = await Promise.all(
      leadIds.map(id => base44.asServiceRole.entities.Lead.filter({ id }).then(r => r[0]).catch(() => null))
    );
    const validLeads = fetchedLeads.filter(l => l && l.phone);

    if (!validLeads.length) return Response.json({ error: 'לא נמצאו לידים עם טלפון' }, { status: 400 });

    // חשב זמני שליחה — הודעה ראשונה מיד, שאר עם delay מצטבר
    const now = new Date();
    const delayMin = (campaign.delay_min_seconds || 600);
    const delayMax = (campaign.delay_max_seconds || 900);
    const messages = [];

    let cumulativeDelay = 0; // בשניות

    for (let i = 0; i < validLeads.length; i++) {
      const lead = validLeads[i];
      const variation = variations[i % variations.length];
      const content = (variation.content || "")
        .replace(/\{name\}/g, cleanName(lead.full_name))
        .replace(/\{phone\}/g, normalizePhone(lead.phone));

      // FIX: חשב scheduledAt לפי cumulativeDelay הנוכחי
      const scheduledAt = new Date(now.getTime() + cumulativeDelay * 1000).toISOString();

      // FIX: הוסף delay לפני החישוב של ההודעה הבאה
      const jitter = Math.floor(Math.random() * (delayMax - delayMin)) + delayMin;
      cumulativeDelay += jitter;

      const msg = await base44.asServiceRole.entities.CampaignMessage.create({
        campaign_id: campaignId,
        lead_id: lead.id,
        lead_name: lead.full_name,
        lead_phone: normalizePhone(lead.phone),
        variation_used: variation.label || "A",
        message_content: content,
        media_url: variation.media_url || campaign.global_media_url || null,
        status: "pending",
        scheduled_at: scheduledAt,
      });

      messages.push({ leadId: lead.id, messageId: msg.id, scheduledAt });
    }

    await base44.asServiceRole.entities.Campaign.update(campaignId, {
      status: "running",
      total_recipients: validLeads.length,
      sent_count: 0,
      failed_count: 0,
    });

    console.log(`[INIT] Campaign ${campaignId}: created ${messages.length} scheduled messages`);

    return Response.json({
      ok: true,
      campaignId,
      queued: messages.length,
      message: `${messages.length} הודעות תוזמנו — ה-Cron ישלח אחת כל ${delayMin}-${delayMax} שניות`,
    });

  } catch (error) {
    console.error("[sendWABulk ERROR]", error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});