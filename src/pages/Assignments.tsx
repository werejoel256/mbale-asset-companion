import PageHeader from "@/components/PageHeader";
import { ClipboardList } from "lucide-react";

export default function Assignments() {
  return (
    <div className="p-6">
      <PageHeader title="Asset Assignments" description="Track asset assignments to staff and departments" />
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Asset assignment records will appear here</p>
      </div>
    </div>
  );
}
