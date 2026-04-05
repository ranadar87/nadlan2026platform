export default function StatCard({ icon, label, value, delta, deltaType = "neutral" }) {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-border p-5 hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground mb-0.5">{value}</p>
      <p className="text-[12px] text-muted-foreground">{label}</p>
      {delta && (
        <p className={`text-[11px] mt-1.5 font-medium ${
          deltaType === "up" ? "text-success" : deltaType === "down" ? "text-destructive" : "text-muted-foreground"
        }`}>
          {deltaType === "up" ? "↑ " : deltaType === "down" ? "↓ " : ""}{delta}
        </p>
      )}
    </div>
  );
}