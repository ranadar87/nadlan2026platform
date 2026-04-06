import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2, Save, X, AlertCircle, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function PaymentPlansManager() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [newPlan, setNewPlan] = useState(null);
  const [validationResult, setValidationResult] = useState(null);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      
      if (me?.role !== "admin") {
        return;
      }

      const [plansData, configsData, validationRes] = await Promise.all([
        base44.entities.PaymentPlan.list("-sort_order", 100),
        base44.entities.PaymeConfig.filter({ config_key: "global" }),
        base44.functions.invoke("validatePaymeSetup", {}),
      ]);

      setPlans(plansData);
      setConfig(configsData.length > 0 ? configsData[0] : null);
      setValidationResult(validationRes.data);
      setLoading(false);
    };
    load();
  }, []);

  const handleCreatePlan = async () => {
    if (!newPlan?.plan_key || !newPlan?.plan_name || newPlan?.price_monthly === undefined) {
      toast({ title: "חובה למלא פרטים בסיסיים", variant: "destructive" });
      return;
    }
    await base44.entities.PaymentPlan.create(newPlan);
    toast({ title: "חבילה נוצרה בהצלחה" });
    setNewPlan(null);
    const updatedPlans = await base44.entities.PaymentPlan.list("-sort_order", 100);
    setPlans(updatedPlans);
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan?.id) return;
    await base44.entities.PaymentPlan.update(editingPlan.id, editingPlan);
    toast({ title: "חבילה עודכנה בהצלחה" });
    setEditingPlan(null);
    const updatedPlans = await base44.entities.PaymentPlan.list("-sort_order", 100);
    setPlans(updatedPlans);
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm("האם אתה בטוח?")) return;
    await base44.entities.PaymentPlan.delete(planId);
    toast({ title: "חבילה נמחקה" });
    const updatedPlans = await base44.entities.PaymentPlan.list("-sort_order", 100);
    setPlans(updatedPlans);
  };

  const handleUpdateConfig = async (field, value) => {
    if (!config?.id) return;
    const updated = { ...config, [field]: value };
    await base44.entities.PaymeConfig.update(config.id, updated);
    setConfig(updated);
    toast({ title: "הגדרות עודכנו" });
  };

  if (!user || user.role !== "admin") {
    return <div className="text-center py-12 text-destructive">אין הרשאה מנהל</div>;
  }

  return (
    <div className="max-w-6xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">ניהול חבילות ותשלומים</h1>
        <p className="text-xs text-muted-foreground mt-1">דשבורד אדמין לניהול דינמי של חבילות ו-PayMe</p>
      </div>

      {/* Validation Status */}
      {validationResult && (
        <div className={`rounded-xl border-2 p-4 ${
          validationResult.status === 'ok' 
            ? 'border-success/30 bg-success/5' 
            : 'border-destructive/30 bg-destructive/5'
        }`}>
          <div className="flex items-start gap-3">
            {validationResult.status === 'ok' ? (
              <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-bold text-foreground text-sm">
                {validationResult.status === 'ok' ? 'כל ההגדרות תקינות ✓' : 'בעיות בהגדרות'}
              </p>
              {validationResult.issues?.length > 0 && (
                <ul className="mt-2 text-xs text-destructive space-y-1">
                  {validationResult.issues.map((issue, i) => <li key={i}>• {issue}</li>)}
                </ul>
              )}
              {validationResult.warnings?.length > 0 && (
                <ul className="mt-2 text-xs text-warning space-y-1">
                  {validationResult.warnings.map((warn, i) => <li key={i}>• {warn}</li>)}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PaymeConfig */}
      {config && (
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">הגדרות PayMe</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground font-semibold">Seller ID</label>
              <Input 
                value={config.payme_seller_id || ''} 
                onChange={e => setConfig({...config, payme_seller_id: e.target.value})} 
                placeholder="מזהה מוכר PayMe"
                className="mt-1 bg-secondary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold">Webhook URL</label>
              <Input 
                value={config.webhook_url || ''} 
                onChange={e => setConfig({...config, webhook_url: e.target.value})} 
                placeholder="https://..."
                className="mt-1 bg-secondary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold">ניסיונות חיוב חוזר מקסימלי</label>
              <Input 
                type="number"
                value={config.retry_max_attempts || 3} 
                onChange={e => setConfig({...config, retry_max_attempts: parseInt(e.target.value)})} 
                className="mt-1 bg-secondary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold">הפרש בין ניסיונות (שעות)</label>
              <Input 
                type="number"
                value={config.retry_delay_hours || 24} 
                onChange={e => setConfig({...config, retry_delay_hours: parseInt(e.target.value)})} 
                className="mt-1 bg-secondary"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => handleUpdateConfig('payme_seller_id', config.payme_seller_id)} size="sm" className="gap-2">
              <Save className="w-4 h-4" /> שמור הגדרות
            </Button>
          </div>
        </div>
      )}

      {/* Plans Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-secondary/30 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">חבילות תשלום</h2>
          <Button onClick={() => setNewPlan({})} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> חבילה חדשה
          </Button>
        </div>

        {loading ? (
          <div className="p-6 text-center text-muted-foreground">טוען...</div>
        ) : (
          <div className="divide-y divide-border">
            {/* New Plan Form */}
            {newPlan && (
              <div className="p-6 bg-primary/5 border-b-2 border-primary space-y-4">
                <h3 className="font-bold text-foreground">חבילה חדשה</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Input 
                    placeholder="קוד (solo, pro...)" 
                    value={newPlan.plan_key || ''}
                    onChange={e => setNewPlan({...newPlan, plan_key: e.target.value})}
                    className="bg-white"
                  />
                  <Input 
                    placeholder="שם החבילה" 
                    value={newPlan.plan_name || ''}
                    onChange={e => setNewPlan({...newPlan, plan_name: e.target.value})}
                    className="bg-white"
                  />
                  <Input 
                    type="number"
                    placeholder="מחיר חודשי" 
                    value={newPlan.price_monthly || ''}
                    onChange={e => setNewPlan({...newPlan, price_monthly: parseFloat(e.target.value)})}
                    className="bg-white"
                  />
                  <Input 
                    type="number"
                    placeholder="מחיר שנתי" 
                    value={newPlan.price_yearly || ''}
                    onChange={e => setNewPlan({...newPlan, price_yearly: parseFloat(e.target.value)})}
                    className="bg-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreatePlan} size="sm" className="gap-2">
                    <Save className="w-4 h-4" /> צור
                  </Button>
                  <Button onClick={() => setNewPlan(null)} size="sm" variant="outline" className="gap-2">
                    <X className="w-4 h-4" /> ביטול
                  </Button>
                </div>
              </div>
            )}

            {/* Plans List */}
            {plans.map(plan => (
              <div key={plan.id} className="p-6 hover:bg-secondary/20 transition-colors">
                {editingPlan?.id === plan.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Input 
                        placeholder="קוד" 
                        value={editingPlan.plan_key || ''}
                        onChange={e => setEditingPlan({...editingPlan, plan_key: e.target.value})}
                        className="bg-secondary"
                      />
                      <Input 
                        placeholder="שם" 
                        value={editingPlan.plan_name || ''}
                        onChange={e => setEditingPlan({...editingPlan, plan_name: e.target.value})}
                        className="bg-secondary"
                      />
                      <Input 
                        type="number"
                        placeholder="מחיר חודשי" 
                        value={editingPlan.price_monthly || ''}
                        onChange={e => setEditingPlan({...editingPlan, price_monthly: parseFloat(e.target.value)})}
                        className="bg-secondary"
                      />
                      <Input 
                        type="number"
                        placeholder="ימי טרייל" 
                        value={editingPlan.trial_days || 14}
                        onChange={e => setEditingPlan({...editingPlan, trial_days: parseInt(e.target.value)})}
                        className="bg-secondary"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleUpdatePlan} size="sm" className="gap-2">
                        <Save className="w-4 h-4" /> שמור
                      </Button>
                      <Button onClick={() => setEditingPlan(null)} size="sm" variant="outline" className="gap-2">
                        <X className="w-4 h-4" /> ביטול
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground">{plan.plan_name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {plan.price_monthly}₪/חודש • {plan.trial_days || 14} ימי טרייל • {plan.is_active ? '✓ פעיל' : '✗ כבוי'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => setEditingPlan(plan)} size="icon" variant="ghost" className="h-8 w-8">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => handleDeletePlan(plan.id)} size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}