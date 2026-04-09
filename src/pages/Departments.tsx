import PageHeader from "@/components/PageHeader";
import { departments, assets } from "@/lib/mock-data";
import { Building2, MapPin, User, Phone } from "lucide-react";

export default function Departments() {
  return (
    <div className="p-6">
      <PageHeader title="Departments" description="Hospital departments and their asset allocations" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map((dept) => {
          const deptAssets = assets.filter((a) => a.department_id === dept.id);
          return (
            <div key={dept.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer animate-fade-in">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{dept.department_name}</h3>
                  <p className="text-xs text-muted-foreground">{deptAssets.length} assets assigned</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" /> {dept.location}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-3.5 h-3.5" /> {dept.head_of_department}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" /> {dept.contact}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
