import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import { HelpCircle, MessageSquare, BookOpen, ChevronDown, ChevronUp, Send, X } from "lucide-react";

const FAQ = [
  { q: "איך שואבים לידים?", a: "לחצו על 'שאב לידים' בתפריט, בחרו מקור (יד2/מדלן), הזינו פרמטרי חיפוש ולחצו 'התחל שאיבה'." },
  { q: "מה זה קרדיטים?", a: "קרדיטים הם הכסף הוירטואלי במערכת. כל שאיבה מנכה קרדיטים לפי כמות הלידים שנמצאו. ניתן לרכוש קרדיטים נוספים בדף הקרדיטים." },
  { q: "איך מקשרים WhatsApp?", a: "גשו להגדרות > WhatsApp, לחצו על 'חבר WhatsApp' וסרקו את ה-QR Code באפליקציה." },
  { q: "איך יוצרים קמפיין?", a: "לחצו על 'קמפיין חדש' בתפריט, עברו 4 שלבים: בחירת סוג, יצירת הודעה, קהל יעד ותזמון." },
  { q: "האם ניתן לייצא לידים?", a: "כרגע ניתן לצפות בלידים ולסנן אותם. ייצוא ל-Excel בפיתוח ויגיע בקרוב." },
  { q: "מה הגבלת השליחה היומית?", a: "המגבלה היומית המוגדרת ב-WhatsApp היא 50 הודעות לחשבון כדי למנוע חסימה. ניתן לפרוס על מספר ימים." },
];

const GUIDES = [
  { title: "מדריך מהיר — שאיבת לידים ראשונה", icon: "🚀", steps: ["גשו לשאיבת לידים", "בחרו מקור (יד2 או מדלן)", "הזינו עיר וסוג עסקה", "לחצו התחל שאיבה", "המתינו לסיום ועברו לניהול לידים"] },
  { title: "שליחת קמפיין WhatsApp", icon: "📱", steps: ["חברו WhatsApp בהגדרות", "צרו קמפיין חדש", "כתבו הודעות עם AI", "בחרו קהל יעד", "הגדירו תזמון ושגרו"] },
];

export default function HelpCenter({ open, onClose }) {
  const { toast } = useToast();
  const [tab, setTab] = useState("faq");
  const [openFaq, setOpenFaq] = useState(null);
  const [openGuide, setOpenGuide] = useState(null);
  const [ticket, setTicket] = useState({ subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const submitTicket = async () => {
    if (!ticket.subject || !ticket.message) return;
    setSending(true);
    const user = await base44.auth.me().catch(() => null);
    await base44.integrations.Core.SendEmail({
      to: "support@brokerpro.co.il",
      subject: `[תמיכה] ${ticket.subject}`,
      body: `מאת: ${user?.email || "לא ידוע"}\n\n${ticket.message}`,
    }).catch(() => null);
    toast({ title: "כרטיס נשלח!", description: "נחזור אליך בהקדם" });
    setTicket({ subject: "", message: "" });
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl [&>button:first-of-type]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-l from-primary/5 to-purple-500/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">מרכז תמיכה</h2>
              <p className="text-xs text-muted-foreground">שאלות, מדריכים ופתיחת כרטיס</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-border transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {[
            { id: "faq", label: "שאלות נפוצות", icon: HelpCircle },
            { id: "guides", label: "מדריכים", icon: BookOpen },
            { id: "ticket", label: "פתח כרטיס", icon: MessageSquare },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}>
                <Icon className="w-3.5 h-3.5" />{t.label}
              </button>
            );
          })}
        </div>

        <div className="p-5 overflow-y-auto max-h-[60vh]">
          {/* FAQ */}
          {tab === "faq" && (
            <div className="space-y-2">
              {FAQ.map((item, i) => (
                <div key={i} className="border border-border rounded-xl overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors text-right">
                    {item.q}
                    {openFaq === i ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4 text-sm text-muted-foreground border-t border-border/50 pt-3 bg-secondary/20 leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Guides */}
          {tab === "guides" && (
            <div className="space-y-3">
              {GUIDES.map((g, i) => (
                <div key={i} className="border border-border rounded-xl overflow-hidden">
                  <button onClick={() => setOpenGuide(openGuide === i ? null : i)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary/50 transition-colors text-right">
                    <span className="text-xl">{g.icon}</span>
                    <span className="flex-1">{g.title}</span>
                    {openGuide === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {openGuide === i && (
                    <div className="px-4 pb-4 border-t border-border/50 pt-3 bg-secondary/20">
                      <ol className="space-y-2">
                        {g.steps.map((s, j) => (
                          <li key={j} className="flex items-start gap-3 text-sm text-foreground">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">{j+1}</span>
                            {s}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Ticket */}
          {tab === "ticket" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">לא מצאת תשובה? פתח כרטיס תמיכה ונחזור אליך תוך 24 שעות.</p>
              <div>
                <label className="text-xs font-medium text-muted-foreground">נושא</label>
                <Input value={ticket.subject} onChange={e => setTicket(p => ({ ...p, subject: e.target.value }))}
                  placeholder="תאר בקצרה את הבעיה..." className="bg-secondary border-border mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">פירוט</label>
                <Textarea value={ticket.message} onChange={e => setTicket(p => ({ ...p, message: e.target.value }))}
                  placeholder="תאר את הבעיה בפירוט..." rows={5} className="bg-secondary border-border mt-1" />
              </div>
              <Button onClick={submitTicket} disabled={sending || !ticket.subject || !ticket.message} className="w-full gap-2">
                <Send className="w-4 h-4" />{sending ? "שולח..." : "שלח כרטיס"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}