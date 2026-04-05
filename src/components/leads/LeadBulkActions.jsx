import { Megaphone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LeadBulkActions({ count, onCampaign, onDelete }) {
  if (count === 0) return null;
  return (
    <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
      <span className="text-sm text-primary font-medium">{count} לידים נבחרו</span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" className="text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10" onClick={onCampaign}>
          <Megaphone className="w-3.5 h-3.5" />צור קמפיין
        </Button>
        <Button size="sm" variant="outline" className="text-xs gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={onDelete}>
          <Trash2 className="w-3.5 h-3.5" />מחיקה
        </Button>
      </div>
    </div>
  );
}