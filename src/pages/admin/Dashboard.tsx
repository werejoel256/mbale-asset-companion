import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  Activity,
  Wrench,
  AlertTriangle,
  Building2,
  DollarSign,
  ClipboardList,
  TrendingUp,
  Search,
  X,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Download,
  RefreshCw,
} from "lucide-react";
import "./css/Dashboard.css";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { assetsAPI, departmentsAPI, assetCategoriesAPI, faultReportsAPI, assignmentsAPI } from "@/lib/api";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const COLORS = ["hsl(174,62%,32%)", "hsl(38,92%,50%)", "hsl(200,25%,12%)", "hsl(152,60%,40%)", "hsl(200,15%,60%)"];

const Dashboard =()=> {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [generalSearch, setGeneralSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "critical" | "maintenance" | "available">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    data: assets = [],
    isLoading: assetsLoading,
    error: assetsError,
  } = useQuery({ queryKey: ["assets"], queryFn: assetsAPI.getAll });

  const {
    data: departments = [],
    isLoading: departmentsLoading,
    error: departmentsError,
  } = useQuery({ queryKey: ["departments"], queryFn: departmentsAPI.getAll });

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({ queryKey: ["assetCategories"], queryFn: assetCategoriesAPI.getAll });

  const {
    data: faultReports = [],
    isLoading: faultsLoading,
    error: faultsError,
  } = useQuery({ queryKey: ["faultReports"], queryFn: faultReportsAPI.getAll });

  const {
    data: assignments = [],
    isLoading: assignmentsLoading,
    error: assignmentsError,
  } = useQuery({ queryKey: ["assignments"], queryFn: assignmentsAPI.getAll });

  const isLoading = assetsLoading || departmentsLoading || categoriesLoading || faultsLoading || assignmentsLoading;
  const error = assetsError || departmentsError || categoriesError || faultsError || assignmentsError;

  const filteredAssets = useMemo(() => {
    let results = assets;

    // Apply filter mode
    if (filterMode === "critical") {
      results = results.filter((a) => a.status === "maintenance" || a.status === "under_maintenance" || a.status === "faulty");
    } else if (filterMode === "maintenance") {
      results = results.filter((a) => a.status === "under_maintenance" || a.status === "maintenance");
    } else if (filterMode === "available") {
      results = results.filter((a) => a.status === "available");
    }

    // Apply general search
    if (generalSearch.trim()) {
      const query = generalSearch.toLowerCase();
      results = results.filter((a) =>
        (a.asset_name || "").toLowerCase().includes(query) ||
        (a.asset_tag || "").toLowerCase().includes(query) ||
        (a.status || "").toLowerCase().includes(query)
      );
    }

    return results;
  }, [generalSearch, assets, filterMode]);

  const filteredDepartments = useMemo(() => {
    if (!generalSearch.trim()) return departments;
    const query = generalSearch.toLowerCase();
    return departments.filter((d) =>
      (d.department_name || "").toLowerCase().includes(query)
    );
  }, [generalSearch, departments]);

  const filteredCategories = useMemo(() => {
    if (!generalSearch.trim()) return categories;
    const query = generalSearch.toLowerCase();
    return categories.filter((c) =>
      (c.category_name || "").toLowerCase().includes(query)
    );
  }, [generalSearch, categories]);

  const dashboardStats = useMemo(() => {
    const totalAssets = filteredAssets.length;
    const totalValue = filteredAssets.reduce((sum, item) => sum + Number(item.purchase_cost || 0), 0);
    const activeAssets = filteredAssets.filter((asset) => asset.status === "available").length;
    const underMaintenance = filteredAssets.filter((asset) => asset.status === "under_maintenance" || asset.status === "maintenance").length;
    const openFaults = faultReports.filter((fault) => fault.status === "pending").length;
    const disposed = filteredAssets.filter((asset) => asset.status === "disposed").length;

    return {
      totalAssets,
      totalValue,
      activeAssets,
      underMaintenance,
      openFaults,
      departments: filteredDepartments.length,
      disposed,
      pendingAssignments: assignments.filter((assignment) => assignment.status === "active").length,
    };
  }, [filteredAssets, filteredDepartments, faultReports, assignments]);

  const categoryData = useMemo(
    () => filteredCategories.map((cat) => ({
      name: cat.category_name,
      value: filteredAssets.filter((a) => a.category_id === cat.id).length,
    })),
    [filteredAssets, filteredCategories]
  );

  const deptData = useMemo(
    () => filteredDepartments.map((d) => ({
      name: d.department_name,
      assets: filteredAssets.filter((a) => a.department_id === d.id).length,
    })),
    [filteredAssets, filteredDepartments]
  );

  const filteredFaults = useMemo(() => {
    let results = faultReports;

    // Filter by general search (assets)
    if (generalSearch.trim()) {
      const query = generalSearch.toLowerCase();
      results = results.filter((f) => {
        const asset = filteredAssets.find((a) => a.id === f.asset_id);
        return asset !== undefined;
      });
    }

    // Filter by fault-specific search
    if (search.trim()) {
      const query = search.toLowerCase();
      results = results.filter((f) => {
        const asset = assets.find((a) => a.id === f.asset_id);
        return (
          (asset?.asset_name || "").toLowerCase().includes(query) ||
          (asset?.asset_tag || "").toLowerCase().includes(query) ||
          (f.description || "").toLowerCase().includes(query) ||
          (f.priority || "").toLowerCase().includes(query) ||
          (f.status || "").toLowerCase().includes(query)
        );
      });
    }

    return results;
  }, [search, generalSearch, faultReports, filteredAssets, assets]);

  const topValueAssets = useMemo(
    () => filteredAssets
      .sort((a, b) => Number(b.purchase_cost || 0) - Number(a.purchase_cost || 0))
      .slice(0, 5),
    [filteredAssets]
  );


  const statusDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    filteredAssets.forEach((asset) => {
      const status = asset.status || "unknown";
      distribution[status] = (distribution[status] || 0) + 1;
    });
    return Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  }, [filteredAssets]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Invalidate all queries to clear cache and force fresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["assets"] }),
        queryClient.invalidateQueries({ queryKey: ["departments"] }),
        queryClient.invalidateQueries({ queryKey: ["assetCategories"] }),
        queryClient.invalidateQueries({ queryKey: ["faultReports"] }),
        queryClient.invalidateQueries({ queryKey: ["assignments"] }),
      ]);

      // Refetch all queries to get fresh data
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["assets"] }),
        queryClient.refetchQueries({ queryKey: ["departments"] }),
        queryClient.refetchQueries({ queryKey: ["assetCategories"] }),
        queryClient.refetchQueries({ queryKey: ["faultReports"] }),
        queryClient.refetchQueries({ queryKey: ["assignments"] }),
      ]);

      // Keep spinning for visual feedback
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ["Asset Name", "Asset Tag", "Status", "Purchase Cost", "Department", "Category"],
      ...filteredAssets.map((a) => [
        a.asset_name,
        a.asset_tag,
        a.status,
        a.purchase_cost || "N/A",
        departments.find((d) => d.id === a.department_id)?.department_name || "N/A",
        categories.find((c) => c.id === a.category_id)?.category_name || "N/A",
      ]),
    ].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assets-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="px-4 sm:px-6 md:p-6">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="px-4 sm:px-6 md:p-6 text-destructive">Failed to load dashboard data.</div>;
  }

  return (
    <div className="dashboard-page">
      {/* Banner Header - Sticky/Fixed at Top */}
      <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 md:-mx-6 px-4 sm:px-6 md:px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight uppercase mb-1">
            Mbale Regional Referral Hospital
          </h1>
          <p className="text-[11px] sm:text-xs md:text-sm font-bold uppercase tracking-widest text-primary-foreground/95">
            Asset Information Management System
          </p>
        </div>
      </div>

      {/* Main Content with Top Padding */}
      <div className="pt-4 px-4 sm:px-6 md:p-6">
        {/* General Search & Quick Actions */}
        <div className="mb-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search assets, departments, categories..."
                value={generalSearch}
                onChange={(e) => setGeneralSearch(e.target.value)}
                className="pl-9 pr-9 h-9 text-sm"
              />
              {generalSearch && (
                <button
                  onClick={() => setGeneralSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterMode === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterMode("all")}
                className={`gap-1 h-8 ${filterMode === "all" ? "bg-success hover:bg-success/90 text-white border-0" : "hover:border-success hover:text-success"}`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                All Assets
              </Button>
              <Button
                variant={filterMode === "critical" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterMode("critical")}
                className={`gap-1 h-8 ${filterMode === "critical" ? "bg-destructive hover:bg-destructive/90 text-white border-0" : "hover:border-destructive hover:text-destructive"}`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Critical
              </Button>
              <Button
                variant={filterMode === "maintenance" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterMode("maintenance")}
                className={`gap-1 h-8 ${filterMode === "maintenance" ? "bg-warning hover:bg-warning/90 text-white border-0" : "hover:border-warning hover:text-warning"}`}
              >
                <Wrench className="w-3.5 h-3.5" />
                Maintenance
              </Button>
              <Button
                variant={filterMode === "available" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterMode("available")}
                className={`gap-1 h-8 ${filterMode === "available" ? "bg-primary hover:bg-primary/90 text-white border-0" : "hover:border-primary hover:text-primary"}`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Available
              </Button>

              {/* Utility Buttons */}
              <div className="ml-auto flex gap-2">
                <Button
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`gap-1 h-8 transition-all border-0 text-white ${isRefreshing ? "bg-primary/80 opacity-90" : "bg-primary hover:bg-primary/90"}`}
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </Button>
                <Button
                  size="sm"
                  onClick={handleExport}
                  className="gap-1 h-8 bg-slate-600 hover:bg-slate-700 text-white border-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </Button>
              </div>
            </div>

            {/* Filter Summary */}
            {(generalSearch || filterMode !== "all") && (
              <p className="text-xs text-muted-foreground">
                {filterMode !== "all" && <span className="font-medium">Filter: {filterMode.charAt(0).toUpperCase() + filterMode.slice(1)} • </span>}
                Found {filteredAssets.length} assets, {filteredDepartments.length} departments, {filteredCategories.filter((c) => filteredAssets.some((a) => a.category_id === c.id)).length} active categories
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="dashboard-grid dashboard-stats-grid">
          <StatCard title="Total Assets" value={dashboardStats.totalAssets} icon={Package} variant="primary" trend="+12 this month" />
          <StatCard title="Active Assets" value={dashboardStats.activeAssets} icon={Activity} variant="success" />
          <StatCard title="Under Maintenance" value={dashboardStats.underMaintenance} icon={Wrench} variant="accent" />
          <StatCard title="Open Faults" value={dashboardStats.openFaults} icon={AlertTriangle} variant="default" />
        </div>

        <div className="dashboard-grid dashboard-stats-grid">
          <StatCard title="Total Value" value={`UGX ${(dashboardStats.totalValue / 1000000).toFixed(1)}M`} icon={DollarSign} />
          <StatCard title="Departments" value={dashboardStats.departments} icon={Building2} />
          <StatCard title="Disposed" value={dashboardStats.disposed} icon={Package} />
          <StatCard title="Pending Assignments" value={dashboardStats.pendingAssignments} icon={ClipboardList} />
        </div>

        {/* Charts */}
        <div className="dashboard-grid dashboard-charts-grid">
          <div className="dashboard-card">
            <h3 className="dashboard-card-heading">Assets by Category</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2">
              {categoryData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {item.name}
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-card">
            <h3 className="dashboard-card-heading">Assets by Department</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(195,15%,88%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="assets" fill="hsl(174,62%,32%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Assets & Status Distribution */}
        <div className="dashboard-grid dashboard-charts-grid">
          {/* Top Assets by Value */}
          <div className="dashboard-card">
            <h3 className="dashboard-card-heading">Top Assets by Value</h3>
            <div className="space-y-3">
              {topValueAssets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No assets found</p>
              ) : (
                topValueAssets.map((asset, index) => (
                  <div key={asset.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xs font-bold bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{asset.asset_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{asset.asset_tag}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">UGX {(Number(asset.purchase_cost || 0) / 1000000).toFixed(1)}M</p>
                      <StatusBadge status={asset.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="dashboard-card">
            <h3 className="dashboard-card-heading">Asset Status Distribution</h3>
            <div className="space-y-2">
              {statusDistribution.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No data</p>
              ) : (
                statusDistribution.map(([status, count]) => {
                  const total = filteredAssets.length;
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize font-medium">{status}</span>
                        <span className="text-xs font-bold text-muted-foreground">{count} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Recent Faults */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="dashboard-card-heading">Recent Fault Reports</h3>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Search Bar */}
          <div className="mb-4 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by asset name, tag, description, priority, or status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-9 h-9 text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {filteredFaults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? "No fault reports found matching your search." : "No fault reports yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="dashboard-table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Asset</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFaults.map((f) => {
                    const asset = assets.find((a) => a.id === f.asset_id);
                    return (
                      <tr key={f.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                        <td className="py-3 px-3 font-medium">{asset?.asset_name}</td>
                        <td className="py-3 px-3 text-muted-foreground max-w-xs truncate">{f.description}</td>
                        <td className="py-3 px-3"><StatusBadge status={f.priority} /></td>
                        <td className="py-3 px-3"><StatusBadge status={f.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default Dashboard;