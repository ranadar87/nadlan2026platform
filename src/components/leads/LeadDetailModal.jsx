import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Phone, MapPin, Home, Tag, MessageSquare, ExternalLink,
  X, Edit, Save, Clock, CheckCircle, XCircle, Send, Eye, Building2,
  Layers, DollarSign, Maximize2
} from "lucide-react";
import LeadTasksTab from "./LeadTasksTab";
import moment from "moment";
import "moment/locale/he";
moment.locale("he");

const STATUS_OPTIONS = [
  { value: "new", label: "חדש", color: "bg-primary/15 text-primary border-primary/30" },
  { value: "contacted", label: "נוצר קשר", color: "bg-info/15 text-info border-info/30" },
  { value: "interested", label: "מתעניין", color: "bg-success/15 text-success border-success/30" },
  { value: "not_interested", label: "לא מתעניין", color: "bg-destructive/15 text-destructive border-destructive/30" },
  { value: "deal_closed", label: "סגירת עסקה", color: "bg-accent/15 text-accent border-accent/30" },
  { value: "archived", label: "ארכיון", color: "bg-muted text-muted-foreground border-border" },
];

const msgStatusMap = {
  pending: { label: "ממתין", icon: Clock, color: "text-muted-foreground" },
  sent: { label: "נשלח", icon: Send, color: "text-info" },
  delivered: { label: "נמסר", icon: CheckCircle, color: "text-success" },
  opened: { label: "נפתח", icon: Eye, color: "text-primary" },
  replied: { label: "הגיב", icon: MessageSquare, color: "text-accent" },
  failed: { label: "נכשל", icon: XCircle, color: "text-destructive" },
};

