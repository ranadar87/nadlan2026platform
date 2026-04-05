import { MoreHorizontal, Phone, MessageSquare, Edit, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import LeadStatusBadge from "./LeadStatusBadge";
import moment from "moment";

const sourceLabels = { yad2: "יד2", madlan: "מדלן", manual: "ידני" };

export default function LeadTable({ leads, selectedIds, onSelectChange, onEdit, onDelete, onStatusChange }) {
  const allSelected = leads.length > 0 && selectedIds.length === leads.length;

  const toggleAll = () => onSelectChange(allSelected ? [] : leads.map(l => l.id));
  const toggleOne = (id) => onSelectChange(
    selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]
  );

  if (leads.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <p className="text-muted-foreground text-sm">אין לידים להצגה</p>
        <p className="text-muted-foreground text-xs mt-1">נסה לשנות את הפילטרים או לשאוב לידים חדשים</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="p-3 text-right w-10"><Checkbox checked={allSelected} onCheckedChange={toggleAll} /></th>
              <th className="p-3 text-right font-medium text-muted-foreground text-xs">שם</th>
              <th className="p-3 text-right font-medium text-muted-foreground text-xs">טלפון</th>
              <th className="p-3 text-right font-medium text-muted-foreground text-xs">עיר</th>
              <th className="p-3 text-right font-medium text-muted-foreground text-xs">עסקה</th>
              <th className="p-3 text-right font-medium text-muted-foreground text-xs">מחיר</th>
              <th className="p-3 text-right font-medium text-muted-foreground text-xs">מקור</th>
              <th className="p-3 text-right font-medium text-muted-foreground text-xs">סטטוס</th>
              <th className="p-3 text-right font-medium text-muted-foreground text-xs">תאריך</th>
              <th className="p-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="p-3"><Checkbox checked={selectedIds.includes(lead.id)} onCheckedChange={() => toggleOne(lead.id)} /></td>
                <td className="p-3">
                  <p className="font-medium text-foreground">{lead.full_name}</p>
                  {lead.address && <p className="text-[10px] text-muted-foreground mt-0.5">{lead.address}</p>}
                </td>
                <td className="p-3 text-foreground/80 font-mono text-xs" dir="ltr">{lead.phone}</td>
                <td className="p-3 text-foreground/80">{lead.city || "—"}</td>
                <td className="p-3 text-foreground/80">{lead.deal_type || "—"}</td>
                <td className="p-3 text-foreground/80">{lead.price ? `₪${lead.price.toLocaleString()}` : "—"}</td>
                <td className="p-3 text-xs text-muted-foreground">{sourceLabels[lead.source] || lead.source}</td>
                <td className="p-3"><LeadStatusBadge status={lead.status} /></td>
                <td className="p-3 text-xs text-muted-foreground">{moment(lead.created_date).format("DD/MM/YY")}</td>
                <td className="p-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => onEdit(lead)}><Edit className="w-4 h-4 ml-2" />עריכה</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusChange(lead, "contacted")}><Phone className="w-4 h-4 ml-2" />נוצר קשר</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusChange(lead, "interested")}><MessageSquare className="w-4 h-4 ml-2" />מתעניין</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(lead)} className="text-destructive"><Trash2 className="w-4 h-4 ml-2" />מחיקה</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}