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
  const today = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "numeric", year: "numeric" });

  return (
    <header className="h-14 min-h-14 border-b border-border bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <Link to="/scrape">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 border-border text-muted-foreground hover:text-foreground hover:border-primary/30">
            <Search className="w-3.5 h-3.5" />
            שאב לידים
          </Button>
        </Link>
        <Link to="/campaigns/new">
          <Button size="sm" className="gap-1.5 text-xs h-8 bg-primary hover:bg-primary/90 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            קמפיין חדש
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-left">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-[11px] text-muted-foreground">{user ? `ברוך הבא, ${user.full_name}` : "ברוך הבא"} • היום {today}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
          {user?.full_name?.[0] || "B"}
        </div>
      </div>
    </header>
  );
}