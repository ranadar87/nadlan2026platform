import { useState } from "react";
import { Phone, Edit, Trash2, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import moment from "moment";
import "moment/locale/he";
moment.locale("he");

const STATUS_OPTIONS = [
  { value: "new", label: "חדש", color: "bg-primary/15 text-primary" },
  { value: "contacted", label: "נוצר קשר", color: "bg-info/15 text-info" },
  { value: "interested", label: "מתעניין", color: "bg-success/15 text-success" },
  { value: "not_interested", label: "לא מתעניין", color: "bg-destructive/15 text-destructive" },
  { value: "deal_closed", label: "סגירת עסקה", color: "bg-accent/15 text-accent" },
  { value: "archived", label: "ארכיון", color: "bg-muted text-muted-foreground" },
];

const sourceLabels = { yad2: "יד2", madlan: "מדלן", manual: "ידני" };

function StatusDropdown({ lead, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const conf = STATUS_OPTIONS.find(s => s.value === lead.status) || STATUS_OPTIONS[0];
  return (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(!open); }}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-transparent hover:border-current/30 transition-all ${conf.color}`}>
        {conf.label}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-xl shadow-card-hover z-50 overflow-hidden min-w-36">
            {STATUS_OPTIONS.map(opt => (
              <button key={opt.value}
                onClick={e => { e.stopPropagation(); onStatusChange(lead, opt.value); setOpen(false); }}
                className={`w-full text-right px-3 py-2 text-xs font-medium hover:bg-secondary/60 transition-colors flex items-center gap-2 ${opt.value === lead.status ? "bg-secondary" : ""}`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.value === "new" ? "bg-primary" : opt.value === "contacted" ? "bg-info" : opt.value === "interested" ? "bg-success" : opt.value === "not_interested" ? "bg-destructive" : opt.value === "deal_closed" ? "bg-accent" : "bg-muted-foreground"}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function LeadTable({ leads, selectedIds, onSelectChange, onEdit, onDelete, onStatusChange, onOpenDetail }) {
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
              <th className="p-3 text-right font-medium text-muted-foreground text-xs">לקוח / תיאור</th>
              <th className="p-3 text-right font-medium text-muted-foreground text-xs">טלפון</th>
              <th className="p-3 text-right font-medium text-muted-foreground text-xs">עיר</th>
              <th className="p-3 text-right font-medium text-muted-foreground text-xs">עסקה</th>
              <th className="p-3 text-right font-medium text-muted-foreground text-xs">מחיר</th>
              <th className="p-3 text-right font-medium text-muted-foreground text-xs">מקור</th>
              <th className="p-3 text-right font-medium text-muted-foreground text-xs">סטטוס</th>
              <th className="p-3 text-right font-medium text-muted-foreground text-xs">תאריך</th>
              <th className="p-3 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors group">
                <td className="p-3" onClick={e => e.stopPropagation()}>
                  <Checkbox checked={selectedIds.includes(lead.id)} onCheckedChange={() => toggleOne(lead.id)} />
                </td>
                {/* Name + short description - click to open detail */}
                <td className="p-3 cursor-pointer" onClick={() => onOpenDetail && onOpenDetail(lead)}>
                  <div className="flex items-center gap-3">
                    {/* Property thumbnail */}
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-purple-500/10 flex-shrink-0 flex items-center justify-center border border-border/40">
                      {lead.cover_image
                        ? <img src={lead.cover_image} alt="" className="w-full h-full object-cover" />
                        : <span className="text-primary/40 text-lg">🏠</span>}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground hover:text-primary transition-colors">{lead.full_name}</p>
                      {lead.description ? (
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[180px]">{lead.description}</p>
                      ) : lead.address ? (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{lead.address}</p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="p-3 text-foreground/80 font-mono text-xs" dir="ltr">{lead.phone}</td>
                <td className="p-3 text-foreground/80 text-xs">{lead.city || "—"}</td>
                <td className="p-3 text-foreground/80 text-xs">{lead.deal_type || "—"}</td>
                <td className="p-3 text-foreground/80 text-xs font-medium">{lead.price ? `₪${lead.price.toLocaleString()}` : "—"}</td>
                <td className="p-3 text-xs text-muted-foreground">{sourceLabels[lead.source] || lead.source}</td>
                <td className="p-3" onClick={e => e.stopPropagation()}>
                  <StatusDropdown lead={lead} onStatusChange={onStatusChange} />
                </td>
                <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{moment(lead.created_date).format("DD/MM/YY")}</td>
                <td className="p-3" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(lead)}>
                      <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(lead)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive/70 hover:text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}