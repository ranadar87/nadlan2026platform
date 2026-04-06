import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Loader } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function SiteSettings() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      
      if (me?.role !== "admin") {
        return;
      }

      const configs = await base44.entities.SiteConfig.filter({ config_key: "global" });
      if (configs.length > 0) {
        setConfig(configs[0]);
      } else {
        setConfig({
          config_key: "global",
          site_name: "",
          header_code: "",
          footer_code: "",
          custom_css: "",
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async (configToSave = config) => {
    if (!configToSave) return;
    setSaving(true);
    try {
      if (configToSave.id) {
        await base44.entities.SiteConfig.update(configToSave.id, configToSave);
        toast({ title: "הגדרות עודכנו בהצלחה" });
      } else {
        await base44.entities.SiteConfig.create(configToSave);
        toast({ title: "הגדרות נשמרו בהצלחה" });
      }
    } catch (e) {
      toast({ title: "שגיאה", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleSavePayMe = async () => {
    if (!config) return;
    setSaving(true);
    try {
      // מאחר שהגדרות PayMe אחסונות בנפרד בישות PaymeConfig
      // נציין למשתמש שצריך להגדיר דרך דף ניהול PayMe
      toast({ title: "עדכן בדשבורד ניהול PayMe", variant: "info" });
    } catch (e) {
      toast({ title: "שגיאה", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  if (!user || user.role !== "admin") {
    return <div className="text-center py-12 text-destructive">אין הרשאה מנהל</div>;
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><Loader className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">הגדרות אתר</h1>
        <p className="text-xs text-muted-foreground mt-1">ניהול קודי Header, Footer, CSS וקונפיגורציה כללית</p>
      </div>

      <div className="space-y-6">
        {/* Site Identity */}
        <div className="bg-white border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">זהות האתר</h2>
          
          <div>
            <label className="text-xs text-muted-foreground font-semibold">שם האתר</label>
            <Input
              value={config?.site_name || ""}
              onChange={e => setConfig({...config, site_name: e.target.value})}
              placeholder="שם של האתר"
              className="mt-1 bg-secondary"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-semibold">תיאור האתר</label>
            <textarea
              value={config?.site_description || ""}
              onChange={e => setConfig({...config, site_description: e.target.value})}
              placeholder="תיאור קצר של האתר"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-secondary text-sm min-h-24"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-semibold">URL של לוגו</label>
            <Input
              value={config?.site_logo_url || ""}
              onChange={e => setConfig({...config, site_logo_url: e.target.value})}
              placeholder="https://..."
              className="mt-1 bg-secondary"
            />
          </div>
        </div>

        {/* Contact & Support */}
        <div className="bg-white border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">יצוג קשר</h2>
          
          <div>
            <label className="text-xs text-muted-foreground font-semibold">דוא״ל תמיכה</label>
            <Input
              type="email"
              value={config?.contact_email || ""}
              onChange={e => setConfig({...config, contact_email: e.target.value})}
              placeholder="support@example.com"
              className="mt-1 bg-secondary"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-semibold">טלפון תמיכה</label>
            <Input
              value={config?.contact_phone || ""}
              onChange={e => setConfig({...config, contact_phone: e.target.value})}
              placeholder="050-XXX-XXXX"
              className="mt-1 bg-secondary"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-semibold">קישור WhatsApp</label>
            <Input
              value={config?.whatsapp_link || ""}
              onChange={e => setConfig({...config, whatsapp_link: e.target.value})}
              placeholder="https://wa.me/97254XXXXXXX"
              className="mt-1 bg-secondary"
            />
          </div>
        </div>

        {/* Code Injection */}
        <div className="bg-white border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">קודים</h2>
          
          <div>
            <label className="text-xs text-muted-foreground font-semibold">קוד ב-Header (בתוך &lt;head&gt;)</label>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5 mb-2">קודי אנליטיקס, Google Fonts, או CSS</p>
            <textarea
              value={config?.header_code || ""}
              onChange={e => setConfig({...config, header_code: e.target.value})}
              placeholder='<link rel="preconnect" href="https://fonts.googleapis.com">'
              className="w-full px-3 py-2 rounded-lg border border-border bg-secondary text-sm font-mono min-h-32"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-semibold">קוד ב-Footer (לפני &lt;/body&gt;)</label>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5 mb-2">סקריפטים חיצוניים, אנליטיקס</p>
            <textarea
              value={config?.footer_code || ""}
              onChange={e => setConfig({...config, footer_code: e.target.value})}
              placeholder="<script async src='...'></script>"
              className="w-full px-3 py-2 rounded-lg border border-border bg-secondary text-sm font-mono min-h-32"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-semibold">CSS מותאם אישית</label>
            <textarea
              value={config?.custom_css || ""}
              onChange={e => setConfig({...config, custom_css: e.target.value})}
              placeholder=".custom-class { color: red; }"
              className="w-full px-3 py-2 rounded-lg border border-border bg-secondary text-sm font-mono min-h-32"
            />
          </div>
        </div>

        {/* Legal & Privacy */}
        <div className="bg-white border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">משפטי והגדרות</h2>
          
          <div>
            <label className="text-xs text-muted-foreground font-semibold">URL לתנאי שימוש</label>
            <Input
              value={config?.terms_of_service_url || ""}
              onChange={e => setConfig({...config, terms_of_service_url: e.target.value})}
              placeholder="https://..."
              className="mt-1 bg-secondary"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-semibold">URL למדיניות פרטיות</label>
            <Input
              value={config?.privacy_policy_url || ""}
              onChange={e => setConfig({...config, privacy_policy_url: e.target.value})}
              placeholder="https://..."
              className="mt-1 bg-secondary"
            />
          </div>
        </div>

        {/* PayMe Settings */}
        <div className="bg-white border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">הגדרות PayMe</h2>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/30">
            <div>
              <span className="text-sm font-bold text-foreground">⚠️ מצב בדיקה (TEST MODE)</span>
              <p className="text-xs text-muted-foreground mt-1">כל המחירים יהפכו ל-5₪ לביצוע בדיקות. הנתונים אמיתיים!</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config?.test_mode || false}
                onChange={e => setConfig({...config, test_mode: e.target.checked})}
                className="rounded"
              />
              <span className="text-xs text-muted-foreground">{config?.test_mode ? "דלוק" : "כבוי"}</span>
            </label>
          </div>

          {config?.test_mode && (
            <div>
              <label className="text-xs text-muted-foreground font-semibold">מחיר בדיקה (ש"ח)</label>
              <Input
                type="number"
                value={config?.test_price || 5}
                onChange={e => setConfig({...config, test_price: parseFloat(e.target.value)})}
                placeholder="5"
                className="mt-1 bg-secondary"
              />
            </div>
          )}
        </div>

        {/* System Settings */}
        <div className="bg-white border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">הגדרות מערכת</h2>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
            <span className="text-sm font-medium text-foreground">מצב תחזוקה</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config?.maintenance_mode || false}
                onChange={e => setConfig({...config, maintenance_mode: e.target.checked})}
                className="rounded"
              />
              <span className="text-xs text-muted-foreground">{config?.maintenance_mode ? "דלוק" : "כבוי"}</span>
            </label>
          </div>

          {config?.maintenance_mode && (
            <div>
              <label className="text-xs text-muted-foreground font-semibold">הודעת תחזוקה</label>
              <textarea
                value={config?.maintenance_message || ""}
                onChange={e => setConfig({...config, maintenance_message: e.target.value})}
                placeholder="האתר בעדכון..."
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-secondary text-sm min-h-20"
              />
            </div>
          )}

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
            <span className="text-sm font-medium text-foreground">אנליטיקס</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config?.analytics_enabled !== false}
                onChange={e => setConfig({...config, analytics_enabled: e.target.checked})}
                className="rounded"
              />
              <span className="text-xs text-muted-foreground">{config?.analytics_enabled !== false ? "דלוק" : "כבוי"}</span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving} className="w-full h-11 gap-2 text-base font-bold">
          {saving ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? "שומר..." : "שמור הגדרות"}
        </Button>
      </div>
    </div>
  );
}