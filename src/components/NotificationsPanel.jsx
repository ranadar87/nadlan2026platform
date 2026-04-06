import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Trash2, X } from "lucide-react";

export default function NotificationsPanel({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [campaigns, setCampaigns] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    
    const load = async () => {
      const cData = await base44.entities.Campaign.list("-created_date", 100);
      const cMap = {};
      cData.forEach(c => { cMap[c.id] = c; });
      setCampaigns(cMap);

      const msgs = await base44.entities.CampaignMessage.filter({}, "-updated_date", 20);
      const notifs = msgs
        .filter(m => ["sent", "delivered", "opened", "replied", "failed"].includes(m.status))
        .map((m, i) => ({
          id: m.id,
          type: m.status === "failed" ? "error" : "success",
          title: m.status === "replied" ? `הגיב: ${m.lead_name}` : `${m.status === "opened" ? "נפתח" : m.status === "delivered" ? "נמסר" : m.status === "failed" ? "נכשל" : "נשלח"}: ${m.lead_name}`,
          time: m.updated_date || m.created_date,
          campaignName: campaigns[m.campaign_id]?.name || "קמפיין",
          read: localStorage.getItem(`notif_${m.id}`) === "1",
        }));
      
      setNotifications(notifs);
    };
    
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const markAsRead = (id) => {
    localStorage.setItem(`notif_${id}`, "1");
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearRead = () => {
    const unreadIds = notifications.filter(n => n.read).map(n => n.id);
    unreadIds.forEach(id => localStorage.removeItem(`notif_${id}`));
    setNotifications(prev => prev.filter(n => !n.read));
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-border rounded-xl shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-secondary/30">
        <h3 className="text-sm font-bold text-foreground">התראות</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Notifications */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">אין התראות חדשות</div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`px-4 py-3 border-b border-border/30 cursor-pointer transition-colors hover:bg-secondary/50 ${
                !n.read ? "bg-primary/5" : "opacity-60"
              }`}
            >
              <div className="flex items-start gap-2">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === "error" ? "bg-destructive" : "bg-success"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{n.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{n.campaignName}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.some(n => n.read) && (
        <div className="px-4 py-2 border-t border-border bg-secondary/20">
          <button
            onClick={clearRead}
            className="w-full text-xs font-semibold text-primary hover:text-primary/80 flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3 h-3" /> נקה שנקראו
          </button>
        </div>
      )}
    </div>
  );
}