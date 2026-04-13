import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2, MapPin, User, Phone, Search, Edit, Trash2, Download, RefreshCw } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { departmentsAPI, assetsAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      dept.department_name?.toLowerCase().includes(query) ||
      dept.location?.toLowerCase().includes(query) ||
      dept.head_of_department?.toLowerCase().includes(query) ||
      dept.contact?.toLowerCase().includes(query)
    );
  }, [departments, search]);

  const totalAssignedAssets = useMemo(() => assets.length, [assets]);
  const averageAssetsPerDepartment = departments.length 
    ? Math.round(totalAssignedAssets / departments.length) 
    : 0;

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
    <div className="px-4 sm:px-6 md:p-6 space-y-6">
      <PageHeader 
        title="Departments" 
        description="Manage hospital departments and track their asset allocations"
      >
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={refreshData} 
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button size="sm" onClick={handleOpenCreate} className="gap-2">
            <Plus className="w-4 h-4" /> New Department
          </Button>
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6 border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Total Departments</p>
              <p className="text-4xl font-bold text-emerald-950 mt-3">{departments.length}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
          <p className="text-xs text-emerald-600 mt-4">Registered in the system</p>
        </Card>

        <Card className="p-6 border-sky-200 bg-gradient-to-br from-sky-50 via-white to-white hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-sky-600">Total Assigned Assets</p>
              <p className="text-4xl font-bold text-sky-950 mt-3">{totalAssignedAssets}</p>
              <p className="text-sm text-sky-600 mt-1">
                Avg: <span className="font-semibold">{averageAssetsPerDepartment}</span> per department
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600">
              <MapPin className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-violet-200 bg-gradient-to-br from-violet-50 via-white to-white hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-violet-600">Empty Departments</p>
              <p className="text-4xl font-bold text-violet-950 mt-3">{departmentsWithoutAssets}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600">
              <User className="h-6 w-6" />
            </div>
          </div>
          <p className="text-xs text-violet-600 mt-4">No assets assigned yet</p>
        </Card>
      </div>

      {/* Search and Table */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-11 h-11 bg-white"
            placeholder="Search by department, location, head, or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-semibold">Department</TableHead>
              <TableHead className="font-semibold">Location</TableHead>
              <TableHead className="font-semibold">Head of Department</TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="text-right font-semibold">Assets</TableHead>
              <TableHead className="text-right font-semibold w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>

          {filteredDepartments.length === 0 ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Building2 className="h-12 w-12 mb-4 opacity-40" />
                    <p className="text-lg font-medium">No departments found</p>
                    <p className="text-sm mt-1">Try adjusting your search term</p>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {filteredDepartments.map((dept: any) => {
                const deptAssets = assets.filter((a: any) => a.department_id === dept.id);
                const assetCount = deptAssets.length;

                return (
                  <TableRow key={dept.id} className="hover:bg-muted/50 transition-colors group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-base">{dept.department_name}</p>
                          {assetCount > 0 && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {assetCount} assets
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {dept.location || <span className="italic">Not specified</span>}
                    </TableCell>
                    <TableCell>{dept.head_of_department || "—"}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {dept.contact || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold ${assetCount === 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {assetCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(dept)}
                          className="h-9 w-9 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Department</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to permanently delete{" "}
                                <span className="font-medium">"{dept.department_name}"</span>? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteDepartment(dept.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete Department
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          )}
        </Table>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? "Edit Department" : "Create New Department"}
            </DialogTitle>
            <DialogDescription>
              {editingDepartment 
                ? "Update the department information below." 
                : "Add a new department to the hospital system."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveDepartment} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Department Name <span className="text-destructive">*</span></label>
                <Input
                  value={departmentForm.department_name}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, department_name: e.target.value })}
                  placeholder="e.g. Radiology"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={departmentForm.location}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, location: e.target.value })}
                  placeholder="e.g. Ground Floor, Block A"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Head of Department</label>
                <Input
                  value={departmentForm.head_of_department}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, head_of_department: e.target.value })}
                  placeholder="Dr. John Smith"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Number</label>
                <Input
                  value={departmentForm.contact}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, contact: e.target.value })}
                  placeholder="+256 700 123 456"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingDepartment ? "Update Department" : "Create Department"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}