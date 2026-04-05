import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CampaignStep2({ campaign, update }) {
  const [generating, setGenerating] = useState(false);

  const generateVariations = async () => {
    if (!campaign.ai_prompt) return;
    setGenerating(true);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `אתה קופירייטר מומחה לנדל"ן בישראל. צור 3 וריאציות של הודעת WhatsApp שיווקית בעברית על בסיס:
"${campaign.ai_prompt}"

כללים: כל וריאציה עד 300 תווים, השתמש ב-{{name}} כ-placeholder לשם הנמען.
וריאציה A: גישה מקצועית ורשמית
וריאציה B: גישה אישית ויחסית  
וריאציה C: גישה ישירה ותמציתית`,
      response_json_schema: {
        type: "object",
        properties: {
          variations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                content: { type: "string" },
              },
            },
          },
        },
      },
    });

    if (result?.variations) update("message_variations", result.variations);
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-foreground mb-1">שלב 2 — יצירת הודעה עם AI</h3>
        <p className="text-xs text-muted-foreground">תאר מה אתה רוצה להגיד וה-AI ייצר 3 וריאציות</p>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">תאר את המסר שלך</Label>
        <Textarea
          value={campaign.ai_prompt}
          onChange={e => update("ai_prompt", e.target.value)}
          placeholder="לדוגמה: אני מתווך נדל״ן מתמחה באזור תל אביב. אני רוצה להציע שירות למכירת דירה עם ליווי מלא..."
          className="bg-secondary border-border mt-1 min-h-[100px]"
        />
      </div>
      <Button onClick={generateVariations} disabled={generating || !campaign.ai_prompt} className="gap-2">
        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {generating ? "מייצר וריאציות..." : "צור 3 וריאציות עם AI"}
      </Button>
      {campaign.message_variations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">וריאציות שנוצרו:</h4>
          {campaign.message_variations.map((v, i) => (
            <div key={i} className="bg-secondary border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-xs font-medium text-foreground">{v.label}</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{v.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}