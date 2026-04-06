# אלגוריתם התזמון של קמפיינים

## סקירה כללית
הזרימה כוללת שלוש שכבות:
1. **יצירת הודעות** (`sendWABulk`) - ניתוק הודעות לידים עם `scheduled_at`
2. **שליחה מתוזמנת** (`processPendingCampaigns`) - Cron שבודק ושולח כל הודעה בזמנה
3. **תצוגה** (`CampaignStatusWidget`) - מציג לדוד מתי ההודעה הבאה תשלח

---

## 1. יצירת הודעות - `functions/sendWABulk`

### זרימה:
1. **קליט:** קמפיין עם `target_lead_ids`
2. **טען לידים:** קבץ לידים מ-DB
3. **חשב זמנים:**
   - הודעה ראשונה: `now` (מיידית)
   - הודעות נוסף: `now + cumulative_delay`
   - `cumulative_delay` = סכום random delays בין `delay_min` ו-`delay_max` שניות

4. **יצור `CampaignMessage`:**
   ```
   {
     campaign_id,
     lead_id,
     status: "pending",
     scheduled_at: ISO timestamp,  ← הזמן שבו צריך לשלוח
     message_content,
     variation_used
   }
   ```

5. **עדכן Campaign:**
   ```
   status: "running"
   total_recipients: count of leads
   ```

### דוגמה חישוב:
```
Leads: [A, B, C]
delay_min: 600s (10 דק)
delay_max: 900s (15 דק)

Msg A: scheduled_at = 11:06:00 (עכשיו)
Msg B: 
  - random delay = 650s
  - cumulative = 650s
  - scheduled_at = 11:16:50

Msg C:
  - random delay = 720s
  - cumulative = 650 + 720 = 1370s = ~23 דק
  - scheduled_at = 11:29:10
```

---

## 2. שליחה מתוזמנת - `functions/processPendingCampaigns`

### הגדרות:
```javascript
HARD_DAILY_LIMIT = 50          // מקסימום מוחלט ליום
POLL_INTERVAL = 60s            // Cron רץ כל דקה
```

### אלגוריתם:

```
FOR EACH pending message:
  
  LOAD campaign
  IF campaign.status IN [paused, completed, stopped]
    SKIP (campaign מכובה)
  
  CHECK scheduled_at:
    IF message.scheduled_at exists:
      IF scheduled_at > now:
        SKIP (עוד לא הגיע הזמן)
    ELSE (אין scheduled_at):
      CHECK daily time window:
        IF now < campaign.scheduled_time_start OR now > campaign.scheduled_time_end:
          SKIP (חוץ מחלון השעות)
  
  CHECK daily limit:
    sentToday = COUNT(messages WHERE status IN [sent, delivered, opened, replied] AND sent_at >= todayStart)
    IF sentToday >= HARD_DAILY_LIMIT (50):
      SKIP (הגדנו את המגבלה היומית)
  
  CHECK WA connection:
    sessionId = user_{campaign.owner_user_id}
    IF session NOT connected to Railway:
      SKIP (בעל הקמפיין לא מחובר ל-WA)
  
  SEND message via Railway API:
    POST /message/send {
      sessionId,
      to: normalize_phone(message.lead_phone),
      message: message.message_content,
      mediaUrl: message.media_url
    }
  
  IF success:
    UPDATE CampaignMessage: status = "sent", sent_at = now
    UPDATE Campaign counters:
      sent_count = count of "sent"
      failed_count = count of "failed"
      status = "completed" IF no pending left
  ELSE:
    UPDATE CampaignMessage: status = "failed", error_message = error
  
  BREAK (שלח רק הודעה אחת - Cron יטפל בשאר)
```

---

## 3. תצוגה - `components/CampaignStatusWidget`

### לוג הנתונים:
```javascript
// טען קמפיין פעיל
campaigns = filter({status: "running"})
if campaigns.empty:
  return null  // אין קמפיין פעיל

// טען הודעות pending ו-sent
messages = filter({
  campaign_id,
  status IN ["pending", "sent"]
})

// מצא הודעה קרובה
upcoming = messages
  .filter(status IN ["pending", "sent"])
  .sort(scheduled_at ASC)
  .find(scheduled_at >= now)

// חשב timeString:
if !upcoming:
  timeString = "בתור"
else if diffMins <= 0:
  timeString = "כעת"
else if diffMins < 60:
  timeString = `בעוד ${diffMins} דק'`
