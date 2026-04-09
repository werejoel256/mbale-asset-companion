import PageHeader from "@/components/PageHeader";
import { ArrowLeftRight } from "lucide-react";

export default function Movements() {
  return (
    <div className="p-6">
      <PageHeader title="Asset Movements" description="Track assets moving between departments" />
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <ArrowLeftRight className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Asset movement records will appear here</p>
      </div>
    </div>
  );
}
