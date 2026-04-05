const sources = [
  { id: "yad2", label: "יד2", sub: "yad2.co.il", emoji: "🏷️" },
  { id: "madlan", label: "מדלן", sub: "madlan.co.il", emoji: "🏙️" },
  { id: "both", label: "שניהם", sub: "שאיבה כפולה", emoji: "⚡" },
];

export default function SourceSelector({ value, onChange }) {
  return (
    <div className="flex gap-3">
      {sources.map((src) => (
        <button
          key={src.id}
          type="button"
          onClick={() => onChange(src.id)}
          className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
            value === src.id
              ? "border-primary bg-primary/10"
              : "border-border bg-secondary hover:border-border/80"
          }`}
        >
          <span className="text-2xl">{src.emoji}</span>
          <span className="text-sm font-semibold text-foreground">{src.label}</span>
          <span className="text-[10px] text-muted-foreground">{src.sub}</span>
        </button>
      ))}
    </div>
  );
}