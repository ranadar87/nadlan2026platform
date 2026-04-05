import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Progress } from "@/components/ui/progress";

export default function ActiveCampaignCard() {
  const [campaign, setCampaign] = useState(null);

  useEffect(() => {
    base44.entities.Campaign.filter({ status: "running" }, "-created_date", 1)
      .then(res => { if (res.length > 0) setCampaign(res[0]); })
      .catch(() => {});
  }, []);

  if (!campaign) {
    return (
      <div className="mt-5 pt-5 border-t border-border">
        <p className="text-xs text-muted-foreground text-center py-4">אין קמפיין פעיל כרגע</p>
      </div>
    );
  }

  const progress = campaign.total_recipients
    ? Math.round(((campaign.sent_count || 0) / campaign.total_recipients) * 100)
    : 0;

  return (
    <div className="mt-5 pt-5 border-t border-border">
      <h4 className="text-sm font-semibold text-foreground mb-3">קמפיין פעיל — {campaign.name}</h4>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">
          {campaign.type === "whatsapp" ? "WhatsApp" : "SMS"} • נשלח {campaign.sent_count || 0}/{campaign.total_recipients || 0}
        </span>
        <span className="text-xs font-semibold text-success">{progress}%</span>
      </div>
      <Progress value={progress} className="h-1.5 bg-secondary" />
      <div className="flex gap-6 mt-3">
        {[
          { label: "נפתחו", count: campaign.opened_count },
          { label: "הגיבו", count: campaign.replied_count },
          { label: "המרה", count: campaign.converted_count },
        ].map(({ label, count }) => (
          <div key={label} className="text-center">
            <p className="text-base font-bold text-foreground">
              {campaign.total_recipients ? Math.round(((count || 0) / campaign.total_recipients) * 100) : 0}%
            </p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}