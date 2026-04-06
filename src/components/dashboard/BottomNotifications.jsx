import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, AlertCircle, CheckCircle, MessageSquare, Zap } from "lucide-react";
import moment from "moment";
import "moment/locale/he";

moment.locale("he");

export default function BottomNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const [campaigns, messages] = await Promise.all([
        base44.entities.Campaign.filter({ status: "running" }, "-created_date", 2),
        base44.entities.CampaignMessage.filter({ status: "failed" }, "-created_date", 3),
      ]);

      const alerts = [];

      // קמפיינים פעילים
      campaigns.forEach(c => {
        alerts.push({
          id: `campaign-${c.id}`,
          type: "campaign",
          icon: Zap,
          title: c.name,
          message: `${c.sent_count || 0}/${c.total_recipients || 0} נשלחו`,
          color: "text-primary",
          bgColor: "bg-primary/10",
          time: c.updated_date,
        });
      });

      // הודעות שנכשלו
      messages.forEach(m => {
        alerts.push({
          id: `error-${m.id}`,
          type: "error",
          icon: AlertCircle,
          title: m.lead_name || "הודעה",
          message: m.error_message || "שגיאה בשליחה",
          color: "text-destructive",
          bgColor: "bg-destructive/10",
          time: m.created_date,
        });
      });

      setNotifications(alerts.slice(0, 4));
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  if (loading || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 w-80 space-y-2 z-40">
      {notifications.map(notif => {
        const Icon = notif.icon;
        return (
          <div
            key={notif.id}
            className={`flex items-start gap-3 p-3 rounded-lg border border-border ${notif.bgColor} animate-fade-in`}
          >
            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${notif.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{notif.title}</p>
              <p className="text-[10px] text-muted-foreground truncate">{notif.message}</p>
              <p className="text-[9px] text-muted-foreground/60 mt-1">{moment(notif.time).fromNow()}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}