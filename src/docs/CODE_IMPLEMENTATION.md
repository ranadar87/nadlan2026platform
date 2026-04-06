# קוד — יישום אלגוריתם התזמון

## 1. יצירת הודעות - `functions/sendWABulk`

### מטרה
קוד זה רץ כשהמשתמש לוחץ "שגר קמפיין" או "התחל עכשיו".  
יוצר רשומות `CampaignMessage` עם זמנים מתוזמנים (`scheduled_at`).

### קוד מלא

```javascript
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

    // [STEP 1] טען קמפיין
    const campaigns = await base44.asServiceRole.entities.Campaign.filter({ id: campaignId });
    if (!campaigns.length) return Response.json({ error: 'קמפיין לא נמצא' }, { status: 404 });
    const campaign = campaigns[0];

    if (campaign.type !== "whatsapp") return Response.json({ error: 'פונקציה זו רק ל-WhatsApp' }, { status: 400 });

    // [STEP 2] בדוק תוכן הודעה
    const variations = (campaign.message_variations || []).filter(v => v.content && v.content.trim());
    if (!variations.length) return Response.json({ error: 'אין תוכן הודעה' }, { status: 400 });

    const leadIds = campaign.target_lead_ids || [];
    if (!leadIds.length) return Response.json({ error: 'אין נמענים' }, { status: 400 });

    // [STEP 3] שמור owner_user_id בקמפיין
    // זה נדרש כדי processPendingCampaigns יידע מיהו בעל הקמפיין ב-Railway
    if (!campaign.owner_user_id) {
      await base44.asServiceRole.entities.Campaign.update(campaignId, { owner_user_id: user.id }).catch(() => null);
    }

    // [STEP 4] בדוק אם כבר נוצרו messages לקמפיין
    // מניעת יצירת כפול
    const existingMessages = await base44.asServiceRole.entities.CampaignMessage.filter({ campaign_id: campaignId });
    if (existingMessages.length) {
      return Response.json({ ok: true, queued: existingMessages.length, message: 'הודעות כבר תוזמנו' });
    }

    // [STEP 5] טען את כל הלידים
    const fetchedLeads = await Promise.all(
      leadIds.map(id => base44.asServiceRole.entities.Lead.filter({ id }).then(r => r[0]).catch(() => null))
    );
    const validLeads = fetchedLeads.filter(l => l && l.phone);

    if (!validLeads.length) return Response.json({ error: 'לא נמצאו לידים עם טלפון' }, { status: 400 });

    // [STEP 6] חשב זמנים לשליחה
    const now = new Date();
    const delayMin = (campaign.delay_min_seconds || 600);     // ברירת מחדל 10 דק
    const delayMax = (campaign.delay_max_seconds || 900);     // ברירת מחדל 15 דק
    const messages = [];
    let cumulativeDelay = 0; // סוכם השהיות בשניות

    for (let i = 0; i < validLeads.length; i++) {
      const lead = validLeads[i];
      const variation = variations[i % variations.length]; // סיבוב על וריאציות A, B, C...

      // [STEP 6a] החלף placeholders בתוכן
      const content = (variation.content || "")
        .replace(/\{name\}/g, cleanName(lead.full_name))
        .replace(/\{phone\}/g, normalizePhone(lead.phone));

      // [STEP 6b] חשב scheduled_at
      // הודעה 0: עכשיו
      // הודעה 1+: עכשיו + cumulative delays
      const scheduledAt = i === 0
        ? now.toISOString()
        : new Date(now.getTime() + cumulativeDelay * 1000).toISOString();

      // [STEP 6c] הוסף delay אקראי לשניה הבאה
      if (i > 0) {
        const jitter = Math.floor(Math.random() * (delayMax - delayMin)) + delayMin;
        cumulativeDelay += jitter;
      }

      // [STEP 7] צור CampaignMessage
      const msg = await base44.asServiceRole.entities.CampaignMessage.create({
        campaign_id: campaignId,
        lead_id: lead.id,
        lead_name: lead.full_name,
        lead_phone: normalizePhone(lead.phone),
        variation_used: variation.label || "A",
        message_content: content,
        media_url: variation.media_url || campaign.global_media_url || null,
        status: "pending",
        scheduled_at: scheduledAt,  // ← זה הזמן שבו processPendingCampaigns יתחיל לשלוח
      });

      messages.push({ leadId: lead.id, messageId: msg.id, scheduledAt });
    }

    // [STEP 8] עדכן קמפיין ל-running
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
```

