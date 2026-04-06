import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Loader2, Zap, Database, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";

const SOURCE_LABELS = { yad2: "יד2", madlan: "מדלן" };

function ProgressSteps({ steps }) {
  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
            step.status === "done" ? "bg-success/15 text-success" :
            step.status === "active" ? "bg-primary/15 text-primary" :
            "bg-secondary text-muted-foreground"
          }`}>
            {step.status === "done" ? <CheckCircle className="w-4 h-4" /> :
             step.status === "active" ? <Loader2 className="w-4 h-4 animate-spin" /> :
             <span className="text-xs font-bold">{i + 1}</span>}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${step.status === "active" ? "text-foreground" : step.status === "done" ? "text-success" : "text-muted-foreground"}`}>
              {step.label}
            </p>
            {step.detail && <p className="text-xs text-muted-foreground">{step.detail}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ScrapeProgressModal({ open, onClose, params, source, batchParams }) {
  const navigate = useNavigate();
  const [phases, setPhases] = useState([]); // per-source progress
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const pollRefs = useRef([]);

  useEffect(() => {
    if (!open || !batchParams || batchParams.length === 0) return;

    const initialPhases = batchParams.map(b => ({
      source: b.source,
      batchId: b.batchId,
      runId: b.runId,
      datasetId: b.datasetId,
      status: "running", // running | succeeded | failed
      newLeads: 0,
      duplicates: 0,
      total: 0,
      steps: [
        { label: "מתחבר לשרת השאיבה", status: "done" },
        { label: `שואב מ-${SOURCE_LABELS[b.source]}`, status: "active", detail: "מחפש מודעות..." },
        { label: "מסנן כפילויות", status: "pending" },
        { label: "שומר לידים", status: "pending" },
      ],
    }));
    setPhases(initialPhases);
    setDone(false);
    setError(null);

    // Start polling for each source
    batchParams.forEach((b, idx) => {
      let attempts = 0;
      const maxAttempts = 36;

      const poll = setInterval(async () => {
        attempts++;
        try {
          const pollRes = await base44.functions.invoke("scrapeLeads", {
            check_run_id: b.runId,
            dataset_id: b.datasetId,
            batch_id: b.batchId,
            source: b.source,
          });
          const data = pollRes.data;

          if (data.run_status === "SUCCEEDED") {
            clearInterval(poll);
            setPhases(prev => prev.map((p, i) => i !== idx ? p : {
              ...p,
              status: "succeeded",
              newLeads: data.new_leads || 0,
              duplicates: data.duplicates || 0,
              total: data.total || 0,
              steps: [
                { label: "מתחבר לשרת השאיבה", status: "done" },
                { label: `שואב מ-${SOURCE_LABELS[b.source]}`, status: "done", detail: `${data.total || 0} מודעות נמצאו` },
                { label: "מסנן כפילויות", status: "done", detail: `${data.duplicates || 0} כפולים הוסרו` },
                { label: "שומר לידים", status: "done", detail: `${data.new_leads || 0} לידים חדשים נשמרו` },
              ],
            }));
            checkAllDone();

          } else if (["FAILED","ABORTED","TIMED-OUT"].includes(data.run_status)) {
            clearInterval(poll);
            setPhases(prev => prev.map((p, i) => i !== idx ? p : {
              ...p,
              status: "failed",
              steps: p.steps.map(s => s.status === "active" ? { ...s, status: "done" } : s),
            }));
            setError(`השאיבה מ-${SOURCE_LABELS[b.source]} נכשלה`);
            checkAllDone();

          } else if (attempts >= maxAttempts) {
            clearInterval(poll);
            setPhases(prev => prev.map((p, i) => i !== idx ? p : { ...p, status: "failed" }));
            setError("השאיבה לקחה יותר מדי זמן");
            checkAllDone();

          } else {
            // Still running — animate steps slightly
            setPhases(prev => prev.map((p, i) => {
              if (i !== idx) return p;
              const elapsed = attempts * 5;
              let steps = [...p.steps];
              if (elapsed > 20) {
                steps[1] = { ...steps[1], detail: "מוריד פרטי מודעות..." };
              }
              if (elapsed > 40) {
                steps[2] = { ...steps[2], status: "active", detail: "מסנן..." };
              }
              return { ...p, steps };
            }));
          }
        } catch { /* keep polling */ }
      }, 5000);

      pollRefs.current[idx] = poll;
    });

    return () => pollRefs.current.forEach(p => p && clearInterval(p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, batchParams]);

  function checkAllDone() {
    setPhases(prev => {
      const allDone = prev.every(p => p.status === "succeeded" || p.status === "failed");
      if (allDone) setDone(true);
      return prev;
    });
  }

  const totalNewLeads = phases.reduce((s, p) => s + p.newLeads, 0);
  const creditsUsed = totalNewLeads;
  const allSucceeded = phases.length > 0 && phases.every(p => p.status === "succeeded");

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && done) onClose(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl [&>button:first-of-type]:hidden border-0 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-l from-primary/10 to-purple-500/5 border-b border-border px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-glow">
              {done
                ? (allSucceeded ? <CheckCircle className="w-5 h-5 text-white" /> : <AlertCircle className="w-5 h-5 text-white" />)
                : <Loader2 className="w-5 h-5 text-white animate-spin" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {done ? (allSucceeded ? "שאיבה הושלמה בהצלחה! 🎉" : "שאיבה הסתיימה") : "שאיבת לידים מתבצעת..."}
              </h2>
              <p className="text-xs text-muted-foreground">
                {done ? "הלידים נשמרו למאגר" : "אנא המתן, התהליך אורך 1-3 דקות"}
              </p>
            </div>
          </div>
        </div>

        {/* Progress per source */}
        <div className="px-6 py-5 space-y-6">
          {phases.map((phase, idx) => (
            <div key={idx}>
              {phases.length > 1 && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    {SOURCE_LABELS[phase.source]}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                  {phase.status === "succeeded" && (
                    <span className="text-xs text-success font-semibold">הושלם ✓</span>
                  )}
                  {phase.status === "failed" && (
                    <span className="text-xs text-destructive font-semibold">נכשל</span>
                  )}
                </div>
              )}
              <ProgressSteps steps={phase.steps} />
            </div>
          ))}
        </div>

        {/* Stats — shown when done */}
        {done && (
          <div className="px-6 pb-5 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Database, label: "לידים חדשים", value: totalNewLeads, color: "text-success" },
                { icon: TrendingUp, label: "כפולים", value: phases.reduce((s, p) => s + p.duplicates, 0), color: "text-muted-foreground" },
                { icon: Zap, label: "קרדיטים שנוצלו", value: creditsUsed, color: "text-primary" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-secondary/60 rounded-xl p-3 text-center">
                  <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {creditsUsed > 0 && (
              <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 flex items-start gap-2">
                <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-foreground/70 leading-relaxed">
                  <span className="font-semibold text-primary">{creditsUsed} קרדיטים</span> נוצלו עבור שאיבה זו.
                  כל ליד חדש שנשמר מנכה קרדיט אחד מהחשבון שלך.
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button className="flex-1" onClick={() => { onClose(); navigate("/leads"); }}>
                צפה בלידים
              </Button>
              <Button variant="outline" className="flex-1" onClick={onClose}>
                שאיבה נוספת
              </Button>
            </div>
          </div>
        )}

        {/* Loading bar at bottom */}
        {!done && (
          <div className="h-1 bg-secondary overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-purple-400 animate-pulse" style={{ width: "60%" }} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}