else:
  timeString = HH:mm
```

---

## בעיות שתוקנו

### תקנה 1: `CampaignStatusWidget` - WA Status
**בעיה:** קרא `connected` אבל `getWAStatus` מחזיר `status`
```javascript
// לפני:
setWaConnected(waRes?.data?.status === "connected");

// אחרי:
setWaConnected(waRes?.data?.connected === true);
```

### תקנה 2: `processPendingCampaigns` - חלון שעות
**בעיה:** חלון שעות דילג על הודעות מתוזמנות (`scheduled_at`)
```javascript
// לפני:
if (currentTimeStr < windowStart || currentTimeStr > windowEnd) SKIP

// אחרי:
if (msg.scheduled_at) {
  // בדוק זמן = scheduled_at (התעלם מחלון)
} else {
  // בדוק חלון שעות רק אם אין scheduled_at
  if (currentTimeStr < windowStart) SKIP
}
```

---

## בעיות ידועות / Edge Cases

### 1. **Timezone issues**
- Railway אולי מחזיר שעות UTC
- `processPendingCampaigns` משתמש בשעה המקומית
- **פתרון:** בדוק אם Railway מחזיר UTC ותיקן ב-`processPendingCampaigns`

### 2. **Double-send prevention**
- אם `processPendingCampaigns` רץ פעמיים בזמן קטן מדי
- שתי ריצות עלולות לשלוח את אותה הודעה
- **פתרון:** הוסף unique constraint על `(campaign_id, lead_id)`

### 3. **Race condition - Campaign update**
- הודעה A נשלחה, אבל Campaign עדיין לא עודכן כשהודעה B קוראה
- שני processes עלולים לעדכן בו זמנית
- **פתרון:** השתמש ב-optimistic locking או transaction

### 4. **Cron timing**
- אם Cron רץ בפחות מ-60 שניות
- הודעה עלולה להיות מחסכת בתור חוץ מזמנה
- **פתרון:** בדוק שקיים cronjob ב-production

### 5. **Daily limit reset**
- הגדרה "50 הודעות ביום" תלויה ב-`created_at` של ההודעה
- בעיה: אם הודעה נוצרה היום אבל `scheduled_at` מחר
- **פתרון:** השתמש ב-`sent_at` בלבד, לא `created_at`

---

## בדיקה ידנית (QA)

### Test 1: הודעה פשוטה
```
1. צור קמפיין עם 3 לידים
2. בחר "התחל עכשיו"
3. תבדוק: לוג צריך להראות 3 hashes בـ CampaignMessage
4. תוך דקה, סטטוס צריך להשתנות לק"sent"
```

### Test 2: תזמון עם חלון שעות
```
1. צור קמפיין עם scheduled_time_start=15:00, end=16:00
2. בחר "תזמן לתאריך" היום בשעה 10:00 בבוקר
3. ללכת ללוג → צריך להיות "ממתין לחלון שעות"
4. בשעה 15:00 → הודעה צריכה לשלוח
```

### Test 3: delays אקראיים
```
1. צור קמפיין עם delay_min=10s, delay_max=20s, 5 לידים
2. בדוק CampaignMessage → scheduled_at צריך לעלות בקצב
3. Msg 1: 11:06:00
4. Msg 2: 11:06:15 (±range)
5. Msg 3: 11:06:32
...וכו
```

---

## סיכום לתקשורת עם המתכנת

**הבעיה הראשית:**
- חלון שעות (`scheduled_time_start/end`) עוקף הודעות מתוזמנות
- תזמון מזומן (`scheduled_at`) אמור להתעלם מחלון שעות

**הפתרון:**
- אם `message.scheduled_at` קיים → משתמש בו בלבד
- אם לא → משתמש בחלון שעות של קמפיין

**דברים שצריך לבדוק:**
1. WA session connection status (Railway API)
2. Timezone alignment בין פלטפורמה ל-Railway
3. Cron interval בפועל
4. בדיקת double-send prevention