import { Link } from "react-router-dom";
import { Search, MessageSquare, Download, BarChart3, ArrowLeft } from "lucide-react";

const actions = [
  {
    path: "/scrape",
    icon: Search,
    label: "שאב לידים",
    sub: "יד2 / מדלן",
    gradient: "from-primary/15 to-purple-500/10",
    iconBg: "bg-primary/10 text-primary",
    border: "hover:border-primary/25",
  },
  {
    path: "/campaigns/new",
    icon: MessageSquare,
    label: "קמפיין ווטסאפ",
    sub: "AI-Powered",
    gradient: "from-success/15 to-emerald-400/10",
    iconBg: "bg-success/10 text-success",
    border: "hover:border-success/25",
  },
  {
    path: "/leads",
    icon: Download,
    label: "ייצוא לידים",
    sub: "Excel / PDF",
    gradient: "from-info/15 to-sky-400/10",
    iconBg: "bg-info/10 text-info",
    border: "hover:border-info/25",
  },
  {
    path: "/reports",
    icon: BarChart3,
    label: "דוחות קמפיין",
    sub: "סטטיסטיקות",
    gradient: "from-warning/15 to-amber-400/10",
    iconBg: "bg-warning/10 text-warning",
    border: "hover:border-warning/25",
  },
];

export default function QuickActions() {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-foreground">פעולות מהירות</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.path}
              to={action.path}
              className={`relative overflow-hidden flex items-center gap-3 p-4 rounded-xl border border-border ${action.border} bg-gradient-to-bl ${action.gradient} hover:shadow-card-hover transition-all duration-250 group`}
            >
              <div className={`w-9 h-9 rounded-xl ${action.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.sub}</p>
              </div>
              <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground mr-auto opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}