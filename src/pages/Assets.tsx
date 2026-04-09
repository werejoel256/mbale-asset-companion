import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { assets, departments, assetCategories } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Assets() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = assets.filter((a) => {
    const matchSearch = a.asset_name.toLowerCase().includes(search.toLowerCase()) ||
      a.asset_tag.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6">
      <PageHeader title="Assets" description="Manage all hospital assets">
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Add Asset
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {["All", "In Use", "Under Maintenance", "Disposed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Asset Tag</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Condition</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cost</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const cat = assetCategories.find((c) => c.id === a.category_id);
                const dept = departments.find((d) => d.id === a.department_id);
                return (
                  <tr key={a.id} className="border-t border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer">
                    <td className="py-3 px-4 font-mono text-xs text-primary">{a.asset_tag}</td>
                    <td className="py-3 px-4 font-medium">{a.asset_name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{cat?.category_name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{dept?.department_name}</td>
                    <td className="py-3 px-4"><StatusBadge status={a.asset_condition} /></td>
                    <td className="py-3 px-4"><StatusBadge status={a.status} /></td>
                    <td className="py-3 px-4 text-right font-medium">${a.purchase_cost.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
