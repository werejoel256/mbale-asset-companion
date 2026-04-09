import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { maintenanceRecords, assets } from "@/lib/mock-data";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Maintenance() {
  return (
    <div className="p-6">
      <PageHeader title="Maintenance Records" description="Track all maintenance activities">
        <Button className="gap-2"><Plus className="w-4 h-4" /> New Record</Button>
      </PageHeader>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Asset</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cost</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {maintenanceRecords.map((r) => {
              const asset = assets.find((a) => a.id === r.asset_id);
              return (
                <tr key={r.id} className="border-t border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 font-medium">{asset?.asset_name}</td>
                  <td className="py-3 px-4"><StatusBadge status={r.maintenance_type} /></td>
                  <td className="py-3 px-4 text-muted-foreground">{r.maintenance_date}</td>
                  <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">{r.description}</td>
                  <td className="py-3 px-4 font-medium">${r.cost.toLocaleString()}</td>
                  <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
