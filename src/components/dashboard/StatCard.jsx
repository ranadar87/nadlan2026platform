const colorMap = {
  purple: { bg: "from-primary/10 to-purple-500/5", icon: "bg-primary/10 text-primary", dot: "bg-primary" },
  green: { bg: "from-success/10 to-emerald-400/5", icon: "bg-success/10 text-success", dot: "bg-success" },
  blue: { bg: "from-info/10 to-sky-400/5", icon: "bg-info/10 text-info", dot: "bg-info" },
  orange: { bg: "from-warning/10 to-amber-400/5", icon: "bg-warning/10 text-warning", dot: "bg-warning" },
};

export default function StatCard({ icon, label, value, delta, deltaType = "neutral", color = "purple" }) {
  const c = colorMap[color] || colorMap.purple;
  return (
    <div className={`relative overflow-hidden bg-white rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-all duration-300 p-6 group cursor-default`}>
      {/* Subtle gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${c.bg} opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="relative">
        <div className={`w-12 h-12 rounded-2xl ${c.icon} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <p className="text-3xl font-bold text-foreground mb-1 tracking-tight">{value}</p>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        {delta && (
          <div className="flex items-center gap-1 mt-2">
            <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            <p className={`text-xs font-semibold ${
              deltaType === "up" ? "text-success" : deltaType === "down" ? "text-destructive" : "text-muted-foreground"
            }`}>
              {deltaType === "up" ? "↑ " : deltaType === "down" ? "↓ " : ""}{delta}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}