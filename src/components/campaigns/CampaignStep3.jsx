import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function CampaignStep3({ campaign, update }) {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Lead.list("-created_date", 500).then(data => {
      setLeads(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = leads.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (l.full_name || "").toLowerCase().includes(q) ||
           (l.phone || "").includes(q) ||
           (l.city || "").toLowerCase().includes(q);
  });

  const selectedIds = campaign.target_lead_ids || [];
  const toggleLead = (id) => update("target_lead_ids",
    selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]
  );
  const toggleAll = () => update("target_lead_ids",
    selectedIds.length === filtered.length ? [] : filtered.map(l => l.id)
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-foreground mb-1">שלב 3 — בחירת קהל יעד</h3>
        <p className="text-xs text-muted-foreground">בחר את הלידים שיקבלו את ההודעה • {selectedIds.length} נבחרו</p>
      </div>
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="חיפוש לפי שם, טלפון, עיר..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9 bg-secondary border-border" />
      </div>
      <div className="border border-border rounded-lg max-h-80 overflow-y-auto">
        <div className="sticky top-0 bg-secondary p-3 border-b border-border flex items-center gap-3">
          <Checkbox checked={selectedIds.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
          <span className="text-xs font-medium text-foreground">בחר הכל ({filtered.length})</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">טוען לידים...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">לא נמצאו לידים</div>
        ) : (
          filtered.map(lead => (
            <label key={lead.id} className="flex items-center gap-3 p-3 hover:bg-secondary/50 cursor-pointer border-b border-border/30 last:border-0">
              <Checkbox checked={selectedIds.includes(lead.id)} onCheckedChange={() => toggleLead(lead.id)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium">{lead.full_name}</p>
                <p className="text-[10px] text-muted-foreground">{lead.phone} • {lead.city || "—"} • {lead.deal_type || "—"}</p>
              </div>
            </label>
          ))
        )}
      </div>
    </div>
  );
}