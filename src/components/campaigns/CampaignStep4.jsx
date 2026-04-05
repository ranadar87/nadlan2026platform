import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Clock, Users, Zap, Calendar, AlertTriangle, UserCheck, Timer } from "lucide-react";
import moment from "moment";

export default function CampaignStep4({ campaign, update }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const recipientsCount = campaign.target_lead_ids?.length || 0;
  const daysEstimate = recipientsCount > 0 ? Math.ceil(recipientsCount / (campaign.daily_limit || 80)) : null;

  const getScheduledSummary = () => {
    if (campaign.start_immediately) return "ישלח מיידית עם לחיצה על ״שגר קמפיין״";
    if (!campaign.scheduled_date) return "לא נקבע תאריך תזמון";
    const date = moment(campaign.scheduled_date).format("dddd, D בMMMM YYYY");
    const time = campaign.scheduled_time_start || "09:00";
    return `יתחיל ב${date} בשעה ${time}`;
  };

  const delayMinMinutes = Math.round((campaign.delay_min_seconds || 30) / 60 * 10) / 10;
  const delayMaxMinutes = Math.round((campaign.delay_max_seconds || 120) / 60 * 10) / 10;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-foreground mb-1">שלב 4 — תזמון ושליחה</h3>
        <p className="text-xs text-muted-foreground">הגדר מתי ואיך הקמפיין יישלח</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Users, label: "נמענים", value: recipientsCount || "0", color: "text-primary" },
          { icon: Clock, label: "משך משוער", value: daysEstimate ? `~${daysEstimate} ימים` : "—", color: "text-info" },
          { icon: Shield, label: "ערוץ", value: campaign.type === "whatsapp" ? "WhatsApp" : "SMS", color: "text-success" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-secondary rounded-xl p-3 text-center">
            <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
            <p className="text-base font-bold text-foreground">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Send mode */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-foreground">מועד שליחה</Label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: true, icon: Zap, label: "התחל עכשיו", sub: "ישלח מיידית", color: "success" },
            { id: false, icon: Calendar, label: "תזמן לתאריך", sub: "קבע תאריך ושעה", color: "info" },
          ].map(opt => {
            const Icon = opt.icon;
            const active = campaign.start_immediately === opt.id;
            return (
              <button key={String(opt.id)} onClick={() => update("start_immediately", opt.id)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-right ${active ? `border-${opt.color} bg-${opt.color}/5` : "border-border bg-secondary hover:border-border/60"}`}>
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? `text-${opt.color}` : "text-muted-foreground"}`} />
                <div>
                  <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                  <p className="text-[10px] text-muted-foreground">{opt.sub}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scheduled date/time */}
      {!campaign.start_immediately && (
        <div className="bg-info/5 border border-info/20 rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">תאריך התחלה</Label>
              <Input type="date" value={campaign.scheduled_date || ""} onChange={e => update("scheduled_date", e.target.value)}
                min={moment().format("YYYY-MM-DD")} className="bg-white border-border mt-1" dir="ltr" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">שעת התחלה</Label>
              <Input type="time" value={campaign.scheduled_time_start || "09:00"} onChange={e => update("scheduled_time_start", e.target.value)} className="bg-white border-border mt-1" dir="ltr" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">שעת סיום יומית (חלון שליחה)</Label>
            <Input type="time" value={campaign.scheduled_time_end || "18:00"} onChange={e => update("scheduled_time_end", e.target.value)} className="bg-white border-border mt-1" dir="ltr" />
          </div>
          {campaign.scheduled_date && (
            <div className="flex items-start gap-2 bg-info/10 rounded-lg p-3">
              <Calendar className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
              <p className="text-xs text-info font-medium">{getScheduledSummary()}</p>
            </div>
          )}
        </div>
      )}

      {/* Delays & limits */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5" /> מגבלה יומית
            </Label>
            <span className="text-xs font-bold text-primary">{campaign.daily_limit || 80} הודעות/יום</span>
          </div>
          <Slider value={[campaign.daily_limit || 80]} onValueChange={([v]) => update("daily_limit", v)} min={10} max={200} step={10} className="mt-2" />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>10</span><span>בטוח: 50-80</span><span>200</span>
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-3 block flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> הפרשי זמן בין הודעות
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[10px] text-muted-foreground">מינימום (שניות)</Label>
              <Input type="number" value={campaign.delay_min_seconds || 30} onChange={e => update("delay_min_seconds", Number(e.target.value))} className="bg-secondary border-border mt-1" dir="ltr" min={5} />
              <p className="text-[10px] text-muted-foreground mt-1">≈ {delayMinMinutes} דקות</p>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">מקסימום (שניות)</Label>
              <Input type="number" value={campaign.delay_max_seconds || 120} onChange={e => update("delay_max_seconds", Number(e.target.value))} className="bg-secondary border-border mt-1" dir="ltr" min={10} />
              <p className="text-[10px] text-muted-foreground mt-1">≈ {delayMaxMinutes} דקות</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 bg-secondary/60 rounded-lg px-3 py-2">
            💡 ניתן להגדיר למשל 1200 שניות (20 דקות) בין כל שליחה לבטיחות גבוהה יותר
          </p>
        </div>
      </div>

      {/* Advanced restrictions */}
      <div className="border border-border rounded-xl overflow-hidden">
        <button onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between px-4 py-3 bg-secondary/60 hover:bg-secondary transition-colors text-sm font-semibold text-foreground">
          <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> הגבלות מתקדמות</span>
          <span className="text-xs text-muted-foreground">{showAdvanced ? "▲ סגור" : "▼ הרחב"}</span>
        </button>
        {showAdvanced && (
          <div className="p-4 space-y-4 bg-white">
            {[
              { key: "skip_already_contacted", label: "דלג על לידים שנשלח אליהם כבר בקמפיין אחר", sub: "מונע כפילות של הודעות", icon: UserCheck, defaultVal: true },
              { key: "send_once_per_contact", label: "שלח פעם אחת בלבד לכל איש קשר", sub: "גם אם אותו מספר מופיע פעמים", icon: Shield, defaultVal: true },
              { key: "restrict_to_new_leads", label: "שלח רק ללידים בסטטוס ״חדש״", sub: "מסנן לידים שכבר טופלו", icon: AlertTriangle, defaultVal: false },
              { key: "require_phone_il", label: "סנן רק מספרי טלפון ישראליים", sub: "050/052/053/054/055/058", icon: Shield, defaultVal: true },
            ].map(({ key, label, sub, icon: Icon, defaultVal }) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer group">
                <Checkbox
                  checked={campaign[key] !== undefined ? campaign[key] : defaultVal}
                  onCheckedChange={v => update(key, v)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    {label}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{sub}</p>
                </div>
              </label>
            ))}
            <div>
              <Label className="text-xs text-muted-foreground">הוסף קהל זה לרשימת אנשי קשר (לאחר שליחה)</Label>
              <Input value={campaign.add_to_contact_group || ""} onChange={e => update("add_to_contact_group", e.target.value)}
                placeholder="לדוגמה: לידים תל אביב Q1 2025" className="bg-secondary border-border mt-1 text-sm" />
            </div>
          </div>
        )}
      </div>

      {/* Summary card */}
      <div className="bg-gradient-to-br from-primary/8 to-success/5 border border-primary/15 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">סיכום הגדרות</span>
        </div>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" />{getScheduledSummary()}</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-info" />חלון שליחה: {campaign.scheduled_time_start || "09:00"} — {campaign.scheduled_time_end || "18:00"}</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-warning" />עד {campaign.daily_limit || 80} הודעות ביום</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-success" />השהיה {campaign.delay_min_seconds || 30}–{campaign.delay_max_seconds || 120} שניות בין הודעות</li>
          {daysEstimate && <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent" />משך משוער: ~{daysEstimate} ימים</li>}
        </ul>
      </div>
    </div>
  );
}