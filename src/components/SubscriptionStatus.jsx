import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertCircle, CheckCircle, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import moment from "moment";

export default function SubscriptionStatus() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        
        const subs = await base44.entities.Subscription.filter({ user_id: me.id }, "-created_date", 1);
        if (subs.length > 0) {
          setSubscription(subs[0]);
        }
      } catch (e) {
        console.error("Error loading subscription:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || !subscription) return null;

  const isExpired = subscription.status === "canceled" || 
                   (subscription.status === "trial" && new Date(subscription.trial_ends_at) < new Date());
  const daysRemaining = subscription.status === "trial" && subscription.trial_ends_at
    ? Math.ceil((new Date(subscription.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  if (isExpired) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-destructive">אין מנוי פעיל</p>
            <p className="text-xs text-destructive/80 mt-0.5">בחר חבילה כדי להתחיל להשתמש בפלטפורמה</p>
            <Button 
              onClick={() => navigate("/pricing")} 
              size="sm" 
              variant="outline" 
              className="mt-2 h-7 text-xs border-destructive text-destructive hover:bg-destructive/5"
            >
              בחר חבילה
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (subscription.status === "trial" && daysRemaining > 0 && daysRemaining <= 3) {
    return (
      <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-warning">טרייל מסתיים בקרוב</p>
            <p className="text-xs text-warning/80 mt-0.5">
              {daysRemaining} יום{daysRemaining === 1 ? "" : "ים"} נותרו. בחר חבילה בתשלום כדי להמשיך.
            </p>
            <Button 
              onClick={() => navigate("/pricing")} 
              size="sm" 
              className="mt-2 h-7 text-xs bg-warning hover:opacity-90"
            >
              בחר חבילה עכשיו
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (subscription.status === "active" || subscription.status === "trial") {
    return (
      <div className="bg-success/10 border border-success/30 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-success">
              {subscription.status === "trial" ? "טרייל פעיל" : "מנוי פעיל"}
            </p>
            <p className="text-xs text-success/80 mt-0.5">
              {subscription.status === "trial" 
                ? `טרייל ל-${subscription.package_name} - ${daysRemaining} יום נותרו`
                : `מנוי ${subscription.package_name} פעיל`
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}