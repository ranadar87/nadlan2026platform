import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CreditCard, Zap, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";



export default function Billing() {
  const [user, setUser] = useState(null);
  const [packages_data, setPackagesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      
      const pkgs = await base44.entities.CreditPackage.list("-created_date", 20);
      setPackagesData(pkgs);
      setLoading(false);
    };
    load();
  }, []);

  const handlePurchase = (pkg) => {
    // Link to pricing page to buy actual subscription plans
    window.location.href = `/pricing`;
  };

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">חבילות קרדיטים</h2>
        <p className="text-sm text-muted-foreground mt-1">בחר חבילה וקנה קרדיטים לשליחת הודעות</p>
      </div>

      {/* Current Balance */}
      {user && (
        <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-foreground">קרדיטים זמינים</span>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {packages_data.reduce((sum, p) => sum + (p.credits_total - p.credits_used || 0), 0).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-2">עדכון אחרון: כרגע</p>
        </div>
      )}

      {/* Info */}
      <div className="bg-info/5 border border-info/20 rounded-xl p-4">
        <p className="text-sm text-foreground font-semibold">💡 קנה חבילות מנויים</p>
        <p className="text-xs text-muted-foreground mt-1">כדי לקנות חבילות מנויים עם יותר קרדיטים, בקר בעמוד התמחור.</p>
      </div>

      {/* Packages Grid */}
      {loading ? (
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[1,2,3].map(i => <div key={i} className="h-64 bg-secondary rounded-xl animate-pulse" />)}
       </div>
      ) : packages_data.length === 0 ? (
       <div className="bg-card border border-border rounded-xl p-12 text-center">
         <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
         <p className="text-sm text-foreground font-medium">אין חבילות זמינות כרגע</p>
         <p className="text-xs text-muted-foreground mt-1">אנא צור קשר לתמיכה</p>
       </div>
      ) : (
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {packages_data.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative rounded-xl border-2 p-6 transition-all hover:shadow-lg border-border bg-white`}
            >
              <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground">{pkg.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{pkg.type === "scraping" ? "שאיבת לידים" : "SMS"}</p>
              </div>

              <div className="mb-6">
                <p className="text-3xl font-bold text-foreground">{pkg.credits_total.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">קרדיטים בחבילה</p>
              </div>

              <div className="mb-4 bg-secondary/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">שיצא בתאריך</p>
                <p className="text-sm font-semibold text-foreground">{new Date(pkg.created_date).toLocaleDateString("he-IL")}</p>
              </div>

              {pkg.expires_at && (
                <div className="mb-4 bg-warning/5 border border-warning/20 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">תפוגה בתאריך</p>
                  <p className="text-sm font-semibold text-foreground">{new Date(pkg.expires_at).toLocaleDateString("he-IL")}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-1">משמש</p>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full"
                    style={{ width: `${(pkg.credits_used / pkg.credits_total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{pkg.credits_used || 0} / {pkg.credits_total.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Packages */}
      {packages_data.length > 0 && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-secondary/30">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" /> חבילות פעילות
            </h3>
          </div>
          <div className="divide-y divide-border">
            {packages_data.map(pkg => {
              const remaining = pkg.credits_total - (pkg.credits_used || 0);
              const percent = (remaining / pkg.credits_total) * 100;
              return (
                <div key={pkg.id} className="px-6 py-4 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm text-foreground">{pkg.name}</p>
                    <span className={`text-xs font-bold ${percent > 50 ? "text-success" : percent > 20 ? "text-warning" : "text-destructive"}`}>
                      {remaining.toLocaleString()} / {pkg.credits_total.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-purple-400 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  {pkg.expires_at && (
                    <p className="text-[11px] text-muted-foreground mt-2">
                      תפוגה: {new Date(pkg.expires_at).toLocaleDateString("he-IL")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}