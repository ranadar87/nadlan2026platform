import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function normalizePhone(phone) {
  let p = (phone || "").replace(/[\-\s]/g, "");
  if (p.startsWith("0")) p = "972" + p.slice(1);
  return p;
}

function cleanName(name) {
  return (name || "").replace(/[{}]/g, "").trim();
}

// FIX 3: קבע את הזמן הבא שנמצא בתוך חלון השעות
function nextSlotInWindow(fromDate, windowStart, windowEnd) {
  const [startH, startM] = (windowStart || "09:00").split(":").map(Number);
  const [endH, endM] = (windowEnd || "18:00").split(":").map(Number);
  
  const d = new Date(fromDate);
  const curMins = d.getHours() * 60 + d.getMinutes();
  const startMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;
  
  if (curMins >= startMins && curMins < endMins) {
    return d; // כבר בתוך החלון
  }
  
  // חוץ מהחלון — קפוץ לתחילת החלון מחר
  const next = new Date(d);
  next.setDate(next.getDate() + (curMins >= endMins ? 1 : 0));
  next.setHours(startH, startM, 0, 0);
  return next;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { campaignId } = body;
    if (!campaignId) return Response.json({ error: 'campaignId נדרש' }, { status: 400 });

    const campaigns = await base44.asServiceRole.entities.Campaign.filter({ id: campaignId });
    if (!campaigns.length) return Response.json({ error: 'קמפיין לא נמצא' }, { status: 404 });
    const campaign = campaigns[0];

    if (campaign.type !== "whatsapp") return Response.json({ error: 'פונקציה זו רק ל-WhatsApp' }, { status: 400 });

    const variations = (campaign.message_variations || []).filter(v => v.content && v.content.trim());
    if (!variations.length) return Response.json({ error: 'אין תוכן הודעה' }, { status: 400 });

    const leadIds = campaign.target_lead_ids || [];
    if (!leadIds.length) return Response.json({ error: 'אין נמענים' }, { status: 400 });

    if (!campaign.owner_user_id) {
      await base44.asServiceRole.entities.Campaign.update(campaignId, { owner_user_id: user.id }).catch(() => null);
    }

    const existingMessages = await base44.asServiceRole.entities.CampaignMessage.filter({ campaign_id: campaignId });
    if (existingMessages.length) {
      return Response.json({ ok: true, queued: existingMessages.length, message: 'הודעות כבר תוזמנו' });
    }

    const fetchedLeads = await Promise.all(
      leadIds.map(id => base44.asServiceRole.entities.Lead.filter({ id }).then(r => r[0]).catch(() => null))
    );
    const validLeads = fetchedLeads.filter(l => l && l.phone);

    if (!validLeads.length) return Response.json({ error: 'לא נמצאו לידים עם טלפון' }, { status: 400 });

    const now = new Date();
    const delayMin = campaign.delay_min_seconds || 600;
    const delayMax = campaign.delay_max_seconds || 900;
    const windowStart = campaign.scheduled_time_start || "09:00";
    const windowEnd = campaign.scheduled_time_end || "18:00";

    // FIX 2: קבע זמן בסיס לפי start_immediately או scheduled_date
    let baseTime;
    if (campaign.start_immediately) {
      // התחל מיד — אבל רק אם בתוך חלון השעות
      baseTime = nextSlotInWindow(now, windowStart, windowEnd);
    } else if (campaign.scheduled_date) {
      // תאריך ושעה שנבחרו ידנית
      const [startH, startM] = windowStart.split(":").map(Number);
      baseTime = new Date(campaign.scheduled_date);
      baseTime.setHours(startH, startM, 0, 0);
      // אם הזמן כבר עבר — קפוץ ליום הבא
      if (baseTime < now) {
        baseTime.setDate(baseTime.getDate() + 1);
      }
    } else {
      // ברירת מחדל: מחר בתחילת החלון
      baseTime = new Date(now);
      baseTime.setDate(baseTime.getDate() + 1);
      const [sh, sm] = windowStart.split(":").map(Number);
      baseTime.setHours(sh, sm, 0, 0);
    }

    const messages = [];
    let cursor = new Date(baseTime); // cursor = הזמן הנוכחי לחישוב הנוכחי

    for (let i = 0; i < validLeads.length; i++) {
      const lead = validLeads[i];
      const variation = variations[i % variations.length];
      const content = (variation.content || "")
        .replace(/\{name\}/g, cleanName(lead.full_name))
        .replace(/\{phone\}/g, normalizePhone(lead.phone));

      // FIX 3: ודא ש-cursor נמצא בתוך חלון השעות
      cursor = nextSlotInWindow(cursor, windowStart, windowEnd);
      const scheduledAt = cursor.toISOString();

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

      // הוסף delay אקראי לcursor הבא
      const jitter = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
      cursor = new Date(cursor.getTime() + jitter * 1000);
    }

    await base44.asServiceRole.entities.Campaign.update(campaignId, {
      status: "running",
      total_recipients: validLeads.length,
      sent_count: 0,
      failed_count: 0,
    });

    const firstAt = messages[0]?.scheduledAt ? new Date(messages[0].scheduledAt).toLocaleTimeString("he-IL") : "—";
    const lastAt = messages[messages.length-1]?.scheduledAt ? new Date(messages[messages.length-1].scheduledAt).toLocaleDateString("he-IL") : "—";

    console.log(`[INIT] Campaign ${campaignId}: ${messages.length} messages scheduled. First: ${firstAt}, Last day: ${lastAt}`);

    return Response.json({
      ok: true,
      campaignId,
      queued: messages.length,
      firstMessage: messages[0]?.scheduledAt,
      lastMessage: messages[messages.length-1]?.scheduledAt,
      message: `${messages.length} הודעות תוזמנו בחלון ${windowStart}–${windowEnd}`,
    });

  } catch (error) {
    console.error("[sendWABulk ERROR]", error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});