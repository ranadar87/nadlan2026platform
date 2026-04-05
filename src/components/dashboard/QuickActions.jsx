import { Link } from "react-router-dom";
import { Search, MessageSquare, Download, BarChart3 } from "lucide-react";

const actions = [
  { path: "/scrape", icon: Search, label: "שאב לידים", sub: "יד2 / מדלן" },
  { path: "/campaigns/new", icon: MessageSquare, label: "קמפיין ווטסאפ", sub: "AI-Powered" },
  { path: "/leads", icon: Download, label: "ייצוא לידים", sub: "Excel / PDF" },
  { path: "/reports", icon: BarChart3, label: "דוחות קמפיין", sub: "סטטיסטיקות" },
];

export default function QuickActions() {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">פעולות מהירות</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.path}
              to={action.path}
              className="flex items-center gap-3 p-3.5 rounded-lg bg-secondary border border-border/50 hover:border-primary/30 hover:bg-secondary/80 transition-all duration-200 group"
            >
              <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <div>
                <p className="text-sm font-semibold text-foreground">{action.label}</p>
                <p className="text-[10px] text-muted-foreground">{action.sub}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}