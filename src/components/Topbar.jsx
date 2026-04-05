import { Link, useLocation } from "react-router-dom";
import { Search, Sparkles, Bell, Smartphone, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const pageTitles = {
  "/": "דשבורד",
  "/leads": "ניהול לידים",
  "/scrape": "שאיבת לידים",
  "/campaigns": "קמפיינים",
  "/reports": "דוחות",
  "/credits": "קרדיטים",
  "/settings": "הגדרות",
};

export default function Topbar() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [waStatus, setWaStatus] = useState(null);
  const [waPhone, setWaPhone] = useState(null);

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

  const pathKey = Object.keys(pageTitles).find(k => k !== "/" && location.pathname.startsWith(k)) || location.pathname;
  const title = pageTitles[pathKey] || pageTitles["/"];
  const today = new Date().toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const initials = user?.full_name?.split(" ").map(w => w[0]).slice(0,2).join("") || "BP";

  return (
    <header className="h-16 min-h-16 border-b border-border bg-white/80 backdrop-blur-sm flex items-center justify-between px-8" style={{ fontFamily: "'Assistant', sans-serif" }}>
      {/* Left: actions */}
      <div className="flex items-center gap-3">
        <Link to="/scrape">
          <Button variant="outline" size="sm" className="gap-2 h-9 px-4 text-sm font-medium border-border text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 rounded-xl transition-all duration-200">
            <Search className="w-4 h-4" />
            שאב לידים
          </Button>
        </Link>
        <Link to="/campaigns/new">
          <Button size="sm" className="gap-2 h-9 px-4 text-sm font-medium bg-gradient-to-l from-primary to-purple-500 hover:opacity-90 shadow-md hover:shadow-glow rounded-xl transition-all duration-200 border-0">
            <Sparkles className="w-4 h-4" />
            קמפיין חדש
          </Button>
        </Link>
      </div>

      {/* Right: user info */}
      <div className="flex items-center gap-5">
        {/* WhatsApp status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/40">
          {waStatus === "connected" ? (
            <>
              <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              <Smartphone className="w-3.5 h-3.5 text-success" />
              <span className="text-[11px] font-semibold text-success">{waPhone || "WhatsApp"}</span>
            </>
          ) : waStatus === "disconnected" ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
              <span className="text-[11px] font-semibold text-warning">WhatsApp נתון</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse"></div>
              <span className="text-[11px] font-medium text-muted-foreground">בדיקה...</span>
            </>
          )}
        </div>
        <div className="text-right">
          <p className="text-base font-bold text-foreground leading-tight">{title}</p>
          <p className="text-xs text-muted-foreground">{user ? `ברוך הבא, ${user.full_name}` : "ברוך הבא"} • {today}</p>
        </div>
        <button className="relative">
          <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-destructive rounded-full" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
          {initials}
        </div>
      </div>
    </header>
  );
}