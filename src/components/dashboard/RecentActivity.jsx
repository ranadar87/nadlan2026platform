import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import moment from "moment";
import "moment/locale/he";

moment.locale("he");

const dotConfig = {
  yad2: "bg-primary",
  madlan: "bg-info",
  running: "bg-success",
  completed: "bg-primary",
  default: "bg-warning",
};

export default function RecentActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.ScrapeBatch.list("-created_date", 4),
      base44.entities.Campaign.list("-created_date", 4),
    ]).then(([batches, campaigns]) => {
      const items = [];
      batches.forEach(b => items.push({
        id: "b" + b.id,
        text: `נשאבו ${b.new_leads || 0} לידים חדשים מ${b.source === "yad2" ? "יד2" : "מדלן"}`,
        sub: b.search_params?.city || "",
        time: b.created_date,
        dot: dotConfig[b.source] || dotConfig.default,
      }));
      campaigns.forEach(c => items.push({
        id: "c" + c.id,
        text: `קמפיין "${c.name}"`,
        sub: c.status === "running" ? "פעיל" : c.status === "completed" ? "הושלם" : c.status,
        time: c.created_date,
        dot: dotConfig[c.status] || dotConfig.default,
      }));
      items.sort((a, b) => new Date(b.time) - new Date(a.time));
      setActivities(items.slice(0, 7));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-border shadow-card p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-foreground">פעילות אחרונה</h3>
        <span className="text-xs text-muted-foreground">{activities.length} פעולות</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-muted animate-pulse" />
              <div className="h-4 bg-muted rounded-lg flex-1 animate-pulse" />
              <div className="h-3 bg-muted rounded w-16 animate-pulse" />
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">אין פעילות עדיין</p>
        </div>
      ) : (
        <div className="space-y-1">
          {activities.map((act, i) => (
            <div
              key={act.id}
              className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-secondary/60 transition-colors cursor-default group"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${act.dot} group-hover:scale-125 transition-transform`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium truncate">{act.text}</p>
                {act.sub && <p className="text-xs text-muted-foreground">{act.sub}</p>}
              </div>
              <p className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                {moment(act.time).fromNow()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}