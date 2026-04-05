import { Link, useLocation } from "react-router-dom";
import { Search, Sparkles, Bell } from "lucide-react";
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

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
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