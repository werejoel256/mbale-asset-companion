const statusConfig: Record<string, string> = {
  // Asset Statuses
  "In Use": "bg-success/10 text-success border border-success/20",
  "Active": "bg-success/10 text-success border border-success/20",
  "Available": "bg-success/10 text-success border border-success/20",
  "Good": "bg-success/10 text-success border border-success/20",

  // Maintenance Statuses
  "Completed": "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
  "In Progress": "bg-blue-500/10 text-blue-700 border border-blue-500/20",
  "Scheduled": "bg-amber-500/10 text-amber-700 border border-amber-500/20",
  "Cancelled": "bg-gray-500/10 text-gray-700 border border-gray-500/20",

  // Fault Report Statuses
  "Resolved": "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
  "Closed": "bg-slate-500/10 text-slate-700 border border-slate-500/20",
  "Reported": "bg-red-500/10 text-red-700 border border-red-500/20",
  "Investigating": "bg-orange-500/10 text-orange-700 border border-orange-500/20",

  // Priority Levels
  "Low": "bg-slate-500/10 text-slate-700 border border-slate-500/20",
  "Medium": "bg-yellow-500/10 text-yellow-700 border border-yellow-500/20",
  "High": "bg-orange-500/10 text-orange-700 border border-orange-500/20",
  "Critical": "bg-red-500/10 text-red-700 border border-red-500/20",

  // Maintenance Types
  "Preventive": "bg-green-500/10 text-green-700 border border-green-500/20",
  "Corrective": "bg-blue-500/10 text-blue-700 border border-blue-500/20",
  "Predictive": "bg-purple-500/10 text-purple-700 border border-purple-500/20",
  "Emergency": "bg-red-500/10 text-red-700 border border-red-500/20",

  // Legacy statuses (keeping for compatibility)
  "Under Maintenance": "bg-accent/10 text-accent border border-accent/20",
  "Fair": "bg-accent/10 text-accent border border-accent/20",
  "Open": "bg-primary/10 text-primary border border-primary/20",
  "Disposed": "bg-destructive/10 text-destructive border border-destructive/20",
  "Poor": "bg-destructive/10 text-destructive border border-destructive/20",
};

export default function StatusBadge({ status }: { status: string }) {
  const style = statusConfig[status] || "bg-secondary text-secondary-foreground";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}