### נקודות חשובות
- **שורה 72-73:** הודעה ראשונה = עכשיו, שאר = עכשיו + delay מצטבר
- **שורה 76:** delay אקראי בין min ל-max
- **שורה 77:** **חשוב:** `cumulativeDelay` צומח עם כל הודעה
- **שורה 89:** `scheduled_at` נשמר — זה הזמן המדוקדק שחייב להשלוח

---

## 2. שליחה מתוזמנת - `functions/processPendingCampaigns`

### מטרה
פונקציה זו רץ כ-Cron job כל דקה.  
בודקת כל הודעה `pending` וגם:
1. האם הגיע הזמן (`scheduled_at`)
2. האם בעל הקמפיין מחובר ל-WA
3. האם לא חרגנו מ-50 הודעות ביום
4. שולחת **הודעה אחת בלבד** בכל ריצה (כדי להימנע מ-double-send)

### קוד מלא

```javascript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const HARD_DAILY_LIMIT = 80;  // מגבלה מוחלטת ביום

function normalizePhone(phone) {
  let p = (phone || "").replace(/[\-\s]/g, "");
  if (p.startsWith("0")) p = "972" + p.slice(1);
  return p;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // [CONFIG] קרא סודות מהסביבה
    const rawUrl = (Deno.env.get("RAILWAY_URL") || "").replace(/\/$/, "");
    const railwayUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
    const railwaySecret = Deno.env.get("RAILWAY_API_SECRET");
    const webhookUrl = Deno.env.get("BASE44_WEBHOOK_URL");

    if (!webhookUrl) return Response.json({ error: 'Missing BASE44_WEBHOOK_URL' }, { status: 500 });

    // [TIME] חשב זמנים
    const now = new Date();
    const nowISO = now.toISOString();
    const currentTimeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // [STEP 1] מצא את כל הודעות ה-pending
    const pendingMessages = await base44.asServiceRole.entities.CampaignMessage.filter({ status: "pending" });

    if (!pendingMessages.length) {
      return Response.json({ ok: true, processed: 0, message: "אין הודעות ממתינות" });
    }

    // [STEP 2] מיין לפי scheduled_at - הכי קרובות קודם
    pendingMessages.sort((a, b) => {
      const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
      const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
      return ta - tb;
    });

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const msg of pendingMessages) {

      // [CHECK 1] טען קמפיין וודא שהוא פעיל
      const campaigns = await base44.asServiceRole.entities.Campaign.filter({ id: msg.campaign_id });
      const campaign = campaigns[0];

      if (!campaign || campaign.status === "paused" || campaign.status === "completed" || campaign.status === "stopped") {
        skipped++;
        continue;  // קמפיין לא פעיל - דלג
      }

      // [CHECK 2] בדוק scheduled_at - בדוק אם הגיע הזמן
      if (msg.scheduled_at) {
        const scheduledAt = new Date(msg.scheduled_at);
        if (scheduledAt > now) {
          skipped++;
          continue;  // עוד לא הגיע הזמן
        }
      } else {
        // אם אין scheduled_at, בדוק חלון שעות של קמפיין
        const windowStart = campaign.scheduled_time_start || "09:00";
        const windowEnd = campaign.scheduled_time_end || "18:00";
        if (currentTimeStr < windowStart || currentTimeStr > windowEnd) {
          skipped++;
          continue;  // חוץ מחלון השעות
        }
      }

      // [CHECK 3] בדוק מגבלה יומית
      // ספור כמה הודעות כבר שלחנו היום לקמפיין זה
      const allCampaignMessages = await base44.asServiceRole.entities.CampaignMessage.filter({ campaign_id: campaign.id });
      const sentToday = allCampaignMessages.filter(m => {
        const isActivelySent = ["sent","delivered","opened","replied"].includes(m.status);
        const sentAt = m.sent_at ? new Date(m.sent_at) : null;
        return isActivelySent && sentAt && sentAt >= todayStart;
      }).length;

      // בדוק: האם חרגנו מהמגבלה?
      const campaignDailyLimit = Math.min(campaign.daily_limit || 50, HARD_DAILY_LIMIT);
      if (sentToday >= campaignDailyLimit) {
        console.log(`[DAILY_LIMIT] Campaign ${campaign.id}: ${sentToday}/${campaignDailyLimit} today`);
        skipped++;
        continue;  // הגדנו את המגבלה
      }

      // [CHECK 4] בדוק חיבור WA של בעל הקמפיין
      const ownerId = campaign.owner_user_id;
      if (!ownerId) {
        console.warn(`[NO_OWNER_ID] Campaign ${campaign.id}: missing owner_user_id`);
        skipped++;
        continue;
      }

      // קרא status מ-Railway
      const sessionId = `user_${ownerId}`;
      const sessionRes = await fetch(`${railwayUrl}/session/status/${sessionId}`, {
        headers: { Authorization: `Bearer ${railwaySecret}` },
        signal: AbortSignal.timeout(5000),
      }).catch(() => null);

      if (!sessionRes?.ok) {
        console.warn(`[NO_SESSION] Campaign ${campaign.id}: WA session not found`);
        skipped++;
        continue;  // session לא נמצא
      }

      const sessionData = await sessionRes.json().catch(() => ({}));
      if (sessionData.status !== "connected") {
        console.warn(`[DISCONNECTED] Campaign ${campaign.id}: WA not connected`);
        skipped++;
        continue;  // WA מנותק
      }

      // [SEND] שלח את ההודעה דרך Railway
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
        // [SUCCESS] עדכן הודעה ל-sent
        await base44.asServiceRole.entities.CampaignMessage.update(msg.id, {
          status: "sent",
          sent_at: nowISO,
        }).catch(() => null);

        sent++;
        console.log(`[SENT] ${msg.lead_phone} (campaign ${campaign.id})`);

        // [UPDATE] עדכן counters בקמפיין
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
        // [FAIL] עדכן הודעה ל-failed
        await base44.asServiceRole.entities.CampaignMessage.update(msg.id, {
          status: "failed",
          error_message: sendData?.error || `HTTP ${sendRes?.status || 'timeout'}`,
        }).catch(() => null);

        failed++;
        console.warn(`[FAIL] ${msg.lead_phone}: ${sendData?.error || 'no response'}`);
      }

      // [CRITICAL] שלח רק הודעה אחת בכל ריצה
      // Cron יטפל בשאר בריצות הבאות
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
```

