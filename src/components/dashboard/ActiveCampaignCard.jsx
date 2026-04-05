import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function ActiveCampaignCard() {
  const [campaign, setCampaign] = useState(null);

  useEffect(() => {
    base44.entities.Campaign.filter({ status: "running" }, "-created_date", 1)
      .then(res => { if (res.length > 0) setCampaign(res[0]); })
      .catch(() => {});
  }, []);

  if (!campaign) return (
    <div className="mt-4 p-4 bg-secondary/40 rounded-xl border border-border text-center">
      <p className="text-[12px] text-muted-foreground">אין קמפיין פעיל כרגע</p>
    </div>
  );

  const sent = campaign.sent_count || 0;
  const total = campaign.total_recipients || 1;
  const progress = Math.round((sent / total) * 100);

  return (
    <div className="mt-4 bg-gradient-to-l from-primary/5 to-success/5 rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[12px] font-semibold text-foreground truncate">קמפיין פעיל – {campaign.name}</p>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-medium">{progress}%</span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-2">
        {campaign.type === "whatsapp" ? "WhatsApp" : "SMS"} • נשלח {sent}/{total}
      </p>
      <div className="h-1.5 bg-white rounded-full overflow-hidden mb-3">
        <div className="h-full bg-gradient-to-l from-success to-primary rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex gap-5">
        {[
          { label: "המרה", count: campaign.converted_count },
          { label: "הגיבו", count: campaign.replied_count },
          { label: "נפתחו", count: campaign.opened_count },
        ].map(({ label, count }) => (
          <div key={label} className="text-center">
            <p className="text-[15px] font-bold text-foreground">
              {total > 1 ? `${Math.round(((count || 0) / total) * 100)}%` : "0%"}
            </p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}