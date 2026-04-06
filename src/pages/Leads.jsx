import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import LeadFilters from "../components/leads/LeadFilters";
import LeadTable from "../components/leads/LeadTable";
import LeadBulkActions from "../components/leads/LeadBulkActions";
import LeadEditDialog from "../components/leads/LeadEditDialog";
import LeadDetailModal from "../components/leads/LeadDetailModal";

export default function Leads() {
  const { toast } = useToast();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [editLead, setEditLead] = useState(null);
  const [detailLead, setDetailLead] = useState(null);

  const loadLeads = async () => {
    setLoading(true);
    const data = await base44.entities.Lead.list("-created_date", 500);
    setLeads(data);
    setLoading(false);
  };

  useEffect(() => { loadLeads(); }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match = (lead.full_name || "").toLowerCase().includes(q) ||
          (lead.phone || "").includes(q) ||
          (lead.address || "").toLowerCase().includes(q) ||
          (lead.city || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filters.city && lead.city !== filters.city) return false;
      if (filters.deal_type && lead.deal_type !== filters.deal_type) return false;
      if (filters.source && lead.source !== filters.source) return false;
      if (filters.status && lead.status !== filters.status) return false;
      return true;
    });
  }, [leads, filters]);

  const handleDelete = async (lead) => {
    await base44.entities.Lead.delete(lead.id);
    toast({ title: "הליד נמחק" });
    loadLeads();
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) await base44.entities.Lead.delete(id);
    toast({ title: `${selectedIds.length} לידים נמחקו` });
    setSelectedIds([]);
    loadLeads();
  };

  const handleStatusChange = async (lead, status) => {
    await base44.entities.Lead.update(lead.id, { status });
    toast({ title: "הסטטוס עודכן" });
    loadLeads();
  };

  const handleSaveLead = async (data) => {
    const id = data.id || editLead?.id;
    if (id) {
      await base44.entities.Lead.update(id, data);
      toast({ title: "הליד עודכן" });
    } else {
      await base44.entities.Lead.create(data);
      toast({ title: "ליד חדש נוצר" });
    }
    setEditLead(null);
    loadLeads();
  };

  return (
    <div className="space-y-4 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">ניהול לידים</h2>
          <p className="text-xs text-muted-foreground">{loading ? "טוען..." : `${filteredLeads.length} לידים`}</p>
        </div>
        <Button size="sm" className="gap-2 text-xs" onClick={() => setEditLead({})}>
          <Plus className="w-3.5 h-3.5" />הוסף ליד ידני
        </Button>
      </div>
      <LeadFilters filters={filters} onChange={setFilters} onClear={() => setFilters({})} />
      <LeadBulkActions count={selectedIds.length} onDelete={handleBulkDelete} onCampaign={() => {}} />
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-card border border-border rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <LeadTable leads={filteredLeads} selectedIds={selectedIds} onSelectChange={setSelectedIds} onEdit={setEditLead} onDelete={handleDelete} onStatusChange={handleStatusChange} onOpenDetail={setDetailLead} />
      )}
      <LeadEditDialog open={!!editLead} onClose={() => setEditLead(null)} lead={editLead} onSave={handleSaveLead} />
      <LeadDetailModal
        lead={detailLead}
        open={!!detailLead}
        onClose={() => setDetailLead(null)}
        onStatusChange={async (lead, status) => { await handleStatusChange(lead, status); setDetailLead(prev => prev ? { ...prev, status } : null); }}
        onSave={async (data) => { await handleSaveLead(data); setDetailLead(prev => prev ? { ...prev, ...data } : null); }}
      />
    </div>
  );
}