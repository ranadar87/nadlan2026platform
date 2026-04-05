import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const amenities = [
  { key: "require_parking", label: "חניה" },
  { key: "require_elevator", label: "מעלית" },
  { key: "require_balcony", label: "מרפסת" },
  { key: "require_secure_room", label: 'ממ"ד' },
  { key: "exclude_agents", label: "ללא מתווכים" },
];

export default function ScrapeForm({ params, onChange }) {
  const update = (key, value) => onChange({ ...params, [key]: value });

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">פרמטרי חיפוש</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs text-muted-foreground">עיר / אזור *</Label>
          <Input value={params.city || ""} onChange={e => update("city", e.target.value)} placeholder="תל אביב, רמת גן..." className="bg-secondary border-border mt-1" />
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
          <Label className="text-xs text-muted-foreground">כמות תוצאות</Label>
          <Input type="number" value={params.max_items || "150"} onChange={e => update("max_items", e.target.value)} className="bg-secondary border-border mt-1" dir="ltr" />
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
          <Input value={params.neighbourhood || ""} onChange={e => update("neighbourhood", e.target.value)} placeholder="נווה צדק..." className="bg-secondary border-border mt-1" />
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