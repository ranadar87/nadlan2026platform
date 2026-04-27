import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, Plus, Trash2, Image, Upload, Edit2, Check, X, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";

const MAX_VARIATIONS = 10;

export default function CampaignStep2({ campaign, update }) {
  const [tab, setTab] = useState("ai"); // "ai" | "manual"
  const [generating, setGenerating] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [globalMediaMode, setGlobalMediaMode] = useState("global"); // "global" | "per"
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const fileRef = useRef(null);
  const globalFileRef = useRef(null);

  const variations = campaign.message_variations || [];

  const addVariation = () => {
    if (variations.length >= MAX_VARIATIONS) return;
    update("message_variations", [...variations, { label: `וריאציה ${String.fromCharCode(65 + variations.length)}`, content: "" }]);
  };

  const generateVariations = async () => {
    if (!campaign.ai_prompt) return;
    setGenerating(true);
    const res = await base44.functions.invoke('generateWithGemini', { prompt: campaign.ai_prompt });
    if (res.data?.variations) {
      const newVars = res.data.variations.map(v => ({ ...v, media_url: "" }));
      update("message_variations", newVars);
    }
    setGenerating(false);
  };

  const removeVariation = (idx) => {
    update("message_variations", variations.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
  };

  const startEdit = (idx) => {
    setEditingIdx(idx);
    setEditContent(variations[idx].content);
  };

  const saveEdit = (idx) => {
    const updated = [...variations];
    updated[idx] = { ...updated[idx], content: editContent };
    update("message_variations", updated);
    setEditingIdx(null);
  };

  const uploadGlobalMedia = async (file) => {
    if (!file) return;
    setUploadingIdx("global");
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update("global_media_url", file_url);
    setUploadingIdx(null);
  };

  const uploadVariationMedia = async (file, idx) => {
    if (!file) return;
    setUploadingIdx(idx);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const updated = [...variations];
    updated[idx] = { ...updated[idx], media_url: file_url };
    update("message_variations", updated);
    setUploadingIdx(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-foreground mb-1">שלב 2 — יצירת הודעה</h3>
        <p className="text-xs text-muted-foreground">צור עד {MAX_VARIATIONS} וריאציות הודעה — עם AI או ידנית</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-secondary rounded-xl p-1 gap-1">
        {[{ id: "ai", label: "✨ יצירה עם AI" }, { id: "manual", label: "✏️ כתיבה ידנית" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-white shadow text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* AI Tab */}
      {tab === "ai" && (
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">תאר את המסר שלך</Label>
            <Textarea
              value={campaign.ai_prompt || ""}
              onChange={e => update("ai_prompt", e.target.value)}
              placeholder="לדוגמה: אני מתווך נדל״ן מתמחה באזור תל אביב. אני רוצה להציע שירות למכירת דירה עם ליווי מלא..."
              className="bg-secondary border-border mt-1 min-h-[100px]"
            />
          </div>
          <Button onClick={generateVariations} disabled={generating || !campaign.ai_prompt} className="gap-2 w-full">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? "מייצר וריאציות..." : `צור ${variations.length > 0 ? "מחדש " : ""}3 וריאציות עם AI`}
          </Button>
        </div>
      )}

      {/* Manual Tab */}
      {tab === "manual" && (
        <Button onClick={addVariation} disabled={variations.length >= MAX_VARIATIONS} variant="outline" className="gap-2 w-full border-dashed">
          <Plus className="w-4 h-4" />
          הוסף וריאציה ({variations.length}/{MAX_VARIATIONS})
        </Button>
      )}

      {/* Global Media */}
      {variations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-2"><Image className="w-3.5 h-3.5" /> מדיה (תמונה / סרטון)</Label>
            <div className="flex bg-secondary rounded-lg p-0.5 gap-0.5">
              {[{ v: "global", l: "תמונה אחת לכל" }, { v: "per", l: "תמונה לכל וריאציה" }].map(o => (
                <button key={o.v} onClick={() => setGlobalMediaMode(o.v)}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-all ${globalMediaMode === o.v ? "bg-white shadow text-primary font-medium" : "text-muted-foreground"}`}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
          {globalMediaMode === "global" && (
            <div className="border-2 border-dashed border-border rounded-xl p-4 text-center bg-secondary/40">
              {campaign.global_media_url ? (
                <div className="relative inline-block">
                  <img src={campaign.global_media_url} alt="media" className="max-h-32 rounded-lg mx-auto" />
                  <button onClick={() => update("global_media_url", "")} className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <>
                  <input ref={globalFileRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => uploadGlobalMedia(e.target.files[0])} />
                  <button onClick={() => globalFileRef.current?.click()} className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mx-auto">
                    {uploadingIdx === "global" ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
                    <span className="text-xs">{uploadingIdx === "global" ? "מעלה..." : "לחץ להעלאת תמונה / סרטון"}</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Variations List */}
      {variations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">וריאציות ({variations.length}/{MAX_VARIATIONS})</h4>
            {tab === "ai" && variations.length < MAX_VARIATIONS && (
              <button onClick={addVariation} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> הוסף ידנית
              </button>
            )}
          </div>
          {variations.map((v, i) => (
            <div key={i} className="bg-secondary border border-border rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-border">
                <span className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-xs font-medium text-foreground flex-1">{v.label}</span>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(i)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => removeVariation(i)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                {editingIdx === i ? (
                  <div className="space-y-2">
                    <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="bg-white border-border text-sm min-h-[100px]" autoFocus />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(i)} className="gap-1 h-7 text-xs"><Check className="w-3 h-3" /> שמור</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingIdx(null)} className="gap-1 h-7 text-xs"><X className="w-3 h-3" /> ביטול</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{v.content || <span className="text-muted-foreground italic">אין תוכן עדיין — לחץ עריכה</span>}</p>
                )}
                {globalMediaMode === "per" && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <input type="file" accept="image/*,video/*" className="hidden" id={`media-${i}`} onChange={e => uploadVariationMedia(e.target.files[0], i)} />
                    {v.media_url ? (
                      <div className="flex items-center gap-2">
                        <img src={v.media_url} alt="media" className="h-12 w-12 object-cover rounded-lg" />
                        <button onClick={() => { const u=[...variations]; u[i]={...u[i],media_url:""}; update("message_variations",u); }} className="text-xs text-destructive hover:underline">הסר</button>
                      </div>
                    ) : (
                      <label htmlFor={`media-${i}`} className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                        {uploadingIdx === i ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                        {uploadingIdx === i ? "מעלה..." : "הוסף תמונה לוריאציה זו"}
                      </label>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {variations.length === 0 && tab === "manual" && (
        <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
          לחץ "הוסף וריאציה" כדי להתחיל לכתוב הודעות
        </div>
      )}
    </div>
  );
}