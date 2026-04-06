import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ToggleLeft, ToggleRight, Trash2, Clock, Database, Webhook } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AutomationManagement() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      
      if (me?.role !== "admin") {
        return;
      }

      const autos = await base44.functions.invoke("listAutomations", {});
      setAutomations(autos.data || []);
      setLoading(false);
    };
    load();
  }, []);

  const getAutomationType = (auto) => {
    if (auto.type === "scheduled") return { label: "מתוזמן", icon: Clock, color: "text-info" };
    if (auto.type === "entity") return { label: "על שינוי רשומה", icon: Database, color: "text-primary" };
    if (auto.type === "connector") return { label: "Webhook חיצוני", icon: Webhook, color: "text-success" };
    return { label: auto.type, icon: Clock, color: "text-muted-foreground" };
  };

  const handleToggle = async (auto) => {
    try {
      const newStatus = !auto.is_active;
      await base44.functions.invoke("toggleAutomation", {
        automation_id: auto.id,
        is_active: newStatus
      });
      setAutomations(autos => autos.map(a => a.id === auto.id ? {...a, is_active: newStatus} : a));
      toast({ 
        title: newStatus ? "אוטומציה הופעלה" : "אוטומציה הושבתה"
      });
    } catch (e) {
      toast({ title: "שגיאה", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (auto) => {
    if (!window.confirm(`למחוק את האוטומציה "${auto.name}"?`)) return;
    try {
      await base44.functions.invoke("deleteAutomation", {
        automation_id: auto.id
      });
      setAutomations(autos => autos.filter(a => a.id !== auto.id));
      toast({ title: "אוטומציה נמחקה" });
    } catch (e) {
      toast({ title: "שגיאה", description: e.message, variant: "destructive" });
    }
  };

  if (!user || user.role !== "admin") {
    return <div className="text-center py-12 text-destructive">אין הרשאה מנהל</div>;
  }

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">ניהול אוטומציות</h1>
        <p className="text-xs text-muted-foreground mt-1">הפעלה, השבתה ומחיקה של אוטומציות</p>
      </div>

      {/* Automations List */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-secondary/30">
          <h3 className="text-sm font-bold text-foreground">אוטומציות ({automations.length})</h3>
        </div>

        {loading ? (
          <div className="p-6 text-center text-muted-foreground">טוען...</div>
        ) : automations.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <p className="text-sm">אין אוטומציות שהוגדרו עדיין</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {automations.map(auto => {
              const typeInfo = getAutomationType(auto);
              const TypeIcon = typeInfo.icon;
              
              return (
                <div key={auto.id} className="p-6 hover:bg-secondary/20 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-foreground">{auto.name}</h3>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                          auto.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                        }`}>
                          {auto.is_active ? "✓ פעיל" : "✗ כבוי"}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <TypeIcon className={`w-4 h-4 ${typeInfo.color}`} />
                        <span>{typeInfo.label}</span>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1">
                        <p><strong>פונקציה:</strong> {auto.function_name}</p>
                        
                        {auto.type === "scheduled" && (
                          <>
                            <p><strong>תזמון:</strong> {auto.repeat_interval}{" "}
                              {auto.repeat_unit === "minutes" ? "דקות" : 
                               auto.repeat_unit === "hours" ? "שעות" :
                               auto.repeat_unit === "days" ? "ימים" :
                               auto.repeat_unit === "weeks" ? "שבועות" : "חודשים"}
                            </p>
                            {auto.start_time && <p><strong>זמן התחלה:</strong> {auto.start_time}</p>}
                          </>
                        )}

                        {auto.type === "entity" && (
                          <>
                            <p><strong>ישות:</strong> {auto.entity_name}</p>
                            <p><strong>אירועים:</strong> {(auto.event_types || []).join(", ")}</p>
                          </>
                        )}

                        {auto.type === "connector" && (
                          <>
                            <p><strong>שירות:</strong> {auto.integration_type}</p>
                            <p><strong>אירועים:</strong> {(auto.events || []).join(", ")}</p>
                          </>
                        )}

                        {auto.description && <p><strong>תיאור:</strong> {auto.description}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 mr-4">
                      <button
                        onClick={() => handleToggle(auto)}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        title={auto.is_active ? "השבת" : "הפעל"}
                      >
                        {auto.is_active ? (
                          <ToggleRight className="w-6 h-6 text-success" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(auto)}
                        className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                        title="מחק"
                      >
                        <Trash2 className="w-5 h-5 text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-info/5 border border-info/20 rounded-xl p-4 space-y-2">
        <p className="text-sm font-bold text-foreground">ℹ️ כיצד ליצור אוטומציה חדשה?</p>
        <p className="text-xs text-muted-foreground">
          אוטומציות נוצרות דרך קוד ב-Deno Backend Functions. ניתן ליצור אוטומציות מתוזמנות (cron), על בסיס שינויי רשומות בישויות, או קבלת webhooks מ-Google Calendar, Gmail, Slack ועוד.
        </p>
      </div>
    </div>
  );
}