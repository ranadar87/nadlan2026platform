import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LeadFilters({ filters, onChange, onClear }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });
  const hasFilters = filters.search || filters.city || filters.deal_type || filters.source || filters.status;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">סינון</span>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={onClear}>
            <X className="w-3 h-3 ml-1" />נקה הכל
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="lg:col-span-2 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="חיפוש שם, טלפון, כתובת..." value={filters.search || ""} onChange={e => update("search", e.target.value)} className="pr-9 bg-secondary border-border text-sm" />
        </div>
        <Select value={filters.city || "all"} onValueChange={v => update("city", v === "all" ? "" : v)}>
          <SelectTrigger className="bg-secondary border-border text-sm"><SelectValue placeholder="עיר" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הערים</SelectItem>
            {["תל אביב", "ירושלים", "חיפה", "רמת גן", "הרצליה", "רעננה", "פתח תקווה", "ראשון לציון"].map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.deal_type || "all"} onValueChange={v => update("deal_type", v === "all" ? "" : v)}>
          <SelectTrigger className="bg-secondary border-border text-sm"><SelectValue placeholder="סוג עסקה" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">הכל</SelectItem>
            <SelectItem value="מכירה">מכירה</SelectItem>
            <SelectItem value="השכרה">השכרה</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.source || "all"} onValueChange={v => update("source", v === "all" ? "" : v)}>
          <SelectTrigger className="bg-secondary border-border text-sm"><SelectValue placeholder="מקור" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל המקורות</SelectItem>
            <SelectItem value="yad2">יד2</SelectItem>
            <SelectItem value="madlan">מדלן</SelectItem>
            <SelectItem value="manual">ידני</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.status || "all"} onValueChange={v => update("status", v === "all" ? "" : v)}>
          <SelectTrigger className="bg-secondary border-border text-sm"><SelectValue placeholder="סטטוס" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="new">חדש</SelectItem>
            <SelectItem value="contacted">נוצר קשר</SelectItem>
            <SelectItem value="interested">מתעניין</SelectItem>
            <SelectItem value="not_interested">לא מתעניין</SelectItem>
            <SelectItem value="deal_closed">סגירת עסקה</SelectItem>
            <SelectItem value="archived">ארכיון</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}