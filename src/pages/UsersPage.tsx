import PageHeader from "@/components/PageHeader";
import { Users } from "lucide-react";

export default function UsersPage() {
  return (
    <div className="p-6">
      <PageHeader title="Users" description="Manage system users and roles" />
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">User management will appear here</p>
      </div>
    </div>
  );
}
