import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Phone } from "lucide-react";

export default function CampaignStep1({ campaign, update }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-foreground mb-1">שלב 1 — בחירת סוג קמפיין</h3>
        <p className="text-xs text-muted-foreground">בחר את סוג הקמפיין ושם לו שם</p>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">שם הקמפיין</Label>
        <Input value={campaign.name} onChange={e => update("name", e.target.value)} placeholder='לדוגמה: "השכרת דירות תל אביב"' className="bg-secondary border-border mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[
          { type: "whatsapp", label: "WhatsApp", sub: "שליחת הודעות וואטסאפ", icon: MessageSquare, color: "success" },
          { type: "sms", label: "SMS", sub: "הודעות טקסט קצרות", icon: Phone, color: "info" },
        ].map(opt => {
          const Icon = opt.icon;
          const isActive = campaign.type === opt.type;
          return (
            <button key={opt.type} type="button" onClick={() => update("type", opt.type)}
              className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                isActive ? `border-${opt.color} bg-${opt.color}/5` : "border-border bg-secondary hover:border-border/80"
              }`}>
              <Icon className={`w-8 h-8 ${isActive ? `text-${opt.color}` : "text-muted-foreground"}`} />
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{opt.sub}</p>
              </div>
            </button>
          );
        })}
      </div>
      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground">בחר מקור לידים</Label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { v: "yad2", l: "יד2", img: "https://media.base44.com/images/public/69d2b6e3a4e37f8ebe0a3486/c998f7be4_Yad2_logosvg.png" },
            { v: "madlan", l: "מדלן", img: "https://media.base44.com/images/public/69d2b6e3a4e37f8ebe0a3486/1d827da26_Madlan_Logo.png" }
          ].map(o => (
            <button key={o.v} onClick={() => update("target_batch_id", o.v)} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              campaign.target_batch_id === o.v ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
            }`}>
              <img src={o.img} alt={o.l} className="h-10 object-contain" />
              <span className="text-sm font-semibold text-foreground">{o.l}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}