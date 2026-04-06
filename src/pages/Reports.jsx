import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { TrendingUp, Users, Megaphone, Send, MessageSquare, CheckCircle, XCircle, ChevronDown } from "lucide-react";
import moment from "moment";
import "moment/locale/he";
moment.locale("he");

const COLORS = ["hsl(248,80%,60%)", "hsl(158,64%,44%)", "hsl(196,90%,50%)", "hsl(38,95%,54%)", "hsl(4,80%,56%)"];

const tooltipStyle = {
  background: "hsl(0,0%,100%)", border: "1px solid hsl(230,16%,90%)",
  borderRadius: 12, color: "hsl(224,50%,10%)", fontSize: 12,
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
};

const statusLabels = {
  new: "חדש", contacted: "נוצר קשר", interested: "מתעניין",
  not_interested: "לא מתעניין", deal_closed: "עסקה סגורה", archived: "ארכיון"
};

const KPICard = ({ icon: Icon, label, value, sub, color, trend }) => (
  <div className="bg-white rounded-2xl border border-border shadow-card p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="text-[11px] text-success mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default function Reports() {
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState("all");
  const [expandedCampaign, setExpandedCampaign] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Lead.list("-created_date", 500),
      base44.entities.Campaign.list("-created_date", 100),
      base44.entities.CampaignMessage.list("-created_date", 1000),
    ]).then(([l, c, m]) => { setLeads(l); setCampaigns(c); setMessages(m); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // KPI calculations
  const totalSent = messages.filter(m => m.status !== "pending").length;
  const totalDelivered = messages.filter(m => ["delivered","opened","replied"].includes(m.status)).length;
  const totalReplied = messages.filter(m => m.status === "replied").length;
  const totalFailed = messages.filter(m => m.status === "failed").length;
  const deliveryRate = totalSent > 0 ? Math.round(totalDelivered / totalSent * 100) : 0;
  const replyRate = totalSent > 0 ? Math.round(totalReplied / totalSent * 100) : 0;

  // Source distribution
  const sourceData = [
    { name: "יד2", value: leads.filter(l => l.source === "yad2").length },
    { name: "מדלן", value: leads.filter(l => l.source === "madlan").length },
    { name: "ידני", value: leads.filter(l => l.source === "manual").length },
  ].filter(d => d.value > 0);

  // City distribution
  const cityMap = {};
  leads.forEach(l => { if (l.city) cityMap[l.city] = (cityMap[l.city] || 0) + 1; });
  const cityData = Object.entries(cityMap).sort((a,b) => b[1]-a[1]).slice(0,7).map(([city, count]) => ({ city, count }));

  // Status distribution
  const statusMap = {};
  leads.forEach(l => { const s = l.status || "new"; statusMap[s] = (statusMap[s] || 0) + 1; });
  const statusData = Object.entries(statusMap).map(([k, v]) => ({ name: statusLabels[k] || k, value: v }));

  // Campaign performance
  const campaignPerf = campaigns.map(c => {
    const msgs = messages.filter(m => m.campaign_id === c.id);
    const sent = msgs.filter(m => m.status !== "pending").length;
    const delivered = msgs.filter(m => ["delivered","opened","replied"].includes(m.status)).length;
    const replied = msgs.filter(m => m.status === "replied").length;
    const failed = msgs.filter(m => m.status === "failed").length;
    return {
      ...c,
      _msgs: msgs,
      _sent: sent,
      _delivered: delivered,
      _replied: replied,
      _failed: failed,
      _deliveryRate: sent > 0 ? Math.round(delivered / sent * 100) : 0,
      _replyRate: sent > 0 ? Math.round(replied / sent * 100) : 0,
    };
  });

  // Weekly lead trend (last 8 weeks)
  const weeklyData = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = moment().subtract(i, "weeks").startOf("week");
    const weekEnd = moment().subtract(i, "weeks").endOf("week");
    weeklyData.push({
      name: weekStart.format("DD/MM"),
      לידים: leads.filter(l => moment(l.created_date).isBetween(weekStart, weekEnd)).length,
    });
  }

  const statusColor = (s) => {
    if (s === "running") return "bg-success/15 text-success";
    if (s === "completed") return "bg-primary/15 text-primary";
    if (s === "stopped") return "bg-destructive/15 text-destructive";
    if (s === "paused") return "bg-warning/15 text-warning";
    if (s === "scheduled") return "bg-info/15 text-info";
    return "bg-muted text-muted-foreground";
  };
  const statusHeb = { draft:"טיוטה", scheduled:"מתוזמן", running:"פעיל", paused:"מושהה", completed:"הושלם", stopped:"הופסק" };

  return (
    <div className="max-w-7xl space-y-6 animate-fade-in">
      <h2 className="text-lg font-bold text-foreground">דוחות ואנליטיקה</h2>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Users} label="סה״כ לידים" value={leads.length} color="bg-primary/10 text-primary" />
        <KPICard icon={Megaphone} label="קמפיינים" value={campaigns.length} color="bg-info/10 text-info" />
        <KPICard icon={Send} label="הודעות שנשלחו" value={totalSent} sub={`אחוז מסירה: ${deliveryRate}%`} color="bg-success/10 text-success" />
        <KPICard icon={MessageSquare} label="תגובות" value={totalReplied} sub={`אחוז תגובה: ${replyRate}%`} color="bg-accent/10 text-accent" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead trend */}
        <div className="bg-white rounded-2xl border border-border shadow-card p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">מגמת לידים שבועית</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(230,16%,93%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(224,16%,55%)", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(224,16%,55%)", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="לידים" stroke="hsl(248,80%,60%)" strokeWidth={2.5} dot={{ fill: "hsl(248,80%,60%)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* City distribution */}
        <div className="bg-white rounded-2xl border border-border shadow-card p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">לידים לפי עיר</h3>
          {cityData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">אין נתונים</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230,16%,93%)" />
                <XAxis type="number" tick={{ fill: "hsl(224,16%,55%)", fontSize: 11 }} />
                <YAxis type="category" dataKey="city" tick={{ fill: "hsl(224,50%,10%)", fontSize: 11 }} width={70} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="hsl(248,80%,60%)" radius={[0,6,6,0]} label={false} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Source pie */}
        <div className="bg-white rounded-2xl border border-border shadow-card p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">מקורות לידים</h3>
          {sourceData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">אין נתונים</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">
                    {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {sourceData.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="text-xs text-foreground font-medium">{s.name}</span>
                    <span className="text-xs text-muted-foreground">({s.value})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status pie */}
        <div className="bg-white rounded-2xl border border-border shadow-card p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">סטטוסי לידים</h3>
          {statusData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">אין נתונים</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {statusData.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-foreground font-medium">{s.name}</span>
                    <span className="text-xs text-muted-foreground">({s.value})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Campaign performance table */}
      <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">ביצועי קמפיינים</h3>
          <span className="text-xs text-muted-foreground">{campaigns.length} קמפיינים</span>
        </div>
        {campaignPerf.length === 0 ? (
          <div className="py-12 text-center">
            <Megaphone className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">אין קמפיינים עדיין</p>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div className="grid grid-cols-[2fr_80px_repeat(4,1fr)_repeat(2,90px)] gap-0 px-6 py-3 bg-secondary/50 text-[11px] font-semibold text-muted-foreground border-b border-border">
              <span>שם קמפיין</span>
              <span className="text-center">סטטוס</span>
              <span className="text-center">נמענים</span>
              <span className="text-center">נשלחו</span>
              <span className="text-center">נמסרו</span>
              <span className="text-center">הגיבו</span>
              <span className="text-center">מסירה %</span>
              <span className="text-center">תגובה %</span>
            </div>
            {campaignPerf.map(c => (
              <div key={c.id}>
                <div
                  className="grid grid-cols-[2fr_80px_repeat(4,1fr)_repeat(2,90px)] gap-0 px-6 py-4 border-b border-border/40 last:border-0 hover:bg-secondary/20 transition-colors cursor-pointer items-center"
                  onClick={() => setExpandedCampaign(expandedCampaign === c.id ? null : c.id)}>
                  <div>
                    <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{moment(c.created_date).format("DD/MM/YY")}</p>
                  </div>
                  <div className="flex justify-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor(c.status)}`}>
                      {statusHeb[c.status] || c.status}
                    </span>
                  </div>
                  <p className="text-sm text-center text-foreground font-medium">{c.total_recipients || 0}</p>
                  <p className="text-sm text-center text-info font-medium">{c._sent}</p>
                  <p className="text-sm text-center text-success font-medium">{c._delivered}</p>
                  <p className="text-sm text-center text-accent font-medium">{c._replied}</p>
                  {/* Delivery rate bar */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-foreground">{c._deliveryRate}%</span>
                    <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-success rounded-full" style={{ width: `${c._deliveryRate}%` }} />
                    </div>
                  </div>
                  {/* Reply rate bar */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-foreground">{c._replyRate}%</span>
                    <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${c._replyRate}%` }} />
                    </div>
                  </div>
                </div>

                {/* Expanded messages per campaign */}
                {expandedCampaign === c.id && c._msgs.length > 0 && (
                  <div className="bg-secondary/30 border-b border-border/40 px-8 py-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-3">פירוט הודעות</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "נשלחו", value: c._sent, color: "text-info" },
                        { label: "נמסרו", value: c._delivered, color: "text-success" },
                        { label: "הגיבו", value: c._replied, color: "text-accent" },
                        { label: "נכשלו", value: c._failed, color: "text-destructive" },
                        { label: "אחוז מסירה", value: `${c._deliveryRate}%`, color: "text-success" },
                        { label: "אחוז תגובה", value: `${c._replyRate}%`, color: "text-accent" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-white rounded-xl p-3 text-center shadow-sm">
                          <p className={`text-lg font-bold ${color}`}>{value}</p>
                          <p className="text-[10px] text-muted-foreground">{label}</p>
                        </div>
                      ))}
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