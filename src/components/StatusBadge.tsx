const statusConfig: Record<string, string> = {
  "In Use": "bg-success/10 text-success",
  "Active": "bg-success/10 text-success",
  "Completed": "bg-success/10 text-success",
  "Good": "bg-success/10 text-success",
  "Resolved": "bg-success/10 text-success",
  "Under Maintenance": "bg-accent/10 text-accent",
  "In Progress": "bg-accent/10 text-accent",
  "Fair": "bg-accent/10 text-accent",
  "Medium": "bg-accent/10 text-accent",
  "Open": "bg-primary/10 text-primary",
  "Low": "bg-muted text-muted-foreground",
  "Disposed": "bg-destructive/10 text-destructive",
  "Poor": "bg-destructive/10 text-destructive",
  "Critical": "bg-destructive/10 text-destructive",
  "High": "bg-destructive/10 text-destructive",
};

export default function StatusBadge({ status }: { status: string }) {
  const style = statusConfig[status] || "bg-secondary text-secondary-foreground";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}
