import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Search, Download, AlertTriangle, Clock, CheckCircle, User } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { faultReportsAPI, assetsAPI, usersAPI } from "@/lib/api";

const initialFaultForm = {
  asset_id: "",
  description: "",
  priority: "medium",
  report_date: "",
  reported_by: "",
  status: "reported",
  assigned_to: "",
  resolution_notes: "",
};

export default function FaultReports() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFault, setEditingFault] = useState<any>(null);
  const [faultForm, setFaultForm] = useState(initialFaultForm);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const queryClient = useQueryClient();

  const {
    data: faultReports = [],
    isLoading: faultsLoading,
    error: faultsError,
  } = useQuery({ queryKey: ["faultReports"], queryFn: faultReportsAPI.getAll });

  const {
    data: assets = [],
    isLoading: assetsLoading,
  } = useQuery({ queryKey: ["assets"], queryFn: assetsAPI.getAll });

  const {
    data: users = [],
    isLoading: usersLoading,
  } = useQuery({ queryKey: ["users"], queryFn: usersAPI.getAll });

  const isLoading = faultsLoading || assetsLoading || usersLoading;
  const error = faultsError;

  // Mutations
  const createMutation = useMutation({
    mutationFn: faultReportsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faultReports"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setIsDialogOpen(false);
      setFaultForm(initialFaultForm);
      setFormErrors({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => faultReportsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faultReports"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setIsDialogOpen(false);
      setEditingFault(null);
      setFaultForm(initialFaultForm);
      setFormErrors({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: faultReportsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faultReports"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });

  // Helper functions
  const refreshData = () => {
    setIsRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ["faultReports"] });
    queryClient.invalidateQueries({ queryKey: ["assets"] });
    queryClient.invalidateQueries({ queryKey: ["users"] });
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const filteredReports = useMemo(() => {
    return faultReports.filter((report: any) => {
      const asset = assets.find((a: any) => a.id === report.asset_id);
      const searchLower = search.toLowerCase();
      return (
        asset?.asset_name?.toLowerCase().includes(searchLower) ||
        report.description?.toLowerCase().includes(searchLower) ||
        report.priority?.toLowerCase().includes(searchLower) ||
        report.status?.toLowerCase().includes(searchLower) ||
        report.reported_by?.toLowerCase().includes(searchLower)
      );
    });
  }, [faultReports, assets, search]);

  // Analytics
  const analytics = useMemo(() => {
    const totalReports = faultReports.length;
    const openReports = faultReports.filter((r: any) => r.status === "reported" || r.status === "investigating").length;
    const resolvedReports = faultReports.filter((r: any) => r.status === "resolved").length;
    const highPriorityReports = faultReports.filter((r: any) => r.priority === "high" || r.priority === "critical").length;

    const priorityBreakdown = faultReports.reduce((acc: {[key: string]: number}, report: any) => {
      acc[report.priority] = (acc[report.priority] || 0) + 1;
      return acc;
    }, {});

    const statusBreakdown = faultReports.reduce((acc: {[key: string]: number}, report: any) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    }, {});

    return {
      totalReports,
      openReports,
      resolvedReports,
      highPriorityReports,
      priorityBreakdown,
      statusBreakdown,
    };
  }, [faultReports]);

  const handleOpenCreate = () => {
    setEditingFault(null);
    setFaultForm(initialFaultForm);
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (fault: any) => {
    setEditingFault(fault);
    setFaultForm({
      asset_id: fault.asset_id || "",
      description: fault.description || "",
      priority: fault.priority || "medium",
      report_date: fault.report_date || "",
      reported_by: fault.reported_by || "",
      status: fault.status || "reported",
      assigned_to: fault.assigned_to || "",
      resolution_notes: fault.resolution_notes || "",
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!faultForm.asset_id.trim()) {
      errors.asset_id = "Asset is required";
    }

    if (!faultForm.description.trim()) {
      errors.description = "Description is required";
    }

    if (!faultForm.reported_by.trim()) {
      errors.reported_by = "Reporter is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveFault = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (editingFault) {
      updateMutation.mutate({ id: editingFault.id, data: faultForm });
    } else {
      createMutation.mutate(faultForm);
    }
  };

  const handleDeleteFault = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleExportExcel = () => {
    const headers = ["Asset", "Description", "Priority", "Status", "Reported By", "Report Date", "Assigned To"];
    const rows = filteredReports.map((r: any) => {
      const asset = assets.find((a: any) => a.id === r.asset_id);
      const assignedUser = users.find((u: any) => u.id === r.assigned_to);
      return [
        asset?.asset_name || "",
        r.description || "",
        r.priority || "",
        r.status || "",
        r.reported_by || "",
        r.report_date || "",
        assignedUser?.username || "",
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fault_reports.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="px-4 sm:px-6 md:p-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {String(error) || "There was a problem loading fault reports. Please refresh or try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 md:p-6">
      <PageHeader title="Fault Reports" description="Report and track asset faults">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" onClick={refreshData} disabled={isRefreshing}>
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" /> Report Fault
          </Button>
        </div>
      </PageHeader>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics.totalReports}</div>
            <p className="text-xs text-muted-foreground">Fault reports</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Reports</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{analytics.openReports}</div>
            <p className="text-xs text-muted-foreground">Awaiting resolution</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{analytics.resolvedReports}</div>
            <p className="text-xs text-muted-foreground">Successfully resolved</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <User className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics.highPriorityReports}</div>
            <p className="text-xs text-muted-foreground">Critical/High priority</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search fault reports..."
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
              <TableHead>Description</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reported By</TableHead>
              <TableHead>Report Date</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.map((r: any) => {
              const asset = assets.find((a: any) => a.id === r.asset_id);
              const assignedUser = users.find((u: any) => u.id === r.assigned_to);
              const isHighPriority = r.priority === "high" || r.priority === "critical";
              const isOpen = r.status === "reported" || r.status === "investigating";

              return (
                <TableRow
                  key={r.id}
                  className={`${isHighPriority ? "bg-red-50/50 border-l-4 border-l-red-400" : ""} ${isOpen && !isHighPriority ? "bg-orange-50/30" : ""}`}
                >
                  <TableCell className="font-medium">{asset?.asset_name}</TableCell>
                  <TableCell className="max-w-xs truncate">{r.description}</TableCell>
                  <TableCell><StatusBadge status={r.priority} /></TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell>{r.reported_by}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(r.report_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{assignedUser?.username || "Unassigned"}</TableCell>
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
                            <AlertDialogTitle>Delete Fault Report</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this fault report? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteFault(r.id)}>
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
            <DialogTitle>{editingFault ? "Edit Fault Report" : "Report New Fault"}</DialogTitle>
            <DialogDescription>
              {editingFault
                ? "Update fault report details and save changes."
                : "Report a fault with an asset for resolution."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveFault} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Asset *</label>
              <Select
                value={faultForm.asset_id}
                onValueChange={(value) => {
                  setFaultForm({ ...faultForm, asset_id: value });
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
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Description *</label>
              <Textarea
                value={faultForm.description}
                onChange={(e) => {
                  setFaultForm({ ...faultForm, description: e.target.value });
                  if (formErrors.description) {
                    setFormErrors({ ...formErrors, description: "" });
                  }
                }}
                placeholder="Describe the fault in detail..."
                className={formErrors.description ? "border-red-500" : ""}
                rows={3}
              />
              {formErrors.description && <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Priority</label>
              <Select
                value={faultForm.priority}
                onValueChange={(value) => setFaultForm({ ...faultForm, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Reported By *</label>
              <Input
                value={faultForm.reported_by}
                onChange={(e) => {
                  setFaultForm({ ...faultForm, reported_by: e.target.value });
                  if (formErrors.reported_by) {
                    setFormErrors({ ...formErrors, reported_by: "" });
                  }
                }}
                placeholder="Your name or identifier"
                className={formErrors.reported_by ? "border-red-500" : ""}
              />
              {formErrors.reported_by && <p className="mt-1 text-sm text-red-500">{formErrors.reported_by}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Report Date</label>
              <Input
                type="date"
                value={faultForm.report_date}
                onChange={(e) => setFaultForm({ ...faultForm, report_date: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Assign To</label>
              <Select
                value={faultForm.assigned_to}
                onValueChange={(value) => setFaultForm({ ...faultForm, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select technician" />
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
                value={faultForm.status}
                onValueChange={(value) => setFaultForm({ ...faultForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reported">Reported</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {faultForm.status === "resolved" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Resolution Notes</label>
                <Textarea
                  value={faultForm.resolution_notes}
                  onChange={(e) => setFaultForm({ ...faultForm, resolution_notes: e.target.value })}
                  placeholder="Describe how the fault was resolved..."
                  rows={2}
                />
              </div>
            )}

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
