export default function StatCard({ icon, label, value, delta, deltaType = "neutral", color = "primary" }) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    info: "bg-info/10 text-info",
    destructive: "bg-destructive/10 text-destructive",
    success: "bg-success/10 text-success",
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.primary}`}>
          {icon}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {delta && (
        <p className={`text-xs mt-1 ${
          deltaType === "up" ? "text-success" : deltaType === "down" ? "text-destructive" : "text-muted-foreground"
        }`}>
          {deltaType === "up" ? "↑ " : deltaType === "down" ? "↓ " : ""}{delta}
        </p>
      )}
    </div>
  );
}