import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usersAPI, departmentsAPI } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import "./css/User.css";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "asset_manager", label: "Asset Manager" },
  { value: "technician", label: "Technician" },
  { value: "department_head", label: "Department Head" },
  { value: "staff", label: "Staff" },
];

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    phone_number: "",
    role_id: "staff",
    department_id: "",
  });

  // ── Queries ──────────────────────────────────────────────────
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ["users"],
    queryFn: usersAPI.getAll,
  });

  const { data: departments = [], isLoading: departmentsLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: departmentsAPI.getAll,
  });

  // ── Mutations ────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: any) => usersAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      alert(error.message || "Failed to create user");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => usersAPI.update(editingUser.user_id, {
      full_name: data.full_name,
      phone_number: data.phone_number,
      role_id: data.role_id,
      department_id: data.department_id,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      alert(error.message || "Failed to update user");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => usersAPI.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      alert(error.message || "Failed to delete user");
    },
  });

  // ── Handlers ─────────────────────────────────────────────────
  const resetForm = () => {
    setFormData({
      full_name: "", username: "", email: "", password: "",
      phone_number: "", role_id: "staff", department_id: "",
    });
    setEditingUser(null);
  };

  const handleCreateClick = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEditClick = (user: any) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      username: user.username || "",
      email: user.email || "",
      password: "",
      phone_number: user.phone_number || "",
      role_id: user.role_id || "staff",
      department_id: user.department_id || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateMutation.mutate(formData);
    } else {
      if (!formData.password) {
        alert("Password is required for new users");
        return;
      }
      createMutation.mutate(formData);
    }
  };

  const handleDeleteClick = (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteMutation.mutate(userId);
    }
  };

  //Loading / error states 
  if (usersLoading || departmentsLoading) {
    return <div className="px-4 sm:px-6 md:p-6">Loading users...</div>;
  }
  if (usersError) {
    return <div className="px-4 sm:px-6 md:p-6 text-destructive">Failed to load users.</div>;
  }

  //  Render
  return (
    <div className="users-page">
      <PageHeader title="Users" description="Manage system users and roles">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateClick} className="gap-2">
              <Plus className="w-4 h-4" /> Add User
            </Button>
          </DialogTrigger>

          <DialogContent className="users-dialog-content max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Edit User" : "Create New User"}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Update user information"
                  : "Add a new user to the system"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full name */}
              <div className="users-form-group">
                <label className="users-form-label">Full Name *</label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>

              {/* Create-only fields */}
              {!editingUser && (
                <>
                  <div className="users-form-group">
                    <label className="users-form-label">Username *</label>
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="users-form-group">
                    <label className="users-form-label">Email *</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="users-form-group">
                    <label className="users-form-label">Password *</label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}

              {/* Phone */}
              <div className="users-form-group">
                <label className="users-form-label">Phone Number</label>
                <Input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>

              {/* Role */}
              <div className="users-form-group">
                <label className="users-form-label">Role *</label>
                <select
                  className="users-form-select"
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div className="users-form-group">
                <label className="users-form-label">Department</label>
                <select
                  className="users-form-select"
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                >
                  <option value="">Select a department</option>
                  {departments.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit row */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving…"
                    : "Save"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* ── Users table ── */}
      <div className="users-table-card">
        <div className="users-table-scroll">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Username</th>
                <th>Role</th>
                <th>Department</th>
                <th>Phone</th>
                <th>Status</th>
                <th className="align-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="users-empty">No users found.</div>
                  </td>
                </tr>
              ) : (
                users.map((user: any) => (
                  <tr key={user.user_id}>
                    <td className="cell-name">{user.full_name}</td>
                    <td className="cell-email">{user.email}</td>
                    <td>
                      <span className="cell-mono">{user.username}</span>
                    </td>
                    <td>
                      <span
                        className="role-pill"
                        data-role={user.role_id}
                      >
                        {user.role_id?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="cell-dept">{user.department_name || "—"}</td>
                    <td className="cell-phone">{user.phone_number || "—"}</td>
                    <td>
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="cell-actions">
                      <div className="users-actions">
                        <button
                          className="users-action-btn edit"
                          onClick={() => handleEditClick(user)}
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="users-action-btn delete"
                          onClick={() => handleDeleteClick(user.user_id)}
                          disabled={deleteMutation.isPending}
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}