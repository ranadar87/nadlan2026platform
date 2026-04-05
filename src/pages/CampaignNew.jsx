import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import CampaignStep1 from "../components/campaigns/CampaignStep1";
import CampaignStep2 from "../components/campaigns/CampaignStep2";
import CampaignStep3 from "../components/campaigns/CampaignStep3";
import CampaignStep4 from "../components/campaigns/CampaignStep4";
import { ChevronRight, ChevronLeft } from "lucide-react";

const steps = ["סוג קמפיין", "יצירת הודעה", "קהל יעד", "תזמון ושליחה"];

export default function CampaignNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [campaign, setCampaign] = useState({
    type: "whatsapp", name: "", ai_prompt: "", message_variations: [],
    target_lead_ids: [], daily_limit: 80, delay_min_seconds: 30,
    delay_max_seconds: 120, scheduled_time_start: "09:00", scheduled_time_end: "18:00",
  });

  const update = (key, value) => setCampaign(prev => ({ ...prev, [key]: value }));

  const handleCreate = async () => {
    await base44.entities.Campaign.create({
      ...campaign,
      status: "scheduled",
      total_recipients: campaign.target_lead_ids.length,
      sent_count: 0, delivered_count: 0, opened_count: 0,
      replied_count: 0, converted_count: 0, failed_count: 0,
    });
    toast({ title: "הקמפיין נוצר בהצלחה!" });
    navigate("/campaigns");
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              i === step ? "bg-primary text-primary-foreground" :
              i < step ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
            }`}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-background/20">{i + 1}</span>
              {s}
            </div>
            {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        {step === 0 && <CampaignStep1 campaign={campaign} update={update} />}
        {step === 1 && <CampaignStep2 campaign={campaign} update={update} />}
        {step === 2 && <CampaignStep3 campaign={campaign} update={update} />}
        {step === 3 && <CampaignStep4 campaign={campaign} update={update} />}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" className="gap-2 border-border" disabled={step === 0} onClick={() => setStep(s => s - 1)}>
          <ChevronRight className="w-4 h-4" />הקודם
        </Button>
        {step < steps.length - 1 ? (
          <Button className="gap-2" onClick={() => setStep(s => s + 1)}>
            הבא<ChevronLeft className="w-4 h-4" />
          </Button>
        ) : (
          <Button className="gap-2" onClick={handleCreate}>קמפיין חדש</Button>
        )}
      </div>
    </div>
  );
}