export default function LeadDetailModal({ lead, open, onClose, onStatusChange, onSave }) {
  const [activeTab, setActiveTab] = useState("property");
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  useEffect(() => {
    if (!lead || !open) return;
    setNotes(lead.notes || "");
    setEditing(false);
    setActiveTab("property");
    setLoadingMsgs(true);
    base44.entities.CampaignMessage.filter({ lead_id: lead.id }, "-created_date", 50)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setLoadingMsgs(false));
  }, [lead, open]);

  if (!lead) return null;

  const statusConf = STATUS_OPTIONS.find(s => s.value === lead.status) || STATUS_OPTIONS[0];

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await onSave({ ...lead, notes });
    setSavingNotes(false);
    setEditing(false);
  };

  const amenities = [
    { key: "has_parking", label: "חניה" },
    { key: "has_elevator", label: "מעלית" },
    { key: "has_balcony", label: "מרפסת" },
    { key: "has_secure_room", label: 'מ"מד' },
  ].filter(a => lead[a.key]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-background border-border rounded-2xl [&>button:first-of-type]:hidden" style={{ maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center gap-4 px-6 pt-5 pb-4 border-b border-border relative">
          {/* Avatar / property image */}
          <div className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden border-2 border-border shadow bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
            {lead.cover_image
              ? <img src={lead.cover_image} alt="נכס" className="w-full h-full object-cover" />
              : <Building2 className="w-6 h-6 text-primary/50" />}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground">{lead.full_name}</h2>
            <div className="flex items-center gap-3 flex-wrap mt-0.5">
              <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-sm text-primary font-mono hover:underline" dir="ltr">
                <Phone className="w-3.5 h-3.5" />{lead.phone}
              </a>
              {lead.city && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />{lead.city}{lead.neighbourhood ? ` • ${lead.neighbourhood}` : ""}
                </span>
              )}
            </div>
            {/* Status */}
            <div className="relative mt-1.5 inline-block">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all hover:opacity-80 ${statusConf.color}`}>
                {statusConf.label}
                <span className="text-[10px] opacity-60">▼</span>
              </button>
              {showStatusMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowStatusMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-card-hover z-50 overflow-hidden min-w-36">
                    {STATUS_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => { onStatusChange(lead, opt.value); setShowStatusMenu(false); }}
                        className={`w-full text-right px-4 py-2 text-xs font-medium hover:bg-secondary transition-colors flex items-center gap-2 ${opt.value === lead.status ? "bg-secondary/70" : ""}`}>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.color.includes("primary") ? "bg-primary" : opt.color.includes("info") ? "bg-info" : opt.color.includes("success") ? "bg-success" : opt.color.includes("destructive") ? "bg-destructive" : opt.color.includes("accent") ? "bg-accent" : "bg-muted-foreground"}`} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {lead.source_url && (
              <a href={lead.source_url} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center hover:bg-border transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button onClick={onClose}
              className="w-8 h-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center hover:bg-border transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6">
          {[
            { id: "property", label: "פרטי הנכס" },
            { id: "tasks", label: "משימות" },
            { id: "notes", label: "הערות" },
            { id: "history", label: `היסטוריה (${messages.length})` },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 200px)" }}>

          {/* TAB: Tasks */}
          {activeTab === "tasks" && <LeadTasksTab leadId={lead.id} />}

          {/* TAB: Property */}
          {activeTab === "property" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: DollarSign, label: "מחיר", value: lead.price ? `₪${lead.price.toLocaleString()}` : "—", color: "text-success" },
                  { icon: Layers, label: "חדרים", value: lead.rooms || "—", color: "text-primary" },
                  { icon: Maximize2, label: 'שטח מ"ר', value: lead.area_sqm ? `${lead.area_sqm}` : "—", color: "text-info" },
                  { icon: Home, label: "קומה", value: lead.floor || "—", color: "text-warning" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="bg-secondary/50 rounded-xl p-3 text-center">
                    <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
                    <p className="text-base font-bold text-foreground">{value}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                {[
                  { label: "סוג נכס", value: lead.property_type },
                  { label: "סוג עסקה", value: lead.deal_type },
                  { label: "עיר", value: lead.city },
                  { label: "שכונה", value: lead.neighbourhood },
                  { label: "כתובת", value: lead.address },
                  { label: "מקור", value: lead.source === "yad2" ? "יד2" : lead.source === "madlan" ? "מדלן" : "ידני" },
                  { label: "תאריך הוספה", value: moment(lead.created_date).format("DD/MM/YYYY") },
                  { label: "פנייה אחרונה", value: lead.last_contacted_date ? moment(lead.last_contacted_date).format("DD/MM/YYYY") : null },
                  { label: "יש מתווך", value: lead.has_agent ? "כן" : "לא" },
                ].filter(r => r.value).map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-1.5 border-b border-border/30 last:border-0">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground text-right">{value}</span>
                  </div>
                ))}
              </div>

              {amenities.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {amenities.map(a => (
                    <span key={a.key} className="px-2.5 py-1 bg-success/10 text-success text-xs font-medium rounded-full border border-success/20">
                      ✓ {a.label}
                    </span>
                  ))}
                </div>
              )}

              {lead.description && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">תיאור הנכס</p>
                  <p className="text-sm text-foreground bg-secondary/40 rounded-xl p-4 leading-relaxed">{lead.description}</p>
                </div>
              )}

              {lead.tags && lead.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {lead.tags.map((tag, i) => (
                    <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full">
                      <Tag className="w-3 h-3" />{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: History */}
          {activeTab === "history" && (
            <div className="space-y-3">
              {loadingMsgs ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-secondary/40 rounded-xl animate-pulse" />)}</div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center">
                  <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">לא נשלחו הודעות ללקוח זה עדיין</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute right-4 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-4 pr-10">
                    {messages.map(msg => {
                      const sc = msgStatusMap[msg.status] || msgStatusMap.pending;
                      const StatusIcon = sc.icon;
                      return (
                        <div key={msg.id} className="relative">
                          <div className={`absolute -right-6 top-2 w-3 h-3 rounded-full border-2 border-background ${msg.status === "failed" ? "bg-destructive" : msg.status === "replied" ? "bg-accent" : msg.status === "opened" ? "bg-primary" : msg.status === "delivered" ? "bg-success" : msg.status === "sent" ? "bg-info" : "bg-muted-foreground"}`} />
                          <div className="bg-secondary/40 rounded-xl p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className={`flex items-center gap-1.5 text-xs font-semibold ${sc.color}`}>
                                <StatusIcon className="w-3.5 h-3.5" />{sc.label}
                              </span>
                              <span className="text-[11px] text-muted-foreground">{moment(msg.sent_at || msg.created_date).format("DD/MM/YY HH:mm")}</span>
                            </div>
                            <p className="text-xs text-foreground/80 line-clamp-3">{msg.message_content}</p>
                            {msg.error_message && (
                              <p className="text-xs text-destructive mt-1">שגיאה: {msg.error_message}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: Notes */}
          {activeTab === "notes" && (
            <div className="space-y-4">
              {editing ? (
                <>
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={8}
                    placeholder="הוסף הערות על הלקוח..."
                    className="bg-secondary border-border text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => { setEditing(false); setNotes(lead.notes || ""); }}>ביטול</Button>
                    <Button size="sm" onClick={handleSaveNotes} disabled={savingNotes} className="gap-2">
                      <Save className="w-3.5 h-3.5" />{savingNotes ? "שומר..." : "שמור"}
                    </Button>
                  </div>
                </>
              ) : (
                <div>
                  {notes ? (
                    <div className="bg-secondary/40 rounded-xl p-4">
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{notes}</p>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <Edit className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">אין הערות עדיין</p>
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => setEditing(true)}>
                    <Edit className="w-3.5 h-3.5" />ערוך הערות
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}