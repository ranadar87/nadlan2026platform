import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search, Database, Users, Filter } from "lucide-react";
import moment from "moment";

export default function CampaignStep3({ campaign, update }) {
  const [mode, setMode] = useState("batch"); // "batch" | "manual"
  const [batches, setBatches] = useState([]);
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState(campaign.target_batch_id || null);
  const [batchLeads, setBatchLeads] = useState([]);
  const [loadingBatch, setLoadingBatch] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.ScrapeBatch.list("-created_date", 50),
      base44.entities.Lead.list("-created_date", 500),
    ]).then(([b, l]) => {
      setBatches(b);
      setLeads(l);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const selectBatch = async (batch) => {
    setSelectedBatch(batch.id);
    update("target_batch_id", batch.id);
    setLoadingBatch(true);
    const bLeads = leads.filter(l => l.scrape_batch_id === batch.id);
    setBatchLeads(bLeads);
    update("target_lead_ids", bLeads.map(l => l.id));
    setLoadingBatch(false);
  };

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
        <p className="text-xs text-muted-foreground">בחר את הלידים שיקבלו את ההודעה • <strong className="text-primary">{selectedIds.length}</strong> נבחרו</p>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { id: "batch", icon: Database, label: "מקמפיין שאיבה", sub: "בחר לפי אצוות שנשלפו" },
          { id: "manual", icon: Users, label: "בחירה ידנית", sub: "בחר לידים בעצמך" },
        ].map(m => {
          const Icon = m.icon;
          return (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-right ${mode === m.id ? "border-primary bg-primary/5" : "border-border bg-secondary hover:border-border/60"}`}>
              <Icon className={`w-5 h-5 flex-shrink-0 ${mode === m.id ? "text-primary" : "text-muted-foreground"}`} />
              <div>
                <p className="text-sm font-semibold text-foreground">{m.label}</p>
                <p className="text-[10px] text-muted-foreground">{m.sub}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Batch mode */}
      {mode === "batch" && (
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />)}</div>
          ) : batches.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl">
              אין אצוות שאיבה עדיין — לך לעמוד שאיבת לידים תחילה
            </div>
          ) : (
            batches.map(batch => {
              const batchCount = leads.filter(l => l.scrape_batch_id === batch.id).length;
              const isSelected = selectedBatch === batch.id;
              const params = batch.search_params || {};
              return (
                <button key={batch.id} onClick={() => selectBatch(batch)}
                  className={`w-full text-right p-4 rounded-xl border-2 transition-all ${isSelected ? "border-primary bg-primary/5" : "border-border bg-white hover:border-primary/30 hover:bg-secondary/50"}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${batch.source === "yad2" ? "bg-primary/10 text-primary" : "bg-info/10 text-info"}`}>
                          {batch.source === "yad2" ? "יד2" : "מדלן"}
                        </span>
                        <span className="text-xs text-muted-foreground">{moment(batch.created_date).format("DD/MM/YY HH:mm")}</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {params.city || "לא ידוע"} • {params.deal_type === "rent" ? "השכרה" : "מכירה"}
                        {params.min_rooms && ` • ${params.min_rooms}+ חדרים`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {batch.new_leads || 0} לידים חדשים • {batch.total_results || 0} סה"כ תוצאות
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold text-primary">{batchCount}</p>
                      <p className="text-[10px] text-muted-foreground">לידים</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="mt-2 pt-2 border-t border-primary/20 flex items-center gap-2 text-xs text-primary font-medium">
                      <Filter className="w-3 h-3" />
                      {loadingBatch ? "טוען לידים..." : `${batchCount} לידים נבחרו מאצוות זו`}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Manual mode */}
      {mode === "manual" && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="חיפוש לפי שם, טלפון, עיר..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9 bg-secondary border-border" />
          </div>
          <div className="border border-border rounded-xl max-h-72 overflow-y-auto">
            <div className="sticky top-0 bg-secondary/95 backdrop-blur px-4 py-2.5 border-b border-border flex items-center gap-3">
              <Checkbox checked={selectedIds.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
              <span className="text-xs font-medium text-foreground">בחר הכל ({filtered.length})</span>
              {selectedIds.length > 0 && (
                <span className="text-xs text-primary font-semibold mr-auto">{selectedIds.length} נבחרו</span>
              )}
            </div>
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">טוען לידים...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">לא נמצאו לידים</div>
            ) : (
              filtered.map(lead => (
                <label key={lead.id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 cursor-pointer border-b border-border/30 last:border-0">
                  <Checkbox checked={selectedIds.includes(lead.id)} onCheckedChange={() => toggleLead(lead.id)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium">{lead.full_name}</p>
                    <p className="text-[10px] text-muted-foreground">{lead.phone} • {lead.city || "—"} • {lead.source}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${lead.status === "new" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                    {lead.status === "new" ? "חדש" : lead.status === "contacted" ? "נפנה" : lead.status}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}