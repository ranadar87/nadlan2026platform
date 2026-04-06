import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";

export default function Pricing() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState("monthly");

  useEffect(() => {
    const load = async () => {
      const plansData = await base44.entities.PaymentPlan.filter({ is_active: true }, "-sort_order");
      setPlans(plansData);
      setLoading(false);
    };
    load();
  }, []);

  const handleSelectPlan = (plan) => {
    navigate(`/checkout?plan_key=${plan.plan_key}&billing_cycle=${billingCycle}`);
  };

  return (
    <div className="min-h-screen bg-white py-20 px-4" style={{ fontFamily: "'Assistant', sans-serif" }}>
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black text-foreground">בחר את החבילה שמתאימה לך</h1>
          <p className="text-lg text-muted-foreground">שנה בכל עת. ללא התחייבות.</p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              billingCycle === "monthly"
                ? "bg-primary text-white"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            }`}
          >
            חודשי
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              billingCycle === "yearly"
                ? "bg-primary text-white"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            }`}
          >
            שנתי (חסוך 20%)
          </button>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-secondary rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const price = billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;
              const isPopular = plan.popular;
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border-2 p-8 transition-all ${
                    isPopular
                      ? "border-primary bg-primary/5 shadow-lg scale-105"
                      : "border-border bg-white hover:border-primary/30"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold">
                      הכי פופולרי ⭐
                    </div>
                  )}

                  <h3 className="text-2xl font-bold text-foreground mb-2">{plan.plan_name}</h3>
                  <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>

                  <div className="mb-6">
                    <p className="text-4xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                      {price}₪
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {billingCycle === "yearly" ? "לשנה" : "לחודש"}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {(plan.features || []).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{feature.name}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full h-11 font-bold gap-2 ${
                      isPopular
                        ? "bg-primary"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    בחר עכשיו
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* FAQ Section */}
        <div className="bg-secondary/30 rounded-2xl p-8 mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">שאלות נפוצות</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { q: "יכול לשנות חבילה?", a: "בטח! שנה בכל עת בחסד מלא." },
              { q: "יש חוזה?", a: "לא. ביטול בכל עת ללא קנסות." },
              { q: "האם יש טרייל?", a: "כן, כמו שמוגדר בחבילה." },
              { q: "תמיכה טכנית?", a: "כן, במהלך שעות העבודה." },
            ].map((item, i) => (
              <div key={i}>
                <p className="font-bold text-foreground mb-2">{item.q}</p>
                <p className="text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}