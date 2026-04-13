import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2, MapPin, User, Phone, Search, Edit, Trash2, Download } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { departmentsAPI, assetsAPI } from "@/lib/api";

const initialDepartmentForm = {
  department_name: "",
  location: "",
  head_of_department: "",
  contact: "",
};

export default function Departments() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<any>(null);
  const [departmentForm, setDepartmentForm] = useState(initialDepartmentForm);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const queryClient = useQueryClient();

  const {
    data: departments = [],
    isLoading: departmentsLoading,
    error: departmentsError,
  } = useQuery({ queryKey: ["departments"], queryFn: departmentsAPI.getAll });

  const {
    data: assets = [],
    isLoading: assetsLoading,
    error: assetsError,
  } = useQuery({ queryKey: ["assets"], queryFn: assetsAPI.getAll });

  const createMutation = useMutation({
    mutationFn: (data: any) => departmentsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setIsDialogOpen(false);
      setEditingDepartment(null);
      setDepartmentForm(initialDepartmentForm);
    },
    onError: (error: any) => {
      alert(error.message || "Failed to create department");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => departmentsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setIsDialogOpen(false);
      setEditingDepartment(null);
      setDepartmentForm(initialDepartmentForm);
    },
    onError: (error: any) => {
      alert(error.message || "Failed to update department");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (error: any) => {
      alert(error.message || "Failed to delete department");
    },
  });

  const isLoading = departmentsLoading || assetsLoading;
  const error = departmentsError || assetsError;

  const filteredDepartments = useMemo(() => {
    const query = search.toLowerCase();
    return departments.filter((dept: any) =>
      dept.department_name.toLowerCase().includes(query) ||
      dept.location?.toLowerCase().includes(query) ||
      dept.head_of_department?.toLowerCase().includes(query) ||
      dept.contact?.toLowerCase().includes(query),
    );
  }, [departments, search]);

  const totalAssignedAssets = useMemo(() => assets.length, [assets]);
  const averageAssetsPerDepartment = departments.length ? Math.round(totalAssignedAssets / departments.length) : 0;
  const departmentsWithoutAssets = useMemo(() => {
    return departments.reduce((count: number, dept: any) => {
      const deptAssets = assets.filter((asset: any) => asset.department_id === dept.id);
      return count + (deptAssets.length === 0 ? 1 : 0);
    }, 0);
  }, [departments, assets]);

  const handleOpenCreate = () => {
    setEditingDepartment(null);
    setDepartmentForm(initialDepartmentForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (department: any) => {
    setEditingDepartment(department);
    setDepartmentForm({
      department_name: department.department_name || "",
      location: department.location || "",
      head_of_department: department.head_of_department || "",
      contact: department.contact || "",
    });
    setIsDialogOpen(true);
  };

  const handleSaveDepartment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!departmentForm.department_name.trim()) {
      alert("Department name is required");
      return;
    }

    if (editingDepartment) {
      updateMutation.mutate({ id: editingDepartment.id, data: departmentForm });
    } else {
      createMutation.mutate(departmentForm);
    }
  };

  const handleDeleteDepartment = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleExportExcel = () => {
    const headers = ["Department Name", "Location", "Head of Department", "Contact", "Assigned Assets"];
    const rows = filteredDepartments.map((dept: any) => {
      const deptAssets = assets.filter((asset: any) => asset.department_id === dept.id);
      return [
        dept.department_name || "",
        dept.location || "",
        dept.head_of_department || "",
        dept.contact || "",
        String(deptAssets.length),
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.setAttribute("download", `departments-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["departments"] }),
        queryClient.invalidateQueries({ queryKey: ["assets"] }),
      ]);
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["departments"] }),
        queryClient.refetchQueries({ queryKey: ["assets"] }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 md:p-6">
        <Alert>
          <AlertTitle>Loading departments</AlertTitle>
          <AlertDescription>Fetching department and asset information from the server.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 md:p-6">
        <Alert variant="destructive">
          <AlertTitle>Unable to load departments</AlertTitle>
          <AlertDescription>
            {String(error) || "There was a problem loading department data. Please refresh or try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 md:p-6">
      <PageHeader title="Departments" description="Hospital departments and their asset allocations">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" onClick={refreshData} disabled={isRefreshing}>
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" /> Add Department
          </Button>
        </div>
      </PageHeader>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDepartment ? "Edit Department" : "Create Department"}</DialogTitle>
            <DialogDescription>
              {editingDepartment
                ? "Update department details and save changes."
                : "Add a new department to the hospital inventory."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveDepartment} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Department Name *</label>
                <Input
                  value={departmentForm.department_name}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, department_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Location</label>
                <Input
                  value={departmentForm.location}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, location: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Head of Department</label>
                <Input
                  value={departmentForm.head_of_department}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, head_of_department: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Contact</label>
                <Input
                  value={departmentForm.contact}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, contact: e.target.value })}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 justify-end pt-4">
              <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingDepartment ? "Update Department" : "Create Department"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-emerald-700">Total departments</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-950">{departments.length}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-sm text-emerald-600">All departments currently tracked in the system.</p>
        </div>

        <div className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-sky-700">Assigned assets</p>
              <p className="mt-2 text-3xl font-semibold text-sky-950">{totalAssignedAssets}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 shadow-sm">
              <MapPin className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-sm text-sky-600">
            Total assets tied to departments across the facility. Average {averageAssetsPerDepartment} per department.
          </p>
        </div>

        <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-violet-700">Empty departments</p>
              <p className="mt-2 text-3xl font-semibold text-violet-950">{departmentsWithoutAssets}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 shadow-sm">
              <User className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-sm text-violet-600">Departments with no current asset assignments.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search departments..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Head of Department</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Assets</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          {filteredDepartments.length === 0 ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="p-8 text-center text-muted-foreground">
                  <Alert>
                    <AlertTitle>No departments found</AlertTitle>
                    <AlertDescription>
                      Try a different search term or clear the filter to see all departments.
                    </AlertDescription>
                  </Alert>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {filteredDepartments.map((dept: any) => {
                const deptAssets = assets.filter((a: any) => a.department_id === dept.id);
                return (
                  <TableRow key={dept.id} className="hover:bg-secondary/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{dept.department_name}</p>
                          <p className="text-xs text-muted-foreground">{deptAssets.length} assets</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{dept.location || "—"}</TableCell>
                    <TableCell>{dept.head_of_department || "—"}</TableCell>
                    <TableCell>{dept.contact || "—"}</TableCell>
                    <TableCell className="text-right font-medium">{deptAssets.length}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(dept)}>
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete department</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{dept.department_name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteDepartment(dept.id)}>
                              Confirm
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          )}
        </Table>
      </div>
    </div>
  );
}
