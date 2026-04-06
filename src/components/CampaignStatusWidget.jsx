import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Megaphone, Clock, ChevronLeft, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import moment from "moment";
import "moment/locale/he";
moment.locale("he");

export default function CampaignStatusWidget() {
  const [campaign, setCampaign] = useState(null);
  const [messages, setMessages] = useState([]);
  const [waConnected, setWaConnected] = useState(null);
  const [nextMsg, setNextMsg] = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // קמפיין פעיל
      const campaigns = await base44.entities.Campaign.filter({ status: "running" }, "-created_date", 1);
      if (!campaigns.length) { setCampaign(null); return; }
      const c = campaigns[0];
      setCampaign(c);

      // הודעות
      const msgs = await base44.entities.CampaignMessage.filter({ campaign_id: c.id, status: "pending" }, "scheduled_at", 5);
      setMessages(msgs);

      // הודעה הבאה — הכי קרובה לעכשיו
      const now = new Date();
      const upcoming = msgs
        .filter(m => m.scheduled_at)
        .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
        .find(m => new Date(m.scheduled_at) >= now);
      setNextMsg(upcoming || msgs[0] || null);

      // סטטוס WA
      const waRes = await base44.functions.invoke("getWAStatus", {}).catch(() => null);
      setWaConnected(waRes?.data?.status === "connected");
    } catch {
      // silent
    }
  };

  if (!campaign) return null;

  const pending = messages.length;
  const total = campaign.total_recipients || 0;
  const sent = campaign.sent_count || 0;
  const progress = total > 0 ? Math.round((sent / total) * 100) : 0;

  const nextTime = nextMsg?.scheduled_at
    ? moment(nextMsg.scheduled_at).fromNow()
    : "ממתין...";

  return (
    <div className="mx-3 mb-3 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-primary/10">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <span className="text-[11px] font-bold text-foreground">קמפיין פעיל</span>
        </div>
        {waConnected !== null && (
          <span className={`flex items-center gap-1 text-[10px] font-semibold ${waConnected ? "text-success" : "text-destructive"}`}>
            {waConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {waConnected ? "מחובר" : "מנותק"}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-3 py-2.5 space-y-2">
        <p className="text-[12px] font-semibold text-foreground truncate">{campaign.name}</p>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>{sent} נשלחו</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-l from-primary to-purple-400 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Next message */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">הבאה:</span>
          <span className={`font-semibold ${waConnected === false ? "text-destructive" : "text-primary"}`}>
            {waConnected === false ? "WA מנותק!" : nextTime}
          </span>
        </div>

        {/* WA warning */}
        {waConnected === false && (
          <div className="flex items-start gap-1.5 bg-destructive/8 rounded-lg px-2 py-1.5">
            <AlertTriangle className="w-3 h-3 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-destructive leading-tight">חבר WhatsApp בהגדרות כדי לשלוח</p>
          </div>
        )}

        {/* Link to log */}
        <Link to={`/campaigns/log?id=${campaign.id}`}
          className="flex items-center justify-between w-full bg-primary/10 hover:bg-primary/15 rounded-lg px-3 py-1.5 transition-colors">
          <span className="text-[11px] font-semibold text-primary">פתח לוג קמפיין</span>
          <ChevronLeft className="w-3.5 h-3.5 text-primary" />
        </Link>
      </div>
    </div>
  );
}