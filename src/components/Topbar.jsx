import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Sparkles, Bell, Smartphone, AlertTriangle, Settings, HelpCircle } from "lucide-react";
import HelpCenter from "./HelpCenter";
import NotificationsPanel from "./NotificationsPanel";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const pageTitles = {
  "/": "דשבורד",
  "/dashboard": "דשבורד",
  "/leads": "ניהול לידים",
  "/scrape": "שאיבת לידים",
  "/campaigns": "קמפיינים",
  "/reports": "דוחות",
  "/credits": "קרדיטים",
  "/settings": "הגדרות",
  "/admin": "ניהול מערכת",
  "/billing": "חיוב וקרדיטים",
  "/subscription": "המנוי שלי",
  "/pricing": "תמחור",
};

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [waStatus, setWaStatus] = useState(null);
  const [waPhone, setWaPhone] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const u = await base44.auth.me().catch(() => null);
      setUser(u);
      setWaPhone(u?.wa_phone || null);
      try {
        const res = await base44.functions.invoke("getWAStatus", {});
        if (res.data?.connected) {
          setWaStatus("connected");
          if (res.data?.phone) {
            setWaPhone(res.data.phone);
          }
        } else if (res.data?.status === "server_unavailable") {
          setWaStatus("error");
        } else {
          setWaStatus("disconnected");
        }
      } catch (e) {
        setWaStatus("error");
      }
    };
    load();
  }, []);

  useEffect(() => {
    const checkNotifs = async () => {
      const msgs = await base44.entities.CampaignMessage.list("-updated_date", 50);
      const unread = msgs.filter(m => !localStorage.getItem(`notif_${m.id}`)).length;
      setUnreadCount(unread);
    };
    checkNotifs();
    const interval = setInterval(checkNotifs, 15000);
    return () => clearInterval(interval);
  }, []);

  const pathKey = Object.keys(pageTitles).find(k => k !== "/" && location.pathname.startsWith(k));
  const title = pathKey ? pageTitles[pathKey] : (pageTitles[location.pathname] || pageTitles["/"]);
  const today = new Date().toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const initials = user?.full_name?.split(" ").map(w => w[0]).slice(0,2).join("") || "U";

  return (
    <>
    <HelpCenter open={showHelp} onClose={() => setShowHelp(false)} />
    <header className="h-16 min-h-16 border-b border-border bg-white/80 backdrop-blur-sm flex items-center justify-between px-8 gap-4" style={{ fontFamily: "'Assistant', sans-serif" }}>
      {/* Left: user info + WA status */}
      <div className="flex items-center gap-3 min-w-fit">
        <Link to="/scrape" data-tour="scrape-btn">
          <Button variant="outline" size="sm" className="gap-2 h-9 px-4 text-sm font-medium border-border text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 rounded-xl transition-all duration-200">
            <Search className="w-4 h-4" />
            שאב לידים
          </Button>
        </Link>
      </div>

      {/* Right: actions + icons */}
      <div className="flex items-center gap-3 ml-auto">
        <Link to="/scrape" data-tour="scrape-btn">
          <Button variant="outline" size="sm" className="gap-2 h-9 px-4 text-sm font-medium border-border text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 rounded-xl transition-all duration-200">
            <Search className="w-4 h-4" />
            שאב לידים
          </Button>
        </Link>
        <Link to="/campaigns/new" data-tour="campaign-btn">
          <Button size="sm" className="gap-2 h-9 px-4 text-sm font-medium bg-gradient-to-l from-primary to-purple-500 hover:opacity-90 shadow-md hover:shadow-glow rounded-xl transition-all duration-200 border-0">
            <Sparkles className="w-4 h-4" />
            קמפיין חדש
          </Button>
        </Link>
        {/* WhatsApp status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/40 text-[11px]">
          {waStatus === "connected" ? (
            <>
              <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              <Smartphone className="w-3.5 h-3.5 text-success" />
              <span className="font-semibold text-success truncate">{waPhone ? `${waPhone}` : "WhatsApp"}</span>
            </>
          ) : waStatus === "disconnected" ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
              <span className="font-semibold text-warning">נתוק</span>
            </>
          ) : waStatus === "error" ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
              <span className="font-semibold text-destructive">שגיאה</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse"></div>
              <span className="font-medium text-muted-foreground">בדיקה...</span>
            </>
          )}
        </div>
        <button onClick={() => setShowHelp(true)} title="מרכז תמיכה" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
          <HelpCircle className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
            title="התראות"
          >
            <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <NotificationsPanel isOpen={showNotifs} onClose={() => setShowNotifs(false)} />
        </div>
        <button
          onClick={() => navigate("/settings")}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md hover:opacity-90 transition-opacity cursor-pointer"
          title="הגדרות חשבון">
          {initials}
        </button>
      </div>
    </header>
    </>
  );
}