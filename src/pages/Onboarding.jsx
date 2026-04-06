import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, ChevronLeft, Building2, Car, Briefcase, ShoppingBag, Zap } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const INDUSTRIES = [
  { id: "real_estate", icon: Building2, label: "נדל\"ן / מתווך", desc: "שאיבת לידים מיד2 ומדלן, קמפיינים לנכסים" },
  { id: "cars", icon: Car, label: "סחר רכבים", desc: "לידים מיד4 ואתרי רכב, קמפיינים לרכבים" },
  { id: "business", icon: Briefcase, label: "עסק כללי", desc: "ניהול לקוחות ושיווק לכל סוג עסק" },
  { id: "ecommerce", icon: ShoppingBag, label: "מסחר אלקטרוני", desc: "שיווק ללקוחות חנות אונליין" },
];

const steps = ["ברוכים הבאים", "בחר תחום", "פרטי עסק", "סיום"];

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [industry, setIndustry] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    setSaving(true);
    await base44.auth.updateMe({ industry, business_name: businessName, onboarding_done: true }).catch(() => null);
    toast({ title: "הגדרות נשמרו!", description: "ברוך הבא למערכת" });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/3 to-purple-500/5 flex items-center justify-center p-4" style={{ fontFamily: "'Assistant', sans-serif" }}>
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-glow">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">BrokerPro</h1>
              <p className="text-xs text-muted-foreground">פלטפורמת השיווק החכמה</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? "bg-success text-white" : i === step ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
              }`}>
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`w-8 h-0.5 transition-all ${i < step ? "bg-success" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-card p-8 animate-fade-in">

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center space-y-4">
              <div className="text-5xl">👋</div>
              <h2 className="text-2xl font-bold text-foreground">ברוכים הבאים!</h2>
              <p className="text-muted-foreground leading-relaxed">
                נעשה התאמה אישית של המערכת עבורך כדי שתקבל את הכלים הרלוונטיים לעסק שלך.
                התהליך יקח פחות מ-2 דקות.
              </p>
              <Button className="w-full gap-2 mt-4" onClick={() => setStep(1)}>
                בואו נתחיל <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Step 1: Industry */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">באיזה תחום אתה עוסק?</h2>
                <p className="text-sm text-muted-foreground mt-1">נתאים את הכלים לפי התחום שלך</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {INDUSTRIES.map(ind => {
                  const Icon = ind.icon;
                  return (
                    <button key={ind.id} onClick={() => setIndustry(ind.id)}
                      className={`p-4 rounded-xl border-2 text-right transition-all ${
                        industry === ind.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 hover:bg-secondary/50"
                      }`}>
                      <Icon className={`w-6 h-6 mb-2 ${industry === ind.id ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="text-sm font-semibold text-foreground">{ind.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{ind.desc}</p>
                    </button>
                  );
                })}
              </div>
              <Button className="w-full gap-2" disabled={!industry} onClick={() => setStep(2)}>
                המשך <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Business details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">פרטי העסק שלך</h2>
                <p className="text-sm text-muted-foreground mt-1">נשתמש בפרטים אלו בקמפיינים</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">שם העסק</label>
                <Input value={businessName} onChange={e => setBusinessName(e.target.value)}
                  placeholder="לדוגמה: סוכנות הנדל&quot;ן של ישראל ישראלי"
                  className="bg-secondary border-border mt-1" />
              </div>
              <Button className="w-full gap-2" onClick={() => setStep(3)}>
                המשך <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Step 3: Finish */}
          {step === 3 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-xl font-bold text-foreground">הכל מוכן!</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                המערכת מותאמת עבורך. עכשיו אתה יכול להתחיל לשאוב לידים ולשלוח קמפיינים.
              </p>
              <div className="bg-secondary/50 rounded-xl p-4 text-right space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>תחום: {INDUSTRIES.find(i => i.id === industry)?.label}</span>
                </div>
                {businessName && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span>עסק: {businessName}</span>
                  </div>
                )}
              </div>
              <Button className="w-full gap-2 bg-gradient-to-l from-primary to-purple-500" onClick={handleFinish} disabled={saving}>
                {saving ? "שומר..." : "🚀 כניסה למערכת"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}