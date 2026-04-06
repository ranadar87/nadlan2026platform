# יישום מפרט טכני: BASE44 ↔ Railway WhatsApp

**סטטוס:** ✅ הושלם  
**תאריך:** 2026-04-06  
**מקור:** Railway ↔ BASE44 Spec

---

## 📋 סיכום השינויים שבוצעו

### 1️⃣ Entity Updates

#### ✅ User Entity
הוספת שדות WhatsApp:
- `whatsapp_connected` (Boolean) - האם חובר כרגע
- `whatsapp_phone` (Text) - מספר שזוהה ב-Railway
- `whatsapp_manually_disconnected` (Boolean) - דגל disconnect יזום
- `whatsapp_connected_at` (DateTime) - זמן חיבור אחרון
- `whatsapp_disconnected_at` (DateTime) - זמן ניתוק אחרון
- `whatsapp_qr_cache` (LongText) - QR cache זמני
- `whatsapp_qr_updated_at` (DateTime) - זמן עדכון QR

#### ✅ Campaign Entity
הוספת שדות תזמון:
- `limit_daily` (Number) - מגבלת שליחה יומית
- `timezone` (Text) - timezone למשתמש (לעתיד)
- שדות קיימים מקובצים לפי המפרט

#### ✅ CampaignMessage Entity
עדכון שמות שדות לפי המפרט:
- `lead_phone` - מספר יעד
- `message_content` - תוכן ההודעה
- `url_media` - קישור מדיה
- `at_scheduled` - המועד המותר לשליחה
- `message_error` - הודעת שגיאה

---

### 2️⃣ Backend Functions

#### ✅ getWAStatus (עדכון קיים)
- **מטרה:** בדוק ועדכן סטטוס WhatsApp connection
- **תנהגות:**
  - קריאה ל-Railway עם sessionId
  - עדכון User entity עם phone וconnection status
  - החזרת QR אם pending
  - כל זה בלי ליצור session חדש

#### ✅ createWASession (חדש)
- **מטרה:** יצירת session חדש ב-Railway
- **תנהגות:**
  - קבלת sessionId = `user_${user.id}`
  - POST ל-Railway
  - אפס `whatsapp_manually_disconnected`
  - החזרת status="initializing"

#### ✅ disconnectWA (חדש)
- **מטרה:** ניתוק אמיתי מ-WhatsApp
- **תנהגות:**
  - DELETE session ב-Railway
  - עדכון User: connected=false, manually_disconnected=true
  - שמירת timestamp

#### ✅ receiveWebhook (חדש)
- **אימות:** בדיקת x-railway-secret header
- **אירועים:**
  - `qr_updated` - שמור QR ב-whatsapp_qr_cache
  - `session_connected` - עדכן connected=true + phone
  - `session_disconnected` - אפס connected
  - `session_failed` - לוג failure
  - `status` (message status) - עדכן CampaignMessage + campaign counters

#### ✅ sendWABulk (עדכון מפורט)
- **שינויים:**
  - הוסף `nextSlotAfterJitter()` - wrap-around בחלון שעות
  - Partial recovery - משלים הודעות שלא נשלחו
  - תזמון לפי `at_scheduled` (לא `scheduled_at`)
  - חישוב baseTime לפי `start_immediately` / `scheduled_date`
  
#### ✅ getNextDueMessage (חדש!)
- **מטרה:** Railway worker קורא הודעה אחת להשליחה
- **תנהגות:**
  - בדיקת x-railway-secret
  - שחרור stuck messages (>3 דקות)
  - בדיקת daily limit
  - נעילה ל-sending + החזרת הודעה

---

## 🏗️ ארכיטקטורה

