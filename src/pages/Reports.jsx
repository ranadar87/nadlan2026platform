import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(40,63%,55%)", "hsl(168,73%,42%)", "hsl(213,55%,60%)", "hsl(0,65%,55%)", "hsl(30,80%,55%)"];
const tooltipStyle = { background: "hsl(220,18%,10%)", border: "1px solid hsl(220,12%,20%)", borderRadius: 8, color: "hsl(210,40%,93%)" };

export default function Reports() {
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Lead.list("-created_date", 500),
      base44.entities.Campaign.list("-created_date", 100),
    ]).then(([l, c]) => { setLeads(l); setCampaigns(c); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const sourceData = [
    { name: "יד2", value: leads.filter(l => l.source === "yad2").length },
    { name: "מדלן", value: leads.filter(l => l.source === "madlan").length },
    { name: "ידני", value: leads.filter(l => l.source === "manual").length },
  ].filter(d => d.value > 0);

  const cityMap = {};
  leads.forEach(l => { if (l.city) cityMap[l.city] = (cityMap[l.city] || 0) + 1; });
  const cityData = Object.entries(cityMap).sort((a,b) => b[1]-a[1]).slice(0,6).map(([city, count]) => ({ city, count }));

  const statusLabels = { new: "חדש", contacted: "נוצר קשר", interested: "מתעניין", not_interested: "לא מתעניין", deal_closed: "עסקה", archived: "ארכיון" };
  const statusMap = {};
  leads.forEach(l => { const s = l.status || "new"; statusMap[s] = (statusMap[s] || 0) + 1; });
  const statusData = Object.entries(statusMap).map(([k, v]) => ({ name: statusLabels[k] || k, value: v }));

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-6xl space-y-6">
      <h2 className="text-lg font-bold text-foreground">דוחות ואנליטיקה</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">לידים לפי עיר</h3>
          {cityData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">אין נתונים</p> : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,12%,20%)" />
                <XAxis type="number" tick={{ fill: "hsl(215,14%,55%)", fontSize: 11 }} />
                <YAxis type="category" dataKey="city" tick={{ fill: "hsl(210,40%,93%)", fontSize: 11 }} width={80} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="hsl(40,63%,55%)" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">לידים לפי מקור</h3>
          {sourceData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">אין נתונים</p> : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">התפלגות סטטוסים</h3>
          {statusData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">אין נתונים</p> : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">ביצועי קמפיינים</h3>
          {campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <BarChart3 className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">אין קמפיינים עדיין</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.slice(0,5).map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <span className="text-sm text-foreground truncate max-w-40">{c.name}</span>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>נשלחו: {c.sent_count || 0}</span>
                    <span>נפתחו: {c.opened_count || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}