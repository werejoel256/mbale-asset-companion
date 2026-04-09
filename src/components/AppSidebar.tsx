import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Building2,
  Wrench,
  AlertTriangle,
  Users,
  Truck,
  ClipboardList,
  ArrowLeftRight,
  Trash2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/assets", label: "Assets", icon: Package },
  { path: "/departments", label: "Departments", icon: Building2 },
  { path: "/maintenance", label: "Maintenance", icon: Wrench },
  { path: "/faults", label: "Fault Reports", icon: AlertTriangle },
  { path: "/assignments", label: "Assignments", icon: ClipboardList },
  { path: "/movements", label: "Movements", icon: ArrowLeftRight },
  { path: "/disposals", label: "Disposals", icon: Trash2 },
  { path: "/suppliers", label: "Suppliers", icon: Truck },
  { path: "/users", label: "Users", icon: Users },
];

export default function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 z-50 ${
        collapsed ? "w-[68px]" : "w-[250px]"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
          <Activity className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold tracking-tight text-sidebar-foreground leading-tight">MRRH</h1>
            <p className="text-[10px] text-sidebar-muted leading-tight">Asset Management</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-sidebar-primary" : ""}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all w-full"
        >
          {collapsed ? <ChevronRight className="w-[18px] h-[18px]" /> : <ChevronLeft className="w-[18px] h-[18px]" />}
          {!collapsed && <span>Collapse</span>}
        </button>
        <Link
          to="/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all w-full"
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && <span>Log Out</span>}
        </Link>
      </div>
    </aside>
  );
}
