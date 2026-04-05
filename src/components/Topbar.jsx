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
    <header className="h-16 min-h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">
          {user ? `שלום, ${user.full_name}` : "שלום"} • {today}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/scrape">
          <Button variant="outline" size="sm" className="gap-2 text-xs border-border hover:border-primary/50 hover:bg-primary/5">
            <Search className="w-3.5 h-3.5" />
            שאב לידים
          </Button>
        </Link>
        <Link to="/campaigns/new">
          <Button size="sm" className="gap-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
            <Sparkles className="w-3.5 h-3.5" />
            קמפיין חדש
          </Button>
        </Link>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}