### נקודות חשובות
- **שורה 58-72:** אלגוריתם החלון שעות
  - אם `scheduled_at` קיים → בדוק רק אם הגיע הזמן
  - אם לא → בדוק חלון שעות של קמפיין
- **שורה 175:** `break` = **חשוב מאוד** שלח רק הודעה אחת! Cron יטפל בשאר

---

## 3. תצוגה - `components/CampaignStatusWidget`

### מטרה
תצוגה בסיד ריק שמציגה:
- קמפיין פעיל
- progress bar
- **זמן בדיוק של הודעה הבאה**
- סטטוס WA

### קוד מלא

```javascript
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Megaphone, Clock, ChevronLeft, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import moment from "moment";
import "moment/locale/he";
moment.locale("he");

export default function CampaignStatusWidget() {
  const [campaign, setCampaign] = useState(null);
  const [messages, setMessages] = useState([]);
  const [waConnected, setWaConnected] = useState(null);
  const [nextMsg, setNextMsg] = useState(null);

  useEffect(() => {
    loadData();
    // [AUTO-REFRESH] טען מחדש כל 8 שניות
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // [STEP 1] טען קמפיין פעיל
      const campaigns = await base44.entities.Campaign.filter({ status: "running" }, "-created_date", 1);
      if (!campaigns.length) { 
        setCampaign(null); 
        return; 
      }
      const c = campaigns[0];
      setCampaign(c);

      // [STEP 2] טען הודעות pending ו-sent
      const msgs = await base44.entities.CampaignMessage.filter({ campaign_id: c.id }, "scheduled_at", 100);
      const pending = msgs.filter(m => ["pending", "sent"].includes(m.status));
      setMessages(pending);

      // [STEP 3] מצא את הודעה קרובה ביותר
      const now = new Date();
      const upcoming = msgs
        .filter(m => m.scheduled_at && ["pending", "sent"].includes(m.status))
        .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
        .find(m => new Date(m.scheduled_at) >= now);
      
      if (upcoming?.scheduled_at) {
        const scheduledTime = new Date(upcoming.scheduled_at);
        const diffMs = scheduledTime - now;
        const diffMins = Math.ceil(diffMs / 60000);
        
        // [STEP 3a] חשב timeString בהתאם להפרש הזמן
        let timeString;
        if (diffMins <= 0) {
          timeString = "כעת";  // הודעה צריכה ללכת כעת
        } else if (diffMins < 60) {
          timeString = `בעוד ${diffMins} דק'`;  // בעוד X דקות
        } else {
          timeString = moment(scheduledTime).format("HH:mm");  // בשעה מדוקדקת
        }
        
        setNextMsg({ ...upcoming, timeString });
      } else if (msgs.length > 0) {
        // אם אין הודעה עם scheduled_at, הצג "בתור"
        setNextMsg({ ...msgs[0], timeString: "בתור" });
      } else {
        setNextMsg(null);
      }

      // [STEP 4] בדוק סטטוס WA
      const waRes = await base44.functions.invoke("getWAStatus", {}).catch(() => null);
      setWaConnected(waRes?.data?.connected === true);
    } catch {
      // silent fail - תן לרכיב להמשיך
    }
  };

  if (!campaign) return null;

  // [RENDER] חשב stats
  const pending = messages.length;
  const total = campaign.total_recipients || 0;
  const sent = campaign.sent_count || 0;
  const progress = total > 0 ? Math.round((sent / total) * 100) : 0;

  const nextTime = nextMsg?.timeString || "ממתין...";

  return (
    <div className="mx-3 mb-3 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-primary/10">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <span className="text-[11px] font-bold text-foreground">קמפיין פעיל</span>
        </div>
        {waConnected !== null && (
          <span className={`flex items-center gap-1 text-[10px] font-semibold ${waConnected ? "text-success" : "text-destructive"}`}>
            {waConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {waConnected ? "מחובר" : "מנותק"}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-3 py-2.5 space-y-2">
        <p className="text-[12px] font-semibold text-foreground truncate">{campaign.name}</p>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>{sent} נשלחו</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-l from-primary to-purple-400 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Next message time */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">הבאה:</span>
          <span className={`font-semibold ${waConnected === false ? "text-destructive" : "text-primary"}`}>
            {waConnected === false ? "WA מנותק!" : nextTime}
          </span>
        </div>

        {/* WA warning */}
        {waConnected === false && (
          <div className="flex items-start gap-1.5 bg-destructive/8 rounded-lg px-2 py-1.5">
            <AlertTriangle className="w-3 h-3 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-destructive leading-tight">חבר WhatsApp בהגדרות כדי לשלוח</p>
          </div>
        )}

        {/* Link to log */}
        <Link to={`/campaigns/log?id=${campaign.id}`}
          className="flex items-center justify-between w-full bg-primary/10 hover:bg-primary/15 rounded-lg px-3 py-1.5 transition-colors">
          <span className="text-[11px] font-semibold text-primary">פתח לוג קמפיין</span>
          <ChevronLeft className="w-3.5 h-3.5 text-primary" />
        </Link>
      </div>
    </div>
  );
}
```

### נקודות חשובות
- **שורה 41-60:** חישוב דיוק של הודעה הבאה
  - ≤0 דק = "כעת"
  - <60 דק = "בעוד X דק'"
  - ≥60 דק = "HH:mm"
- **שורה 17:** `setInterval(loadData, 8000)` = רענן כל 8 שניות בדקה

---

## סיכום תזמון

| שלב | קובץ | מה קורה |
|-----|------|---------|
| 1 | `sendWABulk` | יצור הודעות עם `scheduled_at` מדוקדק |
| 2 | `processPendingCampaigns` (Cron) | בדוק אם הגיע זמן, שלח הודעה אחת |
| 3 | `CampaignStatusWidget` | הצג לדוד מתי ההודעה הבאה תשלח |

**הערה חשובה:** Cron צריך לרוץ מהם? זה צריך להיות קונפיגורציה ב-Base44!