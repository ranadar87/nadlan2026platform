const statusConfig = {
  new: { label: "חדש", className: "bg-primary/15 text-primary" },
  contacted: { label: "נוצר קשר", className: "bg-info/15 text-info" },
  interested: { label: "מתעניין", className: "bg-success/15 text-success" },
  not_interested: { label: "לא מתעניין", className: "bg-destructive/15 text-destructive" },
  deal_closed: { label: "סגירת עסקה", className: "bg-accent/15 text-accent" },
  archived: { label: "ארכיון", className: "bg-muted text-muted-foreground" },
};

export default function LeadStatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.new;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}