import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp } from "lucide-react";

export default function ActiveCampaignCard() {
  const [campaign, setCampaign] = useState(null);

  useEffect(() => {
    base44.entities.Campaign.filter({ status: "running" }, "-created_date", 1)
      .then(res => { if (res.length > 0) setCampaign(res[0]); })
      .catch(() => {});
  }, []);

  if (!campaign) {
    return (
      <div className="mt-4 p-5 bg-secondary/40 rounded-2xl border border-border text-center">
        <p className="text-sm text-muted-foreground">אין קמפיין פעיל כרגע</p>
      </div>
    );
  }

  const sent = campaign.sent_count || 0;
  const total = campaign.total_recipients || 1;
  const progress = Math.round((sent / total) * 100);

  const stats = [
    { label: "המרה", count: campaign.converted_count || 0 },
    { label: "הגיבו", count: campaign.replied_count || 0 },
    { label: "נפתחו", count: campaign.opened_count || 0 },
  ];

  return (
    <div className="mt-4 relative overflow-hidden bg-gradient-to-br from-primary/8 via-purple-500/5 to-success/5 rounded-2xl border border-primary/12 p-5">
      <div className="absolute top-3 left-4 w-20 h-20 bg-primary/5 rounded-full blur-2xl" />

      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">קמפיין פעיל</p>
          <p className="text-sm font-bold text-foreground truncate max-w-[180px]">{campaign.name}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-success/10 text-success text-xs font-bold px-2.5 py-1 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-soft" />
          {progress}%
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {campaign.type === "whatsapp" ? "WhatsApp" : "SMS"} • {sent} / {total} הודעות
      </p>

      {/* Progress bar */}
      <div className="h-2.5 bg-white/60 rounded-full overflow-hidden mb-4 shadow-inner">
        <div
          className="h-full bg-gradient-to-l from-primary via-purple-400 to-success rounded-full transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        {stats.map(({ label, count }) => (
          <div key={label} className="flex-1 text-center bg-white/50 rounded-xl py-2">
            <p className="text-lg font-bold text-foreground">
              {total > 1 ? `${Math.round((count / total) * 100)}%` : "0%"}
            </p>
            <p className="text-[11px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}