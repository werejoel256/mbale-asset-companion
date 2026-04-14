import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Search, Download, Wrench, Calendar, DollarSign, TrendingUp } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { maintenanceAPI, assetsAPI, usersAPI } from "@/lib/api";

const initialMaintenanceForm = {
  asset_id: "",
  maintenance_date: "",
  maintenance_type: "",
  description: "",
  cost: "",
  technician_id: "",
  status: "scheduled",
};

export default function Maintenance() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<any>(null);
  const [maintenanceForm, setMaintenanceForm] = useState(initialMaintenanceForm);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const queryClient = useQueryClient();

  const {
    data: maintenanceRecords = [],
    isLoading: maintenanceLoading,
    error: maintenanceError,
  } = useQuery({ queryKey: ["maintenance"], queryFn: maintenanceAPI.getAll });

  const {
    data: assets = [],
    isLoading: assetsLoading,
  } = useQuery({ queryKey: ["assets"], queryFn: assetsAPI.getAll });

  const {
    data: users = [],
    isLoading: usersLoading,
  } = useQuery({ queryKey: ["users"], queryFn: usersAPI.getAll });

  const isLoading = maintenanceLoading || assetsLoading || usersLoading;
  const error = maintenanceError;

  // Mutations
  const createMutation = useMutation({
    mutationFn: maintenanceAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setIsDialogOpen(false);
      setMaintenanceForm(initialMaintenanceForm);
      setFormErrors({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => maintenanceAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setIsDialogOpen(false);
      setEditingMaintenance(null);
      setMaintenanceForm(initialMaintenanceForm);
      setFormErrors({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: maintenanceAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });

  // Helper functions
  const refreshData = () => {
    setIsRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ["maintenance"] });
    queryClient.invalidateQueries({ queryKey: ["assets"] });
    queryClient.invalidateQueries({ queryKey: ["users"] });
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const filteredRecords = useMemo(() => {
    return maintenanceRecords.filter((record: any) => {
      const asset = assets.find((a: any) => a.id === record.asset_id);
      const searchLower = search.toLowerCase();
      return (
        asset?.asset_name?.toLowerCase().includes(searchLower) ||
        record.maintenance_type?.toLowerCase().includes(searchLower) ||
        record.description?.toLowerCase().includes(searchLower) ||
        record.status?.toLowerCase().includes(searchLower)
      );
    });
  }, [maintenanceRecords, assets, search]);

  // Analytics
  const analytics = useMemo(() => {
    const totalCost = maintenanceRecords.reduce((sum: number, record: any) => sum + Number(record.cost || 0), 0);
    const completedRecords = maintenanceRecords.filter((r: any) => r.status === "completed").length;
    const scheduledRecords = maintenanceRecords.filter((r: any) => r.status === "scheduled").length;
    const inProgressRecords = maintenanceRecords.filter((r: any) => r.status === "in_progress").length;

    const maintenanceTypes = maintenanceRecords.reduce((acc: {[key: string]: number}, record: any) => {
      acc[record.maintenance_type] = (acc[record.maintenance_type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalCost,
      completedRecords,
      scheduledRecords,
      inProgressRecords,
      maintenanceTypes,
      totalRecords: maintenanceRecords.length,
    };
  }, [maintenanceRecords]);

  const handleOpenCreate = () => {
    setEditingMaintenance(null);
    setMaintenanceForm(initialMaintenanceForm);
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (maintenance: any) => {
    setEditingMaintenance(maintenance);
    setMaintenanceForm({
      asset_id: maintenance.asset_id || "",
      maintenance_date: maintenance.maintenance_date || "",
      maintenance_type: maintenance.maintenance_type || "",
      description: maintenance.description || "",
      cost: maintenance.cost || "",
      technician_id: maintenance.technician_id || "",
      status: maintenance.status || "scheduled",
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!maintenanceForm.asset_id.trim()) {
      errors.asset_id = "Asset is required";
    }

    if (!maintenanceForm.maintenance_type.trim()) {
      errors.maintenance_type = "Maintenance type is required";
    }

    if (!maintenanceForm.description.trim()) {
      errors.description = "Description is required";
    }

    if (!maintenanceForm.cost.trim() || isNaN(Number(maintenanceForm.cost))) {
      errors.cost = "Valid cost is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveMaintenance = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const formData = {
      ...maintenanceForm,
      cost: Number(maintenanceForm.cost),
    };

    if (editingMaintenance) {
      updateMutation.mutate({ id: editingMaintenance.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDeleteMaintenance = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleExportExcel = () => {
    const headers = ["Asset", "Type", "Date", "Description", "Cost", "Technician", "Status"];
    const rows = filteredRecords.map((r: any) => {
      const asset = assets.find((a: any) => a.id === r.asset_id);
      const technician = users.find((u: any) => u.id === r.technician_id);
      return [
        asset?.asset_name || "",
        r.maintenance_type || "",
        r.maintenance_date || "",
        r.description || "",
        r.cost || "",
        technician?.username || "",
        r.status || "",
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "maintenance_records.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="px-4 sm:px-6 md:p-6">
      <PageHeader title="Maintenance Records" description="Track all maintenance activities">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" onClick={refreshData} disabled={isRefreshing}>
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" /> New Record
          </Button>
        </div>
      </PageHeader>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Wrench className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analytics.totalRecords}</div>
            <p className="text-xs text-muted-foreground">Maintenance records</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">UGX {analytics.totalCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Maintenance expenses</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{analytics.completedRecords}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{analytics.inProgressRecords}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search maintenance records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.map((r: any) => {
              const asset = assets.find((a: any) => a.id === r.asset_id);
              const technician = users.find((u: any) => u.id === r.technician_id);
              const getRowColor = () => {
                switch (r.status) {
                  case "completed": return "bg-emerald-50/30 border-l-4 border-l-emerald-400";
                  case "in_progress": return "bg-blue-50/30 border-l-4 border-l-blue-400";
                  case "scheduled": return "bg-amber-50/30 border-l-4 border-l-amber-400";
                  case "cancelled": return "bg-gray-50/30 border-l-4 border-l-gray-400";
                  default: return "";
                }
              };

              return (
                <TableRow key={r.id} className={getRowColor()}>
                  <TableCell className="font-medium">{asset?.asset_name}</TableCell>
                  <TableCell><StatusBadge status={r.maintenance_type} /></TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(r.maintenance_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{r.description}</TableCell>
                  <TableCell className="font-medium">UGX {Number(r.cost).toLocaleString()}</TableCell>
                  <TableCell>{technician?.username || "Unassigned"}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(r)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Maintenance Record</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this maintenance record? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteMaintenance(r.id)}>
                              Delete
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
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMaintenance ? "Edit Maintenance Record" : "Create Maintenance Record"}</DialogTitle>
            <DialogDescription>
              {editingMaintenance
                ? "Update maintenance details and save changes."
                : "Record maintenance activity for an asset."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveMaintenance} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Asset *</label>
              <Select
                value={maintenanceForm.asset_id}
                onValueChange={(value) => {
                  setMaintenanceForm({ ...maintenanceForm, asset_id: value });
                  if (formErrors.asset_id) {
                    setFormErrors({ ...formErrors, asset_id: "" });
                  }
                }}
              >
                <SelectTrigger className={formErrors.asset_id ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select an asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset: any) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.asset_name} ({asset.asset_tag})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.asset_id && <p className="mt-1 text-sm text-red-500">{formErrors.asset_id}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Maintenance Type *</label>
              <Select
                value={maintenanceForm.maintenance_type}
                onValueChange={(value) => {
                  setMaintenanceForm({ ...maintenanceForm, maintenance_type: value });
                  if (formErrors.maintenance_type) {
                    setFormErrors({ ...formErrors, maintenance_type: "" });
                  }
                }}
              >
                <SelectTrigger className={formErrors.maintenance_type ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select maintenance type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventive">Preventive</SelectItem>
                  <SelectItem value="corrective">Corrective</SelectItem>
                  <SelectItem value="predictive">Predictive</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.maintenance_type && <p className="mt-1 text-sm text-red-500">{formErrors.maintenance_type}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Maintenance Date</label>
              <Input
                type="date"
                value={maintenanceForm.maintenance_date}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, maintenance_date: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Description *</label>
              <Input
                value={maintenanceForm.description}
                onChange={(e) => {
                  setMaintenanceForm({ ...maintenanceForm, description: e.target.value });
                  if (formErrors.description) {
                    setFormErrors({ ...formErrors, description: "" });
                  }
                }}
                placeholder="Describe the maintenance work..."
                className={formErrors.description ? "border-red-500" : ""}
              />
              {formErrors.description && <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Cost (UGX) *</label>
              <Input
                type="number"
                value={maintenanceForm.cost}
                onChange={(e) => {
                  setMaintenanceForm({ ...maintenanceForm, cost: e.target.value });
                  if (formErrors.cost) {
                    setFormErrors({ ...formErrors, cost: "" });
                  }
                }}
                placeholder="Enter maintenance cost"
                className={formErrors.cost ? "border-red-500" : ""}
              />
              {formErrors.cost && <p className="mt-1 text-sm text-red-500">{formErrors.cost}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Technician</label>
              <Select
                value={maintenanceForm.technician_id}
                onValueChange={(value) => setMaintenanceForm({ ...maintenanceForm, technician_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a technician" />
                </SelectTrigger>
                <SelectContent>
                  {users.filter((user: any) => user.role === "technician" || user.role === "admin").map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Status</label>
              <Select
                value={maintenanceForm.status}
                onValueChange={(value) => setMaintenanceForm({ ...maintenanceForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
