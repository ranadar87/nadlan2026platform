import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CreditCard, Zap, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

const packages = [
  { id: 1, name: "סטארטר", credits: 5000, price: 99, description: "עד 5000 הודעות" },
  { id: 2, name: "פרו", credits: 20000, price: 299, description: "עד 20,000 הודעות", popular: true },
  { id: 3, name: "אנטרפרייז", credits: 100000, price: 999, description: "עד 100,000 הודעות" },
];

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
    // PayMe integration will be here
    // For now, redirect to PayMe checkout
    const paymeUrl = `https://paymeservice.com/checkout?amount=${pkg.price}&description=${pkg.name}`;
    window.open(paymeUrl, "_blank");
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

      {/* Packages Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-secondary rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative rounded-xl border-2 p-6 transition-all ${
                pkg.popular
                  ? "border-primary bg-primary/5 shadow-lg"
                  : "border-border bg-white hover:border-primary/30"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-3 py-1 rounded-full text-[10px] font-bold">
                  פופולרי ⭐
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground">{pkg.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{pkg.description}</p>
              </div>

              <div className="mb-6">
                <p className="text-3xl font-bold text-foreground">{pkg.price}₪</p>
                <p className="text-xs text-muted-foreground mt-1">{pkg.credits.toLocaleString()} קרדיטים</p>
                <p className="text-[11px] text-success font-semibold mt-2">
                  {(pkg.credits / pkg.price * 100).toFixed(1)} קרדיטים לשקל
                </p>
              </div>

              <Button
                onClick={() => handlePurchase(pkg)}
                className={`w-full gap-2 ${pkg.popular ? "" : "bg-secondary text-foreground hover:bg-secondary/80"}`}
              >
                <CreditCard className="w-4 h-4" />
                {pkg.popular ? "בחר חבילה זו" : "קנה"}
              </Button>
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