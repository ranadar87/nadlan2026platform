# ניתוח מפורט: מערכת התזמון של ההודעות

**עדכון:** 2026-04-06 | **סטטוס:** בדיקה טכנית כסדרה

---

## 📋 סיכום ביצוע

לאחר יישום 4 התיקונים מהדו"ח הקודם:
- ✅ **Cron Automation** - יפעל כל 5 דקות (`*/5 * * * *`)
- ✅ **sendWABulk מתוקן** - שימוש ב-`nextSlotInWindow()` + חישוב זמנים לפי חלון שעות
- ✅ **processPendingCampaigns מתוקן** - בדיקת חלון שעות לפני שליחה

**עם זאת**, ישנן עדיין בעיות פוטנציאליות שצריך לוודא שתוקנו:

---

## 🔴 הבעיות הנוכחיות (וממה הן קיימות)

### בעיה 1: חוסר סנכרון בחלוני שעות בין שתי הפונקציות
**חומרה:** קריטי  
**מקום:** `sendWABulk` ו-`processPendingCampaigns`

**הבעיה:**
- ב-`sendWABulk`: כשנוצרים ה-CampaignMessages, כל הודעה מקבלת `scheduled_at` שנחשב כ-"בתוך חלון השעות"
- בתוך `processPendingCampaigns`: בדיקה חזרה של חלון שעות עלולה **לדחות הודעות שכבר היו אמורות לשלוח**

**דוגמה פרקטית:**
```
קמפיין: 09:00-18:00
משהו: 17:50 - יוצרים הודעות
הודעה #50: scheduled_at = 17:55 (תוך חלון)
processPendingCampaigns רץ ב-23:00:
→ בודק אם 17:55 < 23:00 (כן)
→ אבל currentTimeStr = "23:00" > windowEnd = "18:00"
→ דחיה: "יוצא מחלון השעות"
⚠️ הודעה הוקצתה לרמה שמעוד לא הגיעה אליה!
```

**הפתרון הנדרש:**
- `processPendingCampaigns` צריך **לא** לבדוק חלון שעות אם `scheduled_at` כבר הוגדר בעבר
- רק הודעות **בלי** `scheduled_at` או עם `scheduled_at=null` צריכות לעמוד בחלון שעות

---

### בעיה 2: חישוב Jitter לא נכון בsequence
**חומרה:** גבוה  
**מקום:** `sendWABulk` - לולאת הודעות

**הבעיה:**
```javascript
// קוד נוכחי:
for (let i = 0; i < validLeads.length; i++) {
  cursor = nextSlotInWindow(cursor, windowStart, windowEnd);
  const scheduledAt = cursor.toISOString();
  // ... create message ...
  
  const jitter = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
  cursor = new Date(cursor.getTime() + jitter * 1000);
}
```

**הבעיה:**
- אם cursor נמצא **ב-23:55** וchunk קרוב לסוף החלון
- `jitter = 600` שניות (10 דקות)
- cursor יקפוץ ל-**00:05** (ביום הבא)
- אבל `nextSlotInWindow()` **לא מתוקן** את זה! הוא רק בודק אם אתה בתוך החלון **בעת הקריאה**

**ה-flow השגוי:**
1. cursor = 23:55 (חוץ חלון - בדיקה עוברת כי אנחנו מחוץ)
2. jitter = +600 sec → cursor = 00:05 (ביום הבא - אבל תוך חלון בקריאה הבאה)
3. בקריאה הבאה: nextSlotInWindow(00:05, 09:00, 18:00) → מחזיר 09:00 (בהחלט!)
4. **בעיה:** כל ההודעות הבאות קיבלו skip של שעות שלמות

---

### בעיה 3: טיפול בשידור שני לא בדוק
**חומרה:** גבוה  
**מקום:** `sendWABulk` - בדיקה של `existingMessages`

**הבעיה:**
```javascript
const existingMessages = await base44.asServiceRole.entities.CampaignMessage.filter({ campaign_id: campaignId });
if (existingMessages.length) {
  return Response.json({ ok: true, queued: existingMessages.length, message: 'הודעות כבר תוזמנו' });
}
```

