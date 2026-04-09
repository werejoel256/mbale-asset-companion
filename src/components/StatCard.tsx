import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "primary" | "accent" | "success";
}

const variantStyles = {
  default: "bg-card border border-border",
  primary: "bg-primary text-primary-foreground",
  accent: "bg-accent text-accent-foreground",
  success: "bg-success text-success-foreground",
};

const iconVariantStyles = {
  default: "bg-secondary text-primary",
  primary: "bg-primary-foreground/20 text-primary-foreground",
  accent: "bg-accent-foreground/20 text-accent-foreground",
  success: "bg-success-foreground/20 text-success-foreground",
};

export default function StatCard({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) {
  return (
    <div className={`rounded-xl p-5 animate-fade-in ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${variant === "default" ? "text-muted-foreground" : "opacity-80"}`}>
            {title}
          </p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${variant === "default" ? "text-success" : "opacity-70"}`}>{trend}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconVariantStyles[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
