import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const STEPS = [
  {
    title: "ברוכים הבאים! 👋",
    desc: "בוא נעשה סיור קצר במערכת. תוכל לדלג בכל עת.",
    target: null,
    position: "center",
  },
  {
    title: "סיידבר ניווט",
    desc: "כאן תוכל לנווט בין מסכי המערכת: דשבורד, לידים, שאיבה, קמפיינים ועוד.",
    selector: "aside",
    position: "left",
  },
  {
    title: "שאב לידים",
    desc: "לחץ כאן כדי לשאוב לידים חדשים מיד2 או מדלן לפי הפרמטרים שתגדיר.",
    selector: "[data-tour='scrape-btn']",
    position: "bottom",
  },
  {
    title: "קמפיין חדש",
    desc: "צור קמפיין WhatsApp או SMS ושלח הודעות מותאמות אישית ללידים שלך.",
    selector: "[data-tour='campaign-btn']",
    position: "bottom",
  },
  {
    title: "ניהול לידים",
    desc: "כל הלידים שלך מוצגים כאן. ניתן לסנן לפי שאיבה, לשנות סטטוס ולהוסיף משימות.",
    selector: null,
    position: "center",
  },
  {
    title: "מוכן להתחיל! 🚀",
    desc: "זהו! המערכת פתוחה בפניך. אם יש שאלות לחץ על ? למעלה למרכז התמיכה.",
    target: null,
    position: "center",
  },
];

export default function LiveTutorial({ onDone }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-[100]" />

      {/* Tooltip / Card */}
      <div className="fixed z-[101] inset-0 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-fade-in">
          {/* Progress */}
          <div className="flex gap-1 mb-4">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-secondary"}`} />
            ))}
          </div>

          <div className="flex items-start justify-between mb-3">
            <h3 className="text-base font-bold text-foreground">{current.title}</h3>
            <button onClick={onDone} className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-border transition-colors flex-shrink-0 ml-2">
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">{current.desc}</p>

          <div className="flex items-center justify-between">
            <button onClick={onDone} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline">
              דלג על הסיור
            </button>
            <div className="flex gap-2">
              {!isFirst && (
                <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)} className="gap-1">
                  <ChevronRight className="w-3.5 h-3.5" />הקודם
                </Button>
              )}
              <Button size="sm" onClick={() => isLast ? onDone() : setStep(s => s + 1)} className="gap-1">
                {isLast ? "סיים" : "הבא"}
                {!isLast && <ChevronLeft className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}