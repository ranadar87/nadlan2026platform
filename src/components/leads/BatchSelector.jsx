import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Layers, ChevronDown } from "lucide-react";
import moment from "moment";
import "moment/locale/he";
moment.locale("he");

export default function BatchSelector({ selectedBatchId, onSelect }) {
  const [batches, setBatches] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    base44.entities.ScrapeBatch.list("-created_date", 50).then(setBatches).catch(() => {});
  }, []);

  const selected = batches.find(b => b.id === selectedBatchId);
  const sourceLabel = { yad2: "יד2", madlan: "מדלן" };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors">
        <Layers className="w-4 h-4 text-muted-foreground" />
        <span className="text-foreground">
          {selected
            ? `${sourceLabel[selected.source] || selected.source} — ${moment(selected.created_date).format("DD/MM/YY")}`
            : "כל הלידים"}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-card-hover z-50 overflow-hidden min-w-64">
            <button
              onClick={() => { onSelect(null); setOpen(false); }}
              className={`w-full text-right px-4 py-3 text-sm hover:bg-secondary transition-colors flex items-center gap-3 ${!selectedBatchId ? "bg-secondary/60 font-semibold" : ""}`}>
              <div className="w-2 h-2 rounded-full bg-primary" />
              <div>
                <p className="font-medium">כל הלידים</p>
                <p className="text-xs text-muted-foreground">הצג את כל הלידים</p>
              </div>
            </button>
            {batches.length === 0 && (
              <p className="px-4 py-3 text-sm text-muted-foreground">אין שאיבות קיימות</p>
            )}
            {batches.map(b => (
              <button key={b.id}
                onClick={() => { onSelect(b.id); setOpen(false); }}
                className={`w-full text-right px-4 py-3 text-sm hover:bg-secondary transition-colors flex items-center gap-3 border-t border-border/40 ${selectedBatchId === b.id ? "bg-secondary/60" : ""}`}>
                <div className={`w-2 h-2 rounded-full ${b.source === "yad2" ? "bg-primary" : "bg-info"}`} />
                <div>
                  <p className="font-medium">{sourceLabel[b.source] || b.source} • {moment(b.created_date).format("DD/MM/YY HH:mm")}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.new_leads || 0} לידים חדשים
                    {b.search_params?.city ? ` • ${b.search_params.city}` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}