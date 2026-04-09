import {
  Package,
  Activity,
  Wrench,
  AlertTriangle,
  Building2,
  DollarSign,
  ClipboardList,
  TrendingUp,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { dashboardStats, assets, faultReports, departments, assetCategories } from "@/lib/mock-data";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const categoryData = assetCategories.map((cat) => ({
  name: cat.category_name,
  value: assets.filter((a) => a.category_id === cat.id).length,
}));

const deptData = departments.map((d) => ({
  name: d.department_name,
  assets: assets.filter((a) => a.department_id === d.id).length,
}));

const COLORS = ["hsl(174,62%,32%)", "hsl(38,92%,50%)", "hsl(200,25%,12%)", "hsl(152,60%,40%)", "hsl(200,15%,60%)"];

export default function Dashboard() {
  return (
    <div className="p-6">
      <PageHeader title="Dashboard" description="Mbale Regional Referral Hospital — Asset Overview" />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Assets" value={dashboardStats.totalAssets} icon={Package} variant="primary" trend="+12 this month" />
        <StatCard title="Active Assets" value={dashboardStats.activeAssets} icon={Activity} variant="success" />
        <StatCard title="Under Maintenance" value={dashboardStats.underMaintenance} icon={Wrench} variant="accent" />
        <StatCard title="Open Faults" value={dashboardStats.openFaults} icon={AlertTriangle} variant="default" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Value" value={`$${(dashboardStats.totalValue / 1000000).toFixed(1)}M`} icon={DollarSign} />
        <StatCard title="Departments" value={dashboardStats.departments} icon={Building2} />
        <StatCard title="Disposed" value={dashboardStats.disposed} icon={Package} />
        <StatCard title="Pending Assignments" value={dashboardStats.pendingAssignments} icon={ClipboardList} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Assets by Category</h3>
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

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Assets by Department</h3>
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

      {/* Recent Faults */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Recent Fault Reports</h3>
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Asset</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {faultReports.map((f) => {
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
      </div>
    </div>
  );
}
