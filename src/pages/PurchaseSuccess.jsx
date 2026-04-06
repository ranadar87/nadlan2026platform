import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PurchaseSuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          navigate("/onboarding");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-success/5 via-white to-primary/5 flex items-center justify-center px-4" style={{ fontFamily: "'Assistant', sans-serif" }}>
      <div className="max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-success/15 flex items-center justify-center animate-pulse">
            <CheckCircle className="w-12 h-12 text-success" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-foreground">תודה על הרכישה! ✓</h1>
          <p className="text-lg text-muted-foreground">
            הטרייל החינם שלך התחיל כרגע ויהיה פעיל למשך 14 ימים.
          </p>
          <p className="text-sm text-muted-foreground/60">
            עכשיו בואו נחבר את WhatsApp שלך ונתחיל לשדר לידים! 🚀
          </p>
        </div>

        {/* CTA */}
        <div className="space-y-3 pt-6">
          <Button
            onClick={() => navigate("/onboarding")}
            className="w-full h-12 font-bold text-lg gap-2 bg-gradient-to-r from-success to-primary"
          >
            התחל ONBOARDING
            <ArrowRight className="w-5 h-5" />
          </Button>

          <p className="text-xs text-muted-foreground">
            הפניה אוטומטית בעוד {countdown} שניות...
          </p>
        </div>

        {/* Benefits */}
        <div className="pt-6 space-y-2 text-sm">
          <p className="text-muted-foreground">✓ שאיבת לידים מיד2 ומדלן</p>
          <p className="text-muted-foreground">✓ שליחת קמפיינים WhatsApp</p>
          <p className="text-muted-foreground">✓ ניהול CRM מלא</p>
        </div>
      </div>
    </div>
  );
}