import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import moment from "moment";

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
        color: "bg-primary",
      }));
      campaigns.forEach(c => items.push({
        id: "c" + c.id,
        text: `קמפיין ${c.name}`,
        sub: c.status === "running" ? "פעיל" : c.status === "completed" ? "הושלם" : c.status,
        time: c.created_date,
        color: c.status === "running" ? "bg-success" : c.status === "completed" ? "bg-info" : "bg-warning",
      }));
      items.sort((a, b) => new Date(b.time) - new Date(a.time));
      setActivities(items.slice(0, 7));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-card border border-border p-5 flex flex-col">
      <h3 className="text-[13px] font-semibold text-foreground mb-4">פעילות אחרונה</h3>
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-9 bg-secondary rounded-lg animate-pulse" />)}
        </div>
      ) : activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">אין פעילות עדיין</p>
      ) : (
        <div className="space-y-1">
          {activities.map((act) => (
            <div key={act.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-secondary/50 transition-colors">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${act.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-foreground font-medium truncate">{act.text}</p>
              </div>
              <p className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                {moment(act.time).fromNow()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}