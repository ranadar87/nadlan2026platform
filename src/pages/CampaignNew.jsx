import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import CampaignStep1 from "../components/campaigns/CampaignStep1";
import CampaignStep2 from "../components/campaigns/CampaignStep2";
import CampaignStep3 from "../components/campaigns/CampaignStep3";
import CampaignStep4 from "../components/campaigns/CampaignStep4";
import { ChevronRight, ChevronLeft, Loader2, CheckCircle2 } from "lucide-react";

const steps = ["סוג קמפיין", "יצירת הודעה", "קהל יעד", "תזמון ושליחה"];

export default function CampaignNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [campaign, setCampaign] = useState({
    type: "whatsapp", name: "", ai_prompt: "", message_variations: [],
    target_lead_ids: [], target_batch_id: "", daily_limit: 80,
    delay_min_seconds: 30, delay_max_seconds: 120,
    scheduled_time_start: "09:00", scheduled_time_end: "18:00",
    start_immediately: false, skip_already_contacted: true,
    send_once_per_contact: true, restrict_to_new_leads: false, require_phone_il: true,
    global_media_url: "", add_to_contact_group: "",
  });

  const update = (key, value) => setCampaign(prev => ({ ...prev, [key]: value }));

  const canProceed = () => {
    if (step === 0 && !campaign.name.trim()) {
      toast({ title: "שגיאה", description: "יש להזין שם לקמפיין", variant: "destructive" });
      return false;
    }
    if (step === 1 && campaign.message_variations.length === 0) {
      toast({ title: "שגיאה", description: "יש ליצור לפחות וריאציה אחת", variant: "destructive" });
      return false;
    }
    if (step === 2 && campaign.target_lead_ids.length === 0) {
      toast({ title: "שגיאה", description: "יש לבחור לפחות ליד אחד", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!canProceed()) return;
    setSaving(true);
    try {
      const newCampaign = await base44.entities.Campaign.create({
        ...campaign,
        status: campaign.start_immediately ? "running" : "scheduled",
        total_recipients: campaign.target_lead_ids.length,
        sent_count: 0, delivered_count: 0, opened_count: 0,
        replied_count: 0, converted_count: 0, failed_count: 0,
      });

      if (campaign.start_immediately && campaign.type === "whatsapp") {
        toast({ title: "⏳ מתחיל שליחה...", description: "מעביר לשרת WhatsApp" });
        try {
          const result = await base44.functions.invoke("sendWABulk", { campaignId: newCampaign.id });
          toast({ title: "✅ הקמפיין הושק!", description: `${result.queued || 0} מ${result.total || campaign.target_lead_ids.length} הודעות נשלחו` });
        } catch (sendError) {
          console.error("sendWABulk error:", sendError);
          toast({ title: "⚠️ קמפיין פעיל אך שגיאה בשליחה", description: sendError.message || "spellbinding בשרת WhatsApp", variant: "destructive" });
        }
      } else {
        toast({ title: "✅ הקמפיין נוצר!", description: campaign.start_immediately ? "מתחיל כעת" : "מתוזמן לשליחה" });
      }
      navigate("/campaigns");
    } catch (e) {
      toast({ title: "שגיאה", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const nextStep = () => {
    if (canProceed()) setStep(s => s + 1);
  };

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">קמפיין חדש</h1>
        <p className="text-xs text-muted-foreground mt-1">{campaign.name || "ללא שם"} • {campaign.target_lead_ids.length} נמענים</p>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                i === step ? "bg-primary text-primary-foreground shadow-md" :
                i < step ? "bg-success/20 text-success cursor-pointer hover:bg-success/30" :
                "bg-secondary text-muted-foreground"
              }`}>
              {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-background/20">{i + 1}</span>}
              {s}
            </button>
            {i < steps.length - 1 && <div className={`w-8 h-px transition-all ${i < step ? "bg-success/50" : "bg-border"}`} />}
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
          <Button className="gap-2" onClick={nextStep}>
            הבא<ChevronLeft className="w-4 h-4" />
          </Button>
        ) : (
          <Button className="gap-2 bg-gradient-to-l from-primary to-purple-500 hover:opacity-90" onClick={handleCreate} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? "יוצר קמפיין..." : campaign.start_immediately ? "🚀 שגר קמפיין עכשיו" : "✅ צור קמפיין מתוזמן"}
          </Button>
        )}
      </div>
    </div>
  );
}