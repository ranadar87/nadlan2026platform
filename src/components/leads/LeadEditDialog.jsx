import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LeadEditDialog({ open, onClose, lead, onSave }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (lead) {
      setForm({
        full_name: lead.full_name || "",
        phone: lead.phone || "",
        city: lead.city || "",
        address: lead.address || "",
        deal_type: lead.deal_type || "",
        property_type: lead.property_type || "",
        price: lead.price || "",
        rooms: lead.rooms || "",
        area_sqm: lead.area_sqm || "",
        source: lead.source || "manual",
        status: lead.status || "new",
        notes: lead.notes || "",
      });
    }
  }, [lead]);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form };
    if (data.price) data.price = Number(data.price);
    if (data.rooms) data.rooms = Number(data.rooms);
    if (data.area_sqm) data.area_sqm = Number(data.area_sqm);
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{lead?.id ? "עריכת ליד" : "הוספת ליד חדש"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">שם מלא *</Label>
              <Input value={form.full_name || ""} onChange={e => update("full_name", e.target.value)} required className="bg-secondary border-border mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">טלפון *</Label>
              <Input value={form.phone || ""} onChange={e => update("phone", e.target.value)} required className="bg-secondary border-border mt-1" dir="ltr" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">עיר</Label>
              <Input value={form.city || ""} onChange={e => update("city", e.target.value)} className="bg-secondary border-border mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">כתובת</Label>
              <Input value={form.address || ""} onChange={e => update("address", e.target.value)} className="bg-secondary border-border mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">סוג עסקה</Label>
              <Select value={form.deal_type || ""} onValueChange={v => update("deal_type", v)}>
                <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="בחר" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="מכירה">מכירה</SelectItem>
                  <SelectItem value="השכרה">השכרה</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">מחיר (₪)</Label>
              <Input type="number" value={form.price || ""} onChange={e => update("price", e.target.value)} className="bg-secondary border-border mt-1" dir="ltr" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">חדרים</Label>
              <Input type="number" value={form.rooms || ""} onChange={e => update("rooms", e.target.value)} className="bg-secondary border-border mt-1" dir="ltr" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">שטח (מ"ר)</Label>
              <Input type="number" value={form.area_sqm || ""} onChange={e => update("area_sqm", e.target.value)} className="bg-secondary border-border mt-1" dir="ltr" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">סטטוס</Label>
            <Select value={form.status || "new"} onValueChange={v => update("status", v)}>
              <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="new">חדש</SelectItem>
                <SelectItem value="contacted">נוצר קשר</SelectItem>
                <SelectItem value="interested">מתעניין</SelectItem>
                <SelectItem value="not_interested">לא מתעניין</SelectItem>
                <SelectItem value="deal_closed">סגירת עסקה</SelectItem>
                <SelectItem value="archived">ארכיון</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">הערות</Label>
            <Textarea value={form.notes || ""} onChange={e => update("notes", e.target.value)} className="bg-secondary border-border mt-1" rows={3} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-border">ביטול</Button>
            <Button type="submit">שמור</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}