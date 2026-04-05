import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { campaignId, processPending } = await req.json();
    if (!campaignId) return Response.json({ error: 'campaignId נדרש' }, { status: 400 });

    const rawUrl = (Deno.env.get("RAILWAY_URL") || "").replace(/\/$/, "");
    const railwayUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
    const railwaySecret = Deno.env.get("RAILWAY_API_SECRET");
    const appId = Deno.env.get("BASE44_APP_ID");
    const webhookUrl = appId
      ? `https://api.base44.com/api/apps/${appId}/functions/receiveWebhook`
      : null;

    const campaigns = await base44.asServiceRole.entities.Campaign.filter({ id: campaignId });
    if (!campaigns.length) return Response.json({ error: 'קמפיין לא נמצא' }, { status: 404 });
    const campaign = campaigns[0];

    if (campaign.type !== "whatsapp") {
      return Response.json({ error: 'פונקציה זו רק ל-WhatsApp' }, { status: 400 });
    }

    // בדוק session
    const sessionId = `user_${user.id}`;
    const sessionCheck = await fetch(`${railwayUrl}/session/status/${sessionId}`, {
      headers: { Authorization: `Bearer ${railwaySecret}` },
    });
    if (!sessionCheck.ok) return Response.json({ error: 'WhatsApp לא מחובר' }, { status: 400 });
    const sessionData = await sessionCheck.json();
    if (sessionData.status !== "connected") {
      return Response.json({ error: 'WhatsApp לא מחובר — אנא סרוק QR' }, { status: 400 });
    }

    // אם processPending, שלח רק pending messages - אחרת שלח את כל הlead IDs
    let leadsToSend = [];
    if (processPending) {
      const pendingMsgs = await base44.asServiceRole.entities.CampaignMessage.filter({
        campaign_id: campaignId,
        status: "pending",
      });
      const pendingLeadIds = [...new Set(pendingMsgs.map(m => m.lead_id))];
      const fetchedLeads = await Promise.all(
        pendingLeadIds.map(id => base44.asServiceRole.entities.Lead.filter({ id }).then(r => r[0]).catch(() => null))
      );
      leadsToSend = fetchedLeads.filter(l => l && l.phone);
    } else {
      // מצב ישן - שלח את כל ה-target leads
      const leadIds = campaign.target_lead_ids || [];
      const fetchedLeads = await Promise.all(
        leadIds.map(id => base44.asServiceRole.entities.Lead.filter({ id }).then(r => r[0]).catch(() => null))
      );
      leadsToSend = fetchedLeads.filter(l => l && l.phone);
    }

    const variations = (campaign.message_variations || []).filter(v => v.content && v.content.trim());
    if (!leadsToSend.length || !variations.length) {
      return Response.json({ error: 'אין נמענים או תוכן הודעה' }, { status: 400 });
    }

    const leads = await Promise.all(
      leadIds.map(id => base44.asServiceRole.entities.Lead.filter({ id }).then(r => r[0]).catch(() => null))
    );
    const validLeads = leads.filter(l => l && l.phone);

    await base44.asServiceRole.entities.Campaign.update(campaignId, {
      status: "running",
      total_recipients: validLeads.length,
    });

    const messages = [];
    for (let i = 0; i < leadsToSend.length; i++) {
      const lead = leadsToSend[i];
      const variation = variations[i % variations.length];
      const content = (variation.content || "").replace("{name}", lead.full_name || "");

      // אם processPending, חפש אם already יש pending message לlead הזה
      let msg;
      if (processPending) {
        const existing = await base44.asServiceRole.entities.CampaignMessage.filter({
          campaign_id: campaignId,
          lead_id: lead.id,
          status: "pending",
        }).then(r => r[0]).catch(() => null);
        if (existing) {
          msg = existing;
        } else {
          msg = await base44.asServiceRole.entities.CampaignMessage.create({
            campaign_id: campaignId,
            lead_id: lead.id,
            lead_name: lead.full_name,
            lead_phone: lead.phone,
            variation_used: variation.label || "A",
            message_content: content,
            status: "pending",
          });
        }
      } else {
        msg = await base44.asServiceRole.entities.CampaignMessage.create({
          campaign_id: campaignId,
          lead_id: lead.id,
          lead_name: lead.full_name,
          lead_phone: lead.phone,
          variation_used: variation.label || "A",
          message_content: content,
          status: "pending",
        });
      }

      const sendRes = await fetch(`${railwayUrl}/message/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${railwaySecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          to: lead.phone,
          message: content,
          mediaUrl: variation.media_url || campaign.global_media_url || null,
          messageId: msg.id,
          webhookUrl,
          delayMin: campaign.delay_min_seconds || 30,
          delayMax: campaign.delay_max_seconds || 120,
          dailyLimit: campaign.daily_limit || 80,
          sendWindowStart: campaign.scheduled_time_start || "09:00",
          sendWindowEnd: campaign.scheduled_time_end || "18:00",
        }),
      });

      if (!sendRes.ok) {
        const errData = await sendRes.json().catch(() => ({}));
        console.error(`Failed to queue message for ${lead.phone}:`, errData);
        await base44.asServiceRole.entities.CampaignMessage.update(msg.id, {
          status: "failed",
          error_message: errData.error || `HTTP ${sendRes.status}`,
        });
        messages.push({ leadId: lead.id, messageId: msg.id, queued: false });
        continue;
      }
      const sendData = await sendRes.json();
      messages.push({ leadId: lead.id, messageId: msg.id, queued: sendData.queued });
    }

    const successCount = messages.filter(m => m.queued).length;
    return Response.json({ ok: true, campaignId, queued: successCount, total: messages.length, messages });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});