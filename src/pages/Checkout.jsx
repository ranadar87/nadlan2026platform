import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader, AlertCircle } from "lucide-react";

export default function Checkout() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const planKey = urlParams.get("plan_key");
  const billingCycle = urlParams.get("billing_cycle") || "monthly";

  const [plan, setPlan] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [error, setError] = useState("");
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      setCustomerName(me?.full_name || "");
      setCustomerEmail(me?.email || "");

      const plans = await base44.entities.PaymentPlan.filter({ plan_key: planKey });
      if (plans.length === 0) {
        setError("חבילה לא נמצאה");
        setLoading(false);
        return;
      }
      setPlan(plans[0]);
      
      // בדוק אם test_mode דלוק
      const configs = await base44.entities.PaymeConfig.filter({ config_key: 'global' });
      if (configs.length > 0 && configs[0].test_mode) {
        setTestMode(true);
      }
      
      setLoading(false);
    };
    load();
  }, [planKey]);

  const handleCheckout = async () => {
    if (!customerName || !customerEmail) {
      setError("אנא מלא את כל הפרטים");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const result = await base44.functions.invoke("generateSubscription", {
        plan_key: planKey,
        billing_cycle: billingCycle,
        customerName,
        customerEmail,
        customerPhone,
      });

      if (result.data.ok) {
        // בשלב זה נעדכן את ה-subscription ל-trial
        // ונפנה ללינק PayMe (בהמשך)
        navigate(`/purchase-success?subscription_id=${result.data.subscription.id}`);
      } else {
        setError(result.data.error || "שגיאה בתהליך הרכישה");
      }
    } catch (e) {
      setError(e.message || "שגיאה");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!plan) {
    return <div className="flex items-center justify-center min-h-screen text-destructive">חבילה לא נמצאה</div>;
  }

  const price = billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;

  return (
    <div className="min-h-screen bg-white py-12 px-4" style={{ fontFamily: "'Assistant', sans-serif" }}>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">אישור רכישה</h1>
          <p className="text-muted-foreground mt-1">אימות פרטים וסיום הרכישה</p>
        </div>

        {/* Test Mode Alert */}
        {testMode && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-warning">⚠️ מצב בדיקה פעיל</p>
              <p className="text-sm text-warning/80 mt-1">
                המחיר בתחתית יהיה מחיר בדיקה (בדרך כלל 5₪). התשלום אמיתי!
              </p>
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-2xl border border-primary/10 p-6">
          <h2 className="font-bold text-foreground mb-4">סיכום הזמנה</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">חבילה</span>
              <span className="font-bold text-foreground">{plan.plan_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">מחיר</span>
              <span className="font-bold text-foreground">{price}₪</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">מחזור</span>
              <span className="font-bold text-foreground">{billingCycle === "yearly" ? "שנתי" : "חודשי"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">טרייל</span>
              <span className="font-bold text-success">{plan.trial_days || 14} ימים חינם</span>
            </div>
            <div className="border-t border-primary/20 pt-3 mt-3 flex items-center justify-between">
              <span className="font-bold text-foreground">סה"כ</span>
              <span className="text-2xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {price}₪
              </span>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="space-y-4">
          <h2 className="font-bold text-foreground">פרטים אישיים</h2>
          <div>
            <label className="text-xs text-muted-foreground font-semibold">שם מלא</label>
            <Input
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="שם שלך"
              className="mt-1 bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-semibold">דוא"ל</label>
            <Input
              type="email"
              value={customerEmail}
              onChange={e => setCustomerEmail(e.target.value)}
              placeholder="example@email.com"
              className="mt-1 bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-semibold">טלפון</label>
            <Input
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              placeholder="050-XXXXXXX"
              className="mt-1 bg-secondary border-border"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {/* Terms */}
        <div className="text-xs text-muted-foreground bg-secondary/30 rounded-lg p-4">
          <p>בלחיצה על "השלם רכישה" אתה מסכים לתנאים שלנו וה-טרייל החינם יתחיל באופן מיידי.</p>
        </div>

        {/* CTA */}
        <Button
          onClick={handleCheckout}
          disabled={processing}
          className="w-full h-12 font-bold text-lg gap-2"
        >
          {processing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" /> מעבד...
            </>
          ) : (
            <>
              השלם רכישה <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}