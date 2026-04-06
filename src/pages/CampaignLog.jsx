import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, RefreshCw, Search, CheckCircle, XCircle, Clock, MessageSquare, Send, Eye, Radio } from "lucide-react";
import moment from "moment";
import "moment/locale/he";
moment.locale("he");

const statusConfig = {
  pending: { label: "ממתין", color: "bg-muted text-muted-foreground", icon: Clock },
  sending: { label: "שולח...", color: "bg-yellow-100 text-yellow-700", icon: Send },
  sent: { label: "נשלח", color: "bg-info/15 text-info", icon: Send },
  delivered: { label: "נמסר", color: "bg-success/15 text-success", icon: CheckCircle },
  opened: { label: "נפתח", color: "bg-primary/15 text-primary", icon: Eye },
  replied: { label: "הגיב", color: "bg-accent/15 text-accent", icon: MessageSquare },
  failed: { label: "נכשל", color: "bg-destructive/15 text-destructive", icon: XCircle },
};

export default function CampaignLog() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get("id");

  const [campaign, setCampaign] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [changedIds, setChangedIds] = useState(new Set());
  const prevStatusRef = useRef({});
  const intervalRef = useRef(null);

  const loadData = useCallback(async () => {
    if (!campaignId) return;
    const [cData, msgs] = await Promise.all([
      base44.entities.Campaign.filter({ id: campaignId }).then(r => r[0]),
      base44.entities.CampaignMessage.filter({ campaign_id: campaignId }, "-created_date", 500),
    ]);
    setCampaign(cData);

    // מצא הודעות ששינו סטטוס — הדגש אותן
    const newChanged = new Set();
    msgs.forEach(m => {
      if (prevStatusRef.current[m.id] && prevStatusRef.current[m.id] !== m.status) {
        newChanged.add(m.id);
      }
    });
    if (newChanged.size > 0) setChangedIds(newChanged);
    setTimeout(() => setChangedIds(new Set()), 2500);

    // שמור סטטוסים נוכחיים
    const statusMap = {};
    msgs.forEach(m => { statusMap[m.id] = m.status; });
    prevStatusRef.current = statusMap;

    setMessages(msgs);
    setLastUpdate(new Date());
    setLoading(false);

    // עצור polling אם הקמפיין הסתיים
    if (cData?.status === "completed" || cData?.status === "stopped") {
      setIsLive(false);
    }
  }, [campaignId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (isLive) {
      intervalRef.current = setInterval(loadData, 3000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isLive, loadData]);

  const filtered = messages.filter(m => {
    const matchSearch = !search || (m.lead_name || "").includes(search) || (m.lead_phone || "").includes(search);
    const matchStatus = filterStatus === "all" || m.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: messages.length,
    sent: messages.filter(m => !["pending", "failed", "sending"].includes(m.status)).length,
    delivered: messages.filter(m => ["delivered","opened","replied"].includes(m.status)).length,
    opened: messages.filter(m => ["opened","replied"].includes(m.status)).length,
    replied: messages.filter(m => m.status === "replied").length,
    failed: messages.filter(m => m.status === "failed").length,
    pending: messages.filter(m => ["pending","sending"].includes(m.status)).length,
  };

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/campaigns")} className="rounded-xl">
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">לוג קמפיין</h1>
          {campaign && <p className="text-xs text-muted-foreground">{campaign.name} • {messages.length} הודעות</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLive(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              isLive ? "bg-success/10 border-success/30 text-success" : "bg-secondary border-border text-muted-foreground hover:text-foreground"
            }`}>
            {isLive ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
            ) : (
              <Radio className="w-3 h-3" />
            )}
            {isLive ? "עדכון אוטומטי" : "מושהה"}
          </button>
          {lastUpdate && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              עודכן {moment(lastUpdate).format("HH:mm:ss")}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> רענן
          </Button>
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { key: "sent", label: "נשלחו", color: "text-info" },
            { key: "delivered", label: "נמסרו", color: "text-success" },
            { key: "opened", label: "נפתחו", color: "text-primary" },
            { key: "replied", label: "הגיבו", color: "text-accent" },
            { key: "failed", label: "נכשלו", color: "text-destructive" },
            { key: "pending", label: "ממתינים", color: "text-muted-foreground" },
          ].map(({ key, label, color }) => (
            <div key={key} className="bg-white rounded-xl border border-border p-3 text-center cursor-pointer hover:border-primary/20 transition-colors"
              onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}>
              <p className={`text-xl font-bold ${color}`}>{stats[key]}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
              {filterStatus === key && <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-1" />}
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {campaign && stats.total > 0 && (
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground">התקדמות</span>
            <span className="text-xs text-muted-foreground">{stats.sent}/{stats.total} ({Math.round(stats.sent/stats.total*100)}%)</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-l from-primary to-purple-400 rounded-full transition-all duration-700"
              style={{ width: `${Math.round(stats.sent/stats.total*100)}%` }} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש לפי שם או טלפון..." className="pr-9 bg-secondary border-border" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-secondary text-sm text-foreground">
          <option value="all">כל הסטטוסים</option>
          {Object.entries(statusConfig).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Messages table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2fr_80px_120px_130px_1fr] gap-0 text-xs font-semibold text-muted-foreground bg-secondary px-5 py-3 border-b border-border text-right">
          <span>שם / טלפון</span>
          <span className="text-center">וריאציה</span>
          <span className="text-center">סטטוס</span>
          <span className="text-center">זמן שליחה</span>
          <span>שגיאה</span>
        </div>
        {loading ? (
          <div className="space-y-0">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-14 animate-pulse bg-secondary/40 border-b border-border/30" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">אין הודעות תואמות</div>
        ) : (
          filtered.map((msg) => {
            const sc = statusConfig[msg.status] || statusConfig.pending;
            const StatusIcon = sc.icon;
            return (
              <div key={msg.id} className={`grid grid-cols-[2fr_80px_120px_130px_1fr] gap-0 px-5 py-3 border-b border-border/30 last:border-0 transition-all duration-700 items-center ${
                changedIds.has(msg.id) ? "bg-primary/8 border-r-2 border-r-primary" : "hover:bg-secondary/20"
              }`}>
                {/* Name + Phone */}
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{msg.lead_name || "—"}</p>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5" dir="ltr">{msg.lead_phone || "—"}</p>
                  {msg.scheduled_at && msg.status === "pending" && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">מתוזמן: {moment(msg.scheduled_at).format("HH:mm")}</p>
                  )}
                </div>

                {/* Variation */}
                <div className="flex justify-center">
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {msg.variation_used || "A"}
                  </span>
                </div>

                {/* Status */}
                <div className="flex justify-center">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${sc.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {sc.label}
                  </span>
                </div>

                {/* Sent time */}
                <div className="text-center">
                  {msg.sent_at ? (
                    <span className="text-xs text-muted-foreground">
                      {moment(msg.sent_at).format("DD/MM/YY")}<br />
                      <span className="font-mono text-[11px]">{moment(msg.sent_at).format("HH:mm")}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </div>

                {/* Error */}
                <div className="text-right">
                  {msg.error_message ? (
                    <span className="text-[11px] text-destructive bg-destructive/8 px-2 py-0.5 rounded block truncate max-w-[200px]" title={msg.error_message}>
                      {msg.error_message}
                    </span>
                  ) : msg.status !== "pending" && msg.status !== "failed" ? (
                    <span className="text-[11px] text-success">✓ ביצוע תקין</span>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}