**הבעיה:**
- אם משהו קרה בו בעת הריצה הראשונה של `sendWABulk` (חיתוך רשת, timeout, etc.)
- וכמה הודעות **יצאו** אבל **לא כולן**
- קריאה שנייה תחזיר: "הודעות כבר תוזמנו" ו**לא תגמיש את בחזרה**

**הדוגמה:**
- 100 lead → צריך להיות 100 הודעות
- ריצה #1: יצאו 50 הודעות (ואז timeout)
- ריצה #2: בודק "אם יש כל הודעה", רואה 50, חוזר בלי להוסיף את ה-50 הנוספות

---

### בעיה 4: אין timezone awareness בISOString
**חומרה:** בינוני  
**מקום:** `sendWABulk` - חישוב baseTime

**הבעיה:**
- `campaign.scheduled_date` מגיע כ-ISO string מהפרונט (בזמן המשתמש)
- אבל כשאנחנו עושים `new Date(campaign.scheduled_date)`, זה יכול להיות **מסופר בטעות**
- אם המשתמש בישראל (UTC+2) והוא בחר "ביום שני ב-10:00"
- ה-ISO עשוי להיות parsed כ-UTC במקום local time

**הדוגמה:**
```
משתמש בחר: 2026-04-10T10:00:00 (בזמנו המקומי, שהוא UTC+2)
שרת קרא את זה כ: 2026-04-10T10:00:00Z (UTC)
וכך הוא שלח בשעה 12:00 בישראל במקום 10:00
```

---

## ✅ פתרונות שצריכים יישום

### תיקון 1: Conditional Window Check
```javascript
// ב-processPendingCampaigns, ב-nextDue section:
if (!nextDue.scheduled_at) {
  // רק אם אין scheduled_at מוקדם
  const windowStart = campaign.scheduled_time_start || "09:00";
  const windowEnd = campaign.scheduled_time_end || "18:00";
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  if (currentTimeStr < windowStart || currentTimeStr > windowEnd) {
    return Response.json({ ok: true, processed: 0, skipped: 1, message: `יוצא מחלון השעות ${windowStart}–${windowEnd}` });
  }
} else {
  // אם יש scheduled_at — בדוק רק אם הזמן הגיע
  if (new Date(nextDue.scheduled_at) > now) {
    return Response.json({ ok: true, processed: 0, message: 'הודעה הבאה לא הגיעה לזמנה עדיין' });
  }
}
```

### תיקון 2: Smart Jitter Wrap-Around
```javascript
function nextSlotAfterJitter(cursor, jitter, windowStart, windowEnd) {
  const next = new Date(cursor.getTime() + jitter * 1000);
  // אם קפצנו מחוץ לחלון — קפוץ ליום הבא בתחילת החלון
  return nextSlotInWindow(next, windowStart, windowEnd);
}

// בלולאה:
cursor = nextSlotAfterJitter(cursor, jitter, windowStart, windowEnd);
```

### תיקון 3: Partial Send Recovery
```javascript
// בו'sendWABulk, החלף את בדיקת existingMessages:
const existingMessages = await base44.asServiceRole.entities.CampaignMessage.filter({ campaign_id: campaignId });
const pendingMessages = existingMessages.filter(m => !["sent", "delivered", "opened", "replied", "failed"].includes(m.status));

if (pendingMessages.length === validLeads.length) {
  // כל ההודעות כבר יצאו — דלג
  return Response.json({ ok: true, queued: existingMessages.length, message: 'הודעות כבר תוזמנו' });
}

if (existingMessages.length > 0 && existingMessages.length < validLeads.length) {
  // שיגור חלקי בעבר — משלים את היתר
  const missingLeads = validLeads.filter(lead => !existingMessages.some(m => m.lead_id === lead.id));
  // ... המשך עם missingLeads במקום validLeads ...
}
```

### תיקון 4: Timezone-Aware Date Parsing
```javascript
// כשמקבלים scheduled_date מהפרונט:
function parseLocalDate(dateStr, userTimezone) {
  // dateStr הוא ISO string בזמן המשתמש
  // צריך להתייחס אליו כ-local time, לא UTC
  const d = new Date(dateStr);
  // אם זה בא כ-ISO, כבר הוא UTC
  // אבל ה-display בפרונט הוא בזמן מקומי
  // פתרון: שלח מהפרונט כ-ISO עם timezone offset
  return d;
}
```

---