```
┌─────────────────────┐
│   BASE44 Frontend   │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │              │
    ▼              ▼
[getWAStatus] [createWASession] [disconnectWA]
    │              │                │
    └──────────────┼────────────────┘
                   │
              [User Entity]
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
    [sendWABulk]      [Campaign/Message Entities]
         │                   │
         └─────────┬─────────┘
                   │
         ┌─────────▼──────────┐
         │   BASE44 Webhook   │
         │  /receiveWebhook   │
         └─────────┬──────────┘
                   │
         ┌─────────▼──────────────┐
         │    Railway Server      │
         │  (WhatsApp Execution)  │
         └─────────┬──────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
  /session/status    /message/send
  /session/create    /session/delete
        │                     │
        │    (Worker Loop)    │
        │  getNextDueMessage  │
        │                     │
        └─────────┬───────────┘
                  │
            [Webhook Back]
                  │
            receiveWebhook
```

---

## 📌 Environment Variables (דרישות)

בדוק שב-BASE44 settings מוגדרים:

```
RAILWAY_URL=https://your-railway.app
RAILWAY_API_SECRET=<secret_key>
BASE44_WEBHOOK_URL=https://your-base44-app/functions/receiveWebhook
```

---

## ✅ Checklist תנאים להפעלה

### Stage 1 — Connection
- [x] User entity updated with WhatsApp fields
- [x] getWAStatus implemented
- [x] createWASession implemented
- [x] disconnectWA implemented
- [x] receiveWebhook handles session events (qr_updated, session_connected, session_disconnected)

### Stage 2 — Campaigns
- [x] Campaign entity has limit_daily, timezone, scheduled_time_start/end
- [x] CampaignMessage entity has at_scheduled, message_content, message_error
- [x] sendWABulk creates CampaignMessage records with scheduled_at (renamed to at_scheduled)
- [x] sendWABulk handles jitter wrap-around
- [x] sendWABulk supports partial recovery

### Stage 3 — Scheduling
- [x] getNextDueMessage implemented
- [x] Stuck message recovery (3+ minutes in sending)
- [x] receiveWebhook handles message status updates (sent/delivered/opened/replied/failed)
- [x] Campaign counters updated from webhook

---

## 🔄 Full Campaign Lifecycle

```
1. User:        Build campaign, choose scheduling + time window
                ↓
2. Frontend:    Call sendWABulk (queue creation)
                ↓
3. sendWABulk:  Create CampaignMessage records with at_scheduled
                Set campaign.status = "running"
                ↓
4. Railway:     Worker loop every 15–30 seconds
                Call getNextDueMessage
                ↓
5. getNextDueMessage:
                Find message with at_scheduled ≤ now
                Lock to status="sending"
                Return message payload
                ↓
6. Railway:     Send via WhatsApp
                Post webhook status update
                ↓
7. receiveWebhook:
                Parse status (sent/delivered/opened/replied/failed)
                Update CampaignMessage.status
                Update Campaign counters
```

---

## 🛡️ Security Checklist

- [x] RAILWAY_API_SECRET used for Authorization: Bearer header
- [x] x-railway-secret validated in receiveWebhook
- [x] receiveWebhook validates secret before DB updates
- [x] No secret exposed in endpoints
- [x] User ID extracted from sessionId format: user_${id}

---

## 📝 Notes

1. **Field Name Updates:**
   - `scheduled_at` → `at_scheduled` (CampaignMessage)
   - `message_content` (not `content`)
   - `url_media` (not `media_url`)
   - `message_error` (not `error_message`)

2. **Timezone Handling:**
   - Campaign has timezone field (for future use)
   - Currently using server timezone
   - To implement: parse scheduled_date in user's timezone

3. **No More Cron for Sending:**
   - processPendingCampaigns deprecated (was 5-minute poll)
   - Railway worker now owns execution (15–30s poll via getNextDueMessage)
   - BASE44 Cron only for admin/repair tools if needed

4. **Partial Recovery:**
   - If sendWABulk times out mid-execution, second call detects and completes
   - Prevents duplicate messages via lead_id dedup

---

## 🚀 Next Steps

1. **Test getWAStatus** - Verify Railway connection working
2. **Test createWASession** - Verify QR generation
3. **Test disconnectWA** - Verify cleanup
4. **Test sendWABulk** - Verify message queue creation
5. **Test getNextDueMessage** - Verify worker integration
6. **Test receiveWebhook** - Verify status updates
7. **End-to-end** - Full campaign lifecycle

---

**Implementation Complete** ✅