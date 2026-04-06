import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Calendar, AlertCircle, CheckCircle, Clock, Trash2, CreditCard } from "lucide-react";
import moment from "moment";
import "moment/locale/he";
moment.locale("he");

export default function SubscriptionDashboard() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const subs = await base44.entities.Subscription.filter({ user_id: user.id }, "-created_date", 1);
      
      if (subs.length > 0) {
        const sub = subs[0];
        setSubscription(sub);
        
        const plans = await base44.entities.PaymentPlan.filter({ id: sub.package_id });
        if (plans.length > 0) {
          setPlan(plans[0]);
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleCancel = async () => {
    if (!window.confirm("האם אתה בטוח שברצונך לביטול המנוי?")) return;
    setCanceling(true);
    
    try {
      await base44.functions.invoke("cancelSubscription", {
        subscriptionId: subscription.id,
        reason: "User-initiated cancellation",
      });
      
      // Reload
      window.location.reload();
    } catch (e) {
      alert("שגיאה בביטול: " + e.message);
      setCanceling(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      trial: "text-info bg-info/10",
      active: "text-success bg-success/10",
      paused: "text-warning bg-warning/10",
      canceled: "text-destructive bg-destructive/10",
      failed: "text-destructive bg-destructive/10",
    };
    return colors[status] || "text-muted-foreground bg-secondary/30";
  };

  const getStatusLabel = (status) => {
    const labels = {
      trial: "טרייל",
      active: "פעיל",
      paused: "מושהה",
      canceled: "מבוטל",
      failed: "נכשל",
      initial: "בתהליך",
    };
    return labels[status] || status;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!subscription) {
    return (
      <div className="max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold text-foreground">המנוי שלי</h1>
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground mb-4">אין לך מנוי פעיל כרגע.</p>
          <Button onClick={() => navigate("/pricing")} className="gap-2">
            בחר חבילה
          </Button>
        </div>
      </div>
    );
  }

  const daysRemaining = subscription.status === "trial" && subscription.trial_ends_at
    ? Math.ceil((new Date(subscription.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  const nextBillingDays = subscription.next_billing_date
    ? Math.ceil((new Date(subscription.next_billing_date) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">המנוי שלי</h1>

      {/* Main Status Card */}
      <div className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-2 border-primary/20 rounded-2xl p-8 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">{plan?.plan_name || "—"}</h2>
            <p className="text-muted-foreground mt-1">
              {subscription.billing_cycle === "yearly" ? "חיוב שנתי" : "חיוב חודשי"}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full font-bold text-sm ${getStatusColor(subscription.status)}`}>
            {getStatusLabel(subscription.status)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Price */}
          <div className="bg-white rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-semibold">מחיר</p>
            <p className="text-2xl font-bold text-foreground mt-1">{subscription.price}₪</p>
          </div>

          {/* Trial Status */}
          {subscription.status === "trial" && (
            <div className="bg-white rounded-lg p-4 border-l-4 border-info">
              <p className="text-xs text-muted-foreground font-semibold">טרייל נשאר</p>
              <p className="text-2xl font-bold text-info mt-1">{Math.max(daysRemaining, 0)} ימים</p>
              <p className="text-xs text-muted-foreground mt-1">עד {moment(subscription.trial_ends_at).format("DD/MM/YY")}</p>
            </div>
          )}

          {/* Next Billing */}
          {(subscription.status === "active" || subscription.status === "paused") && (
            <div className="bg-white rounded-lg p-4 border-l-4 border-success">
              <p className="text-xs text-muted-foreground font-semibold">חיוב הבא</p>
              <p className="text-2xl font-bold text-success mt-1">{Math.max(nextBillingDays, 0)} ימים</p>
              <p className="text-xs text-muted-foreground mt-1">{moment(subscription.next_billing_date).format("DD/MM/YY")}</p>
            </div>
          )}

          {/* Failed Payment */}
          {subscription.status === "failed" && (
            <div className="bg-white rounded-lg p-4 border-l-4 border-destructive">
              <p className="text-xs text-muted-foreground font-semibold">נסיונות כושלים</p>
              <p className="text-2xl font-bold text-destructive mt-1">{subscription.failed_attempts || 0}</p>
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {subscription.status === "failed" && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-destructive">בעיה בתשלום</p>
            <p className="text-sm text-destructive/80 mt-1">
              אנחנו ניסינו לחייב אותך {subscription.failed_attempts} פעמים. אנא עדכן פרטי תשלום או צור קשר לתמיכה.
            </p>
          </div>
        </div>
      )}

      {subscription.status === "trial" && daysRemaining < 3 && daysRemaining > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
          <Clock className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-warning">הטרייל מסתיים בקרוב</p>
            <p className="text-sm text-warning/80 mt-1">
              הטרייל שלך מסתיים בעוד {daysRemaining} יום{daysRemaining === 1 ? "" : "ים"}. כדי להמשיך, תצטרך לבחור חבילה בתשלום.
            </p>
          </div>
        </div>
      )}

      {subscription.status === "canceled" && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-destructive">המנוי מבוטל</p>
            <p className="text-sm text-destructive/80 mt-1">
              המנוי שלך בוטל בתאריך {moment(subscription.canceled_at).format("DD/MM/YY")}.
            </p>
          </div>
        </div>
      )}

      {/* Details */}
      <div className="bg-white border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-bold text-foreground">פרטים</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">שם לקוח</span>
            <span className="font-medium text-foreground">{subscription.customer_name || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">אימייל</span>
            <span className="font-medium text-foreground">{subscription.customer_email || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">טלפון</span>
            <span className="font-medium text-foreground">{subscription.customer_phone || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">תאריך התחלה</span>
            <span className="font-medium text-foreground">{moment(subscription.started_at).format("DD/MM/YY HH:mm")}</span>
          </div>
          {subscription.payme_subscription_id && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">מזהה PayMe</span>
              <span className="font-mono text-xs text-foreground bg-secondary px-2 py-1 rounded">{subscription.payme_subscription_id}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        {subscription.status !== "canceled" && (
          <>
            <Button variant="outline" onClick={() => navigate("/billing")} className="flex-1 gap-2">
              <CreditCard className="w-4 h-4" /> עדכן פרטי תשלום
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={canceling}
              className="flex-1 gap-2"
            >
              <Trash2 className="w-4 h-4" /> {canceling ? "מבטל..." : "בטל מנוי"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}