## 🔍 Flow Diagram - איך זה אמור לעבוד

```
┌─────────────────────────────────────────────┐
│ User יוצר קמפיין + בוחר זמנים               │
│ start_immediately: true / false             │
│ scheduled_date: 2026-04-10                  │
│ scheduled_time_start: 09:00                 │
│ scheduled_time_end: 18:00                   │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ Frontend קורא ל: sendWABulk({ campaignId }) │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ sendWABulk:                                 │
│ 1. טען leads + variations                  │
│ 2. חשב baseTime:                           │
│    - אם start_immediately: nextSlotInWindow│
│    - אם scheduled_date: דיוק לאותו זמן     │
│ 3. לכל lead:                                │
│    - nextSlotInWindow(cursor) → בטוח בחלון│
│    - יצור CampaignMessage עם scheduled_at │
│    - cursor += random jitter (בתוך חלון)  │
│ 4. עדכן campaign status → "running"         │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ Cron (כל 5 דקות): processPendingCampaigns  │
│                                             │
│ 1. בדוק pending messages                   │
│ 2. למצא message עם scheduled_at ≤ now      │
│    (ודא שאין תיקיה בחלון שעות אם יש        │
│     scheduled_at מוקדם)                    │
│ 3. בדוק WA connection (session)            │
│ 4. שלח את ההודעה                           │
│ 5. עדכן status → "sent"                    │
│ 6. אם כל הודעות שלחו → campaign="completed"│
└─────────────────────────────────────────────┘
```

---

## 📊 טבלת בדיקה - דברים שצריך לוודא

| # | בדיקה | מצב | הערות |
|---|-------|------|--------|
| 1 | Cron אוטומציה פעילה | ✓/✗ | צפה ב-Automations בדשבורד |
| 2 | sendWABulk משתמש ב-nextSlotInWindow | ✓/✗ | בדוק קוד |
| 3 | processPendingCampaigns בדוק קונדישן לחלון | ✓/✗ | FIX 4 יושם? |
| 4 | Jitter לא קופץ מחוץ לחלון | ✓/✗ | בדוק edge cases |
| 5 | Partial send recovery עוזר | ✓/✗ | בדוק שנייה run |
| 6 | timezone באופציה scheduled_date | ✓/✗ | בדוק UTC vs Local |
| 7 | CampaignMessage gets scheduled_at | ✓/✗ | בדוק DB |
| 8 | processPendingCampaigns משחרר stuck messages | ✓/✗ | 2+ דקות sending |

---

## 🧪 Test Case - בדיקה פרקטית

**תרחיש:** קמפיין עם 3 leads, delay 30 שניות

```
זמן יצירה: 16:45
חלון שעות: 09:00-18:00
start_immediately: true

צפוי:
├─ Msg #1: scheduled_at = 16:45:00 (תוך חלון)
├─ Msg #2: scheduled_at = 16:45:30 (cursor + 30s)
└─ Msg #3: scheduled_at = 16:46:00 (cursor + 30s)

ריצת processPendingCampaigns ב-16:46:
├─ בדוק Msg #1: 16:45 ≤ 16:46 → שלח ✓
├─ בדוק Msg #2: 16:45:30 ≤ 16:46 → שלח ✓
└─ בדוק Msg #3: 16:46 ≤ 16:46 → שלח ✓

תוצאה צפויה: 3/3 הודעות שלחו בתוך 2 דקות
```

---

## 🚀 צעדים הבאים

1. **בדוק את הקוד** - וודא שכל 4 התיקונים עבדו כהלכה
2. **הרץ טסט קטן** - 3 leads עם delayed campaign
3. **בדוק לוגים** - ב-processPendingCampaigns ב-Railway
4. **וודא DB** - בדוק את CampaignMessage records עם scheduled_at values
5. **אם יש בעיה** - דוץ לי את ה-logs + IDs של הודעות שלא שלחו

---

## 📝 הערות עבור המתכנת

- **Priority 1:** התקן Conditional Window Check (FIX 1)
- **Priority 2:** התקן Jitter Wrap-Around (FIX 2)
- **Priority 3:** התקן Partial Send Recovery (FIX 3)
- **Priority 4:** בדוק Timezone Awareness (FIX 4)

כל אלה חיוני להפעלה יציבה של התזמון.