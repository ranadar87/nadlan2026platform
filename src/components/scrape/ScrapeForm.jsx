import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";

const amenities = [
  { key: "require_parking", label: "חניה" },
  { key: "require_elevator", label: "מעלית" },
  { key: "require_balcony", label: "מרפסת" },
  { key: "require_secure_room", label: 'ממ"ד' },
  { key: "exclude_agents", label: "ללא מתווכים" },
];

function AutocompleteInput({ value, onChange, suggestions, placeholder, className, dir }) {
  const [open, setOpen] = useState(false);
  const filtered = value
    ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s !== value)
    : [];

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className={className}
        dir={dir}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 right-0 left-0 top-full mt-1 bg-white border border-border rounded-xl shadow-card-hover overflow-hidden max-h-48 overflow-y-auto">
          {filtered.slice(0, 8).map(s => (
            <button
              key={s}
              type="button"
              className="w-full text-right px-3 py-2 text-sm hover:bg-secondary transition-colors"
              onMouseDown={() => { onChange(s); setOpen(false); }}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScrapeForm({ params, onChange }) {
  const update = (key, value) => onChange({ ...params, [key]: value });
  const [cities, setCities] = useState([]);
  const [neighbourhoods, setNeighbourhoods] = useState([]);

  useEffect(() => {
    base44.entities.Lead.list("-created_date", 500).then(leads => {
      setCities([...new Set(leads.map(l => l.city).filter(Boolean))].sort());
      setNeighbourhoods([...new Set(leads.map(l => l.neighbourhood).filter(Boolean))].sort());
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">פרמטרי חיפוש</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs text-muted-foreground">עיר / אזור *</Label>
          <div className="mt-1">
            <AutocompleteInput
              value={params.city || ""}
              onChange={v => update("city", v)}
              suggestions={cities}
              placeholder="תל אביב, רמת גן..."
              className="bg-secondary border-border"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">סוג עסקה</Label>
          <Select value={params.deal_type || "buy"} onValueChange={v => update("deal_type", v)}>
            <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="buy">מכירה</SelectItem>
              <SelectItem value="rent">השכרה</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Label className="text-xs text-muted-foreground">כמות קרדיטים לשימוש</Label>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                  כל ליד חדש שנשמר מנכה קרדיט אחד מהחשבון שלך. המספר כאן הוא המקסימום שתשאב, אך הניכוי בפועל יהיה לפי מספר הלידים החדשים שנמצאו (ללא כפילוים).
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input type="number" value={params.max_items || "150"} onChange={e => update("max_items", e.target.value)} className="bg-secondary border-border" dir="ltr" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">מחיר מינימום (₪)</Label>
          <Input type="number" value={params.min_price || ""} onChange={e => update("min_price", e.target.value)} placeholder="1,000,000" className="bg-secondary border-border mt-1" dir="ltr" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">מחיר מקסימום (₪)</Label>
          <Input type="number" value={params.max_price || ""} onChange={e => update("max_price", e.target.value)} placeholder="5,000,000" className="bg-secondary border-border mt-1" dir="ltr" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">שכונה ספציפית</Label>
          <div className="mt-1">
            <AutocompleteInput
              value={params.neighbourhood || ""}
              onChange={v => update("neighbourhood", v)}
              suggestions={neighbourhoods}
              placeholder="נווה צדק..."
              className="bg-secondary border-border"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">חדרים מינימום</Label>
          <Input type="number" value={params.min_rooms || ""} onChange={e => update("min_rooms", e.target.value)} placeholder="2" className="bg-secondary border-border mt-1" dir="ltr" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">חדרים מקסימום</Label>
          <Input type="number" value={params.max_rooms || ""} onChange={e => update("max_rooms", e.target.value)} placeholder="5" className="bg-secondary border-border mt-1" dir="ltr" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">מ"ר מינימום</Label>
          <Input type="number" value={params.min_area || ""} onChange={e => update("min_area", e.target.value)} placeholder="60" className="bg-secondary border-border mt-1" dir="ltr" />
        </div>
      </div>
      <div className="flex flex-wrap gap-5 pt-2">
        {amenities.map(item => (
          <label key={item.key} className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={!!params[item.key]} onCheckedChange={v => update(item.key, v)} />
            <span className="text-sm text-foreground">{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}