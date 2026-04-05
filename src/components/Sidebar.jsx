import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Search, Megaphone, BarChart3, Settings, CreditCard, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const navItems = [
  { path: "/", label: "דשבורד", icon: LayoutDashboard },
  { path: "/leads", label: "לידים", icon: Users },
  { path: "/scrape", label: "שאיבת לידים", icon: Search },
  { path: "/campaigns", label: "קמפיינים", icon: Megaphone },
  { path: "/reports", label: "דוחות", icon: BarChart3 },
  { path: "/credits", label: "קרדיטים", icon: CreditCard },
  { path: "/settings", label: "הגדרות", icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const [credits, setCredits] = useState(null);

  useEffect(() => {
    base44.entities.CreditPackage.filter({ is_active: true }).then(pkgs => {
      const total = pkgs.reduce((s, p) => s + (p.credits_total - (p.credits_used || 0)), 0);
      setCredits(total);
    }).catch(() => setCredits(0));
  }, []);

  return (
    <aside className="w-56 min-w-56 bg-card border-l border-border flex flex-col">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground tracking-tight">BrokerPro</h1>
            <p className="text-[10px] text-muted-foreground">ניהול לידים חכם</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? "bg-primary/15 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="bg-secondary rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">קרדיטים</span>
            <span className="text-xs font-semibold text-primary">
              {credits !== null ? credits.toLocaleString() : "..."}
            </span>
          </div>
          <div className="h-1.5 bg-background rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: credits !== null ? `${Math.min((credits / 5000) * 100, 100)}%` : "0%" }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}