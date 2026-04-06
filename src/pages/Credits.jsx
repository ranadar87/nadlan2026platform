import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CreditCard, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import moment from "moment";

export default function Credits() {
  const [packages, setPackages] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.CreditPackage.list("-created_date", 50),
      base44.entities.ScrapeBatch.list("-created_date", 20),
    ]).then(([p, b]) => { setPackages(p); setBatches(b); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const activePackages = packages.filter(p => p.is_active);
  const totalRemaining = activePackages.reduce((s, p) => s + (p.credits_total - (p.credits_used || 0)), 0);
  const totalCredits = activePackages.reduce((s, p) => s + p.credits_total, 0);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  if (activePackages.length === 0) {
    return (
      <div className="max-w-4xl space-y-6">
        <h2 className="text-lg font-bold text-foreground">קרדיטים וחבילות</h2>
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-foreground font-medium">אין חבילות קרדיטים פעילות</p>
          <p className="text-xs text-muted-foreground mt-1">רכוש חבילה כדי להתחיל לשאוב לידים.</p>
          <Button size="sm" className="gap-2 text-xs mt-4"><Plus className="w-3.5 h-3.5" />רכוש חבילה</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">קרדיטים וחבילות</h2>
        <Button size="sm" className="gap-2 text-xs"><Plus className="w-3.5 h-3.5" />רכוש חבילה</Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{totalRemaining.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">קרדיטים נותרו מתוך {totalCredits.toLocaleString()}</p>
          </div>
        </div>
        <Progress value={totalCredits > 0 ? (totalRemaining / totalCredits) * 100 : 0} className="h-2 bg-secondary" />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">חבילות פעילות</h3>
        {activePackages.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">אין חבילות פעילות</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activePackages.map(pkg => {
              const remaining = pkg.credits_total - (pkg.credits_used || 0);
              return (
                <div key={pkg.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{pkg.name}</p>
                      <p className="text-xs text-muted-foreground">{pkg.type === "scraping" ? "שאיבה" : "SMS"}</p>
                    </div>
                    <p className="text-sm font-bold text-primary">{remaining.toLocaleString()} / {pkg.credits_total.toLocaleString()}</p>
                  </div>
                  <Progress value={(remaining / pkg.credits_total) * 100} className="h-1.5 bg-secondary" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">היסטוריית שאיבות</h3>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {batches.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">אין פעילות</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="p-3 text-right text-xs text-muted-foreground font-medium">תאריך</th>
                  <th className="p-3 text-right text-xs text-muted-foreground font-medium">מקור</th>
                  <th className="p-3 text-right text-xs text-muted-foreground font-medium">סטטוס</th>
                  <th className="p-3 text-right text-xs text-muted-foreground font-medium">לידים</th>
                  <th className="p-3 text-right text-xs text-muted-foreground font-medium">קרדיטים</th>
                </tr>
              </thead>
              <tbody>
                {batches.map(b => (
                  <tr key={b.id} className="border-b border-border/30">
                    <td className="p-3 text-xs text-muted-foreground">{moment(b.created_date).format("DD/MM/YY HH:mm")}</td>
                    <td className="p-3 text-foreground">{b.source === "yad2" ? "יד2" : "מדלן"}</td>
                    <td className="p-3 text-foreground">{b.status === "completed" ? "הושלם" : b.status === "running" ? "מתבצע" : "נכשל"}</td>
                    <td className="p-3 text-success">+{b.new_leads || 0}</td>
                    <td className="p-3 text-destructive">-{b.credits_used || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}