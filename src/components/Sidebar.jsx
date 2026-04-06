import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Search, Megaphone, BarChart3, Settings, CreditCard, Zap, Calendar, Briefcase } from "lucide-react";
import CampaignStatusWidget from "./CampaignStatusWidget";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const mainTabs = [
  { id: "leads", label: "לידים" },
  { id: "clients", label: "ניהול לקוחות" },
  { id: "calendar", label: "יומן" },
  { id: "business", label: "ניהול עסק 360" },
];

const navByTab = {
  leads: [
    { path: "/", label: "דשבורד", icon: LayoutDashboard },
    { path: "/leads", label: "לידים", icon: Users },
    { path: "/scrape", label: "שאיבת לידים", icon: Search },
    { path: "/campaigns", label: "קמפיינים", icon: Megaphone },
    { path: "/reports", label: "דוחות", icon: BarChart3 },
    { path: "/credits", label: "קרדיטים", icon: CreditCard },
  ],
  clients: [
    { path: "/leads", label: "פנקס לקוחות", icon: Users },
  ],
  calendar: [
    { path: "/settings", label: "יומן (בקרוב)", icon: Calendar },
  ],
  business: [
    { path: "/settings", label: "ניהול עסק (בקרוב)", icon: Briefcase },
  ],
};

const bottomNav = [
  { path: "/settings", label: "הגדרות", icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const [credits, setCredits] = useState(null);
  const [activeTab, setActiveTab] = useState("leads");

  useEffect(() => {
    base44.entities.CreditPackage.filter({ is_active: true })
      .then(pkgs => setCredits(pkgs.reduce((s, p) => s + (p.credits_total - (p.credits_used || 0)), 0)))
      .catch(() => setCredits(0));
  }, []);

  const navItems = navByTab[activeTab] || [];

  return (
    <aside className="w-[220px] min-w-[220px] bg-white shadow-sidebar border-l border-border flex flex-col" style={{ fontFamily: "'Assistant', sans-serif" }}>
      {/* Logo */}
      <Link to="/" className="px-5 py-5 border-b border-border flex items-center gap-3 hover:bg-secondary/30 transition-colors">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-glow">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground">BrokerPro</h1>
          <p className="text-[11px] text-muted-foreground">ניהול לידים חכם</p>
        </div>
      </Link>

      {/* Main tabs (2×2 grid) */}
      <div className="px-3 pt-3 pb-2 border-b border-border">
        <div className="grid grid-cols-2 gap-1">
          {mainTabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`text-[11px] font-semibold py-1.5 px-1.5 rounded-lg transition-all text-center leading-tight ${
                activeTab === tab.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-gradient-to-l from-primary/10 to-purple-500/10 text-primary border border-primary/15 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}>
              <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-primary" : "group-hover:scale-110"}`} />
              <span>{item.label}</span>
              {isActive && <div className="mr-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 pb-2 space-y-1">
        {bottomNav.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}>
              <Icon className="w-[18px] h-[18px]" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <CampaignStatusWidget />

      {/* Credits Widget */}
      <div className="p-4 border-t border-border">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/8 via-purple-500/5 to-transparent rounded-2xl p-4 border border-primary/10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-muted-foreground">קרדיטים פנויים</span>
          </div>
          <p className="text-2xl font-bold text-primary mb-2">
            {credits !== null ? credits.toLocaleString() : "—"}
          </p>
          <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-l from-primary to-purple-400 rounded-full transition-all duration-700"
              style={{ width: credits !== null ? `${Math.min((credits / 5000) * 100, 100)}%` : "0%" }} />
          </div>
          <div className="absolute top-2 left-3 w-16 h-16 bg-primary/5 rounded-full blur-xl" />
        </div>
      </div>
    </aside>
  );
}