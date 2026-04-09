import PageHeader from "@/components/PageHeader";
import { Trash2 } from "lucide-react";

export default function Disposals() {
  return (
    <div className="p-6">
      <PageHeader title="Asset Disposals" description="Manage disposed and decommissioned assets" />
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <Trash2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Asset disposal records will appear here</p>
      </div>
    </div>
  );
}
