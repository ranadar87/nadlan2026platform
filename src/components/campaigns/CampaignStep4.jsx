import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Shield, Clock, Users } from "lucide-react";

export default function CampaignStep4({ campaign, update }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-foreground mb-1">שלב 4 — תזמון ושליחה</h3>
        <p className="text-xs text-muted-foreground">הגדר מגבלות שליחה ותזמון אנטי-בלוק</p>
      </div>
      <div className="bg-secondary rounded-lg p-4 flex gap-6">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-foreground">{campaign.target_lead_ids?.length || 0} נמענים</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-foreground">{campaign.type === "whatsapp" ? "WhatsApp" : "SMS"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-foreground">
            {campaign.target_lead_ids?.length
              ? `~${Math.ceil(campaign.target_lead_ids.length / (campaign.daily_limit || 80))} ימים`
              : "—"}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs text-muted-foreground">שעת התחלה</Label>
          <Input type="time" value={campaign.scheduled_time_start || "09:00"} onChange={e => update("scheduled_time_start", e.target.value)} className="bg-secondary border-border mt-1" dir="ltr" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">שעת סיום</Label>
          <Input type="time" value={campaign.scheduled_time_end || "18:00"} onChange={e => update("scheduled_time_end", e.target.value)} className="bg-secondary border-border mt-1" dir="ltr" />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs text-muted-foreground">מגבלה יומית</Label>
          <span className="text-xs font-semibold text-primary">{campaign.daily_limit || 80} הודעות</span>
        </div>
        <Slider value={[campaign.daily_limit || 80]} onValueChange={([v]) => update("daily_limit", v)} min={10} max={200} step={10} className="mt-2" />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-3 block">השהיה בין הודעות (שניות)</Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-[10px] text-muted-foreground">מינימום</Label>
            <Input type="number" value={campaign.delay_min_seconds || 30} onChange={e => update("delay_min_seconds", Number(e.target.value))} className="bg-secondary border-border mt-1" dir="ltr" />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">מקסימום</Label>
            <Input type="number" value={campaign.delay_max_seconds || 120} onChange={e => update("delay_max_seconds", Number(e.target.value))} className="bg-secondary border-border mt-1" dir="ltr" />
          </div>
        </div>
      </div>
      <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">מגבלות אנטי-בלוק</span>
        </div>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>• השהיה אקראית בין {campaign.delay_min_seconds || 30}-{campaign.delay_max_seconds || 120} שניות</li>
          <li>• שליחה רק בשעות {campaign.scheduled_time_start || "09:00"}-{campaign.scheduled_time_end || "18:00"}</li>
          <li>• עד {campaign.daily_limit || 80} הודעות ביום</li>
          <li>• רוטציה בין 3 וריאציות הודעה</li>
        </ul>
      </div>
    </div>
  );
}