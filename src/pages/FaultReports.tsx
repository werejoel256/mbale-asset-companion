import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { faultReports, assets } from "@/lib/mock-data";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FaultReports() {
  return (
    <div className="p-6">
      <PageHeader title="Fault Reports" description="Report and track asset faults">
        <Button className="gap-2"><Plus className="w-4 h-4" /> Report Fault</Button>
      </PageHeader>

      <div className="grid gap-4">
        {faultReports.map((f) => {
          const asset = assets.find((a) => a.id === f.asset_id);
          return (
            <div key={f.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow animate-fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{asset?.asset_name}</h3>
                    <StatusBadge status={f.priority} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{f.description}</p>
                  <p className="text-xs text-muted-foreground">Reported by {f.reported_by} on {f.report_date}</p>
                </div>
                <StatusBadge status={f.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
