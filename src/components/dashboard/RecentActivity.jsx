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
        time: b.created_date,
        color: "bg-primary",
      }));
      campaigns.forEach(c => items.push({
        id: "c" + c.id,
        text: `קמפיין "${c.name}" — ${c.status === "running" ? "פעיל" : c.status === "completed" ? "הושלם" : c.status}`,
        time: c.created_date,
        color: c.status === "running" ? "bg-success" : "bg-accent",
      }));
      items.sort((a, b) => new Date(b.time) - new Date(a.time));
      setActivities(items.slice(0, 7));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">פעילות אחרונה</h3>
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-10 bg-secondary rounded-lg animate-pulse" />)}
        </div>
      ) : activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">אין פעילות עדיין</p>
      ) : (
        <div className="space-y-3">
          {activities.map((act) => (
            <div key={act.id} className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${act.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground/90 leading-relaxed">{act.text}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{moment(act.time).fromNow()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}