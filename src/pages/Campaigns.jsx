import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Megaphone, Pause, Play, Square, Trash2, FileText, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";

const statusLabels = { draft: "טיוטה", scheduled: "מתוזמן", running: "פעיל", paused: "מושהה", completed: "הושלם", stopped: "הופסק" };
const statusColors = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-info/15 text-info",
  running: "bg-success/15 text-success",
  paused: "bg-warning/15 text-warning",
  completed: "bg-primary/15 text-primary",
  stopped: "bg-destructive/15 text-destructive",
};

export default function Campaigns() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const loadCampaigns = async () => {
    const data = await base44.entities.Campaign.list("-created_date", 100);
    setCampaigns(data);
    setLoading(false);
  };

  useEffect(() => { loadCampaigns(); }, []);

  const handleTogglePause = async (campaign) => {
    const newStatus = campaign.status === "paused" ? "running" : "paused";
    await base44.entities.Campaign.update(campaign.id, { status: newStatus });
    toast({ title: newStatus === "paused" ? "הקמפיין הושהה" : "הקמפיין חודש" });
    loadCampaigns();
  };

  const handleStop = async (campaign) => {
    await base44.entities.Campaign.update(campaign.id, { status: "stopped" });
    toast({ title: "הקמפיין הופסק" });
    loadCampaigns();
  };

  const handleDelete = async (campaign) => {
    if (!window.confirm(`למחוק את הקמפיין "${campaign.name}"?`)) return;
    setDeletingId(campaign.id);
    await base44.entities.Campaign.delete(campaign.id);
    toast({ title: "הקמפיין נמחק" });
    setDeletingId(null);
    loadCampaigns();
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">קמפיינים</h2>
        <Link to="/campaigns/new">
          <Button size="sm" className="gap-2 text-xs"><Plus className="w-3.5 h-3.5" />קמפיין חדש</Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 bg-card border border-border rounded-xl animate-pulse" />)}</div>
      ) : campaigns.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-foreground font-medium">אין קמפיינים עדיין</p>
          <p className="text-xs text-muted-foreground mt-1">צור את הקמפיין הראשון שלך</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const progress = campaign.total_recipients
              ? Math.round(((campaign.sent_count || 0) / campaign.total_recipients) * 100) : 0;
            return (
              <div key={campaign.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground">{campaign.name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[campaign.status]}`}>
                        {statusLabels[campaign.status]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {campaign.type === "whatsapp" ? "WhatsApp" : "SMS"} • {campaign.total_recipients || 0} נמענים • {moment(campaign.created_date).format("DD/MM/YY")}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="לוג" onClick={() => navigate(`/campaigns/log?id=${campaign.id}`)}
                    >
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    {(campaign.status === "running" || campaign.status === "paused") && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleTogglePause(campaign)}>
                          {campaign.status === "paused" ? <Play className="w-4 h-4 text-success" /> : <Pause className="w-4 h-4 text-warning" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStop(campaign)}>
                          <Square className="w-4 h-4 text-destructive" />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={deletingId === campaign.id} onClick={() => handleDelete(campaign)}>
                      <Trash2 className="w-4 h-4 text-destructive/70 hover:text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <Progress value={progress} className="h-1.5 flex-1 bg-secondary" />
                  <span className="text-xs font-medium text-foreground w-10 text-left">{progress}%</span>
                </div>
                <div className="flex gap-6 text-xs text-muted-foreground">
                  <span>נשלחו: <strong className="text-foreground">{campaign.sent_count || 0}</strong></span>
                  <span>נפתחו: <strong className="text-foreground">{campaign.opened_count || 0}</strong></span>
                  <span>הגיבו: <strong className="text-foreground">{campaign.replied_count || 0}</strong></span>
                  <span>נכשלו: <strong className="text-destructive">{campaign.failed_count || 0}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}