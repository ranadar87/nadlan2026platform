import { Link } from "react-router-dom";
import { Search, MessageSquare, Download, BarChart3 } from "lucide-react";

const actions = [
  { path: "/scrape", icon: Search, label: "שאב לידים", sub: "יד2 / מדלן", color: "text-primary bg-primary/8" },
  { path: "/campaigns/new", icon: MessageSquare, label: "קמפיין ווטסאפ", sub: "AI-Powered", color: "text-success bg-success/8" },
  { path: "/leads", icon: Download, label: "ייצוא לידים", sub: "Excel / PDF", color: "text-info bg-info/8" },
  { path: "/reports", icon: BarChart3, label: "דוחות קמפיין", sub: "סטטיסטיקות", color: "text-warning bg-warning/8" },
];

export default function QuickActions() {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-border p-5">
      <h3 className="text-[13px] font-semibold text-foreground mb-4">פעולות מהירות</h3>
      <div className="grid grid-cols-2 gap-2.5">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.path}
              to={action.path}
              className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/20 hover:shadow-card-hover bg-secondary/30 hover:bg-white transition-all duration-200 group"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${action.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-foreground">{action.label}</p>
                <p className="text-[10px] text-muted-foreground">{action.sub}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}