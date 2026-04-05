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
    </div>
  );
}