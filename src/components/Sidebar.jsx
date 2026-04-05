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
  const [leadsCount, setLeadsCount] = useState(null);

  useEffect(() => {
    base44.entities.CreditPackage.filter({ is_active: true }).then(pkgs => {
      const total = pkgs.reduce((s, p) => s + (p.credits_total - (p.credits_used || 0)), 0);
      setCredits(total);
    }).catch(() => setCredits(0));

    base44.entities.Lead.list("-created_date", 1).then(data => {
      setLeadsCount(data.length);
    }).catch(() => {});
  }, []);

  return (
    <aside className="w-[200px] min-w-[200px] bg-white shadow-sidebar border-l border-border flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground tracking-tight">BrokerPro</h1>
            <p className="text-[9px] text-muted-foreground leading-tight">ניהול לידים חכם</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 group relative ${
                isActive
                  ? "bg-primary text-white font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
              {item.path === "/leads" && leadsCount > 0 && (
                <span className={`mr-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                  {leadsCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Credits */}
      <div className="p-3 border-t border-border">
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-muted-foreground">קרדיטים פנויים</span>
          </div>
          <p className="text-lg font-bold text-primary mb-1.5">
            {credits !== null ? credits.toLocaleString() : "—"}
          </p>
          <div className="h-1.5 bg-primary/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: credits !== null ? `${Math.min((credits / 5000) * 100, 100)}%` : "0%" }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}