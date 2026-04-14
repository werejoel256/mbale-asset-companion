import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ClipboardList, Edit, Trash2, Search, Download } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { assignmentsAPI, assetsAPI, usersAPI, departmentsAPI } from "@/lib/api";

const initialAssignmentForm = {
  asset_id: "",
  assigned_to: "",
  department_id: "",
  status: "active",
};

export default function Assignments() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [assignmentForm, setAssignmentForm] = useState(initialAssignmentForm);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const queryClient = useQueryClient();

  const {
    data: assignments = [],
    isLoading: assignmentsLoading,
    error: assignmentsError,
  } = useQuery({ queryKey: ["assignments"], queryFn: assignmentsAPI.getAll });

  const {
    data: assets = [],
    isLoading: assetsLoading,
  } = useQuery({ queryKey: ["assets"], queryFn: assetsAPI.getAll });

  const {
    data: users = [],
    isLoading: usersLoading,
  } = useQuery({ queryKey: ["users"], queryFn: usersAPI.getAll });

  const {
    data: departments = [],
    isLoading: departmentsLoading,
  } = useQuery({ queryKey: ["departments"], queryFn: departmentsAPI.getAll });

  const isLoading = assignmentsLoading || assetsLoading || usersLoading || departmentsLoading;
  const error = assignmentsError;

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Create the assignment first
      const assignment = await assignmentsAPI.create(data);

      // If assignment is active, update asset status to "assigned"
      if (data.status === "active") {
        await assetsAPI.update(data.asset_id, { status: "assigned" });
      }

      return assignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setIsDialogOpen(false);
      setEditingAssignment(null);
      setAssignmentForm(initialAssignmentForm);
    },
    onError: (error: any) => {
      alert(error.message || "Failed to create assignment");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      // Get the current assignment to check status change
      const currentAssignment = assignments.find(a => a.id === id);

      // Update the assignment
      const assignment = await assignmentsAPI.update(id, data);

      // Update asset status based on new assignment status
      if (data.status === "active") {
        await assetsAPI.update(data.asset_id, { status: "assigned" });
      } else if (data.status === "returned") {
        await assetsAPI.update(data.asset_id, { status: "available" });
      } else if (data.status === "lost") {
        await assetsAPI.update(data.asset_id, { status: "lost" });
      }

      return assignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setIsDialogOpen(false);
      setEditingAssignment(null);
      setAssignmentForm(initialAssignmentForm);
    },
    onError: (error: any) => {
      alert(error.message || "Failed to update assignment");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Get the assignment before deleting to know which asset to update
      const assignment = assignments.find(a => a.id === id);

      // Delete the assignment
      await assignmentsAPI.delete(id);

      // Set asset status back to available
      if (assignment) {
        await assetsAPI.update(assignment.asset_id, { status: "available" });
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (error: any) => {
      alert(error.message || "Failed to delete assignment");
    },
  });

  const filteredAssignments = useMemo(() => {
    const query = search.toLowerCase();
    return assignments.filter((a: any) => {
      const asset = assets.find((ast: any) => ast.id === a.asset_id);
      const user = users.find((u: any) => u.user_id === a.assigned_to);
      return (
        asset?.asset_name?.toLowerCase().includes(query) ||
        asset?.asset_tag?.toLowerCase().includes(query) ||
        user?.username?.toLowerCase().includes(query) ||
        user?.email?.toLowerCase().includes(query)
      );
    });
  }, [assignments, assets, users, search]);

  const totalAssignments = assignments.length;
  const activeAssignments = assignments.filter((a: any) => a.status === "active").length;
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case "returned":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Returned</Badge>;
      case "lost":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Lost</Badge>;
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>;
    }
  };

  const handleOpenCreate = () => {
    setEditingAssignment(null);
    setAssignmentForm(initialAssignmentForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (assignment: any) => {
    setEditingAssignment(assignment);
    setAssignmentForm({
      asset_id: assignment.asset_id || "",
      assigned_to: assignment.assigned_to || "",
      department_id: assignment.department_id || "",
      status: assignment.status || "active",
    });
    setIsDialogOpen(true);
  };

  const handleSaveAssignment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!assignmentForm.asset_id.trim() || !assignmentForm.assigned_to.trim()) {
      alert("Asset and assigned user are required");
      return;
    }

    if (editingAssignment) {
      updateMutation.mutate({ id: editingAssignment.id, data: assignmentForm });
    } else {
      createMutation.mutate(assignmentForm);
    }
  };

  const handleDeleteAssignment = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleExportExcel = () => {
    const headers = ["Asset", "Asset Tag", "Assigned To", "Assigned Date", "Status"];
    const rows = filteredAssignments.map((a: any) => {
      const asset = assets.find((ast: any) => ast.id === a.asset_id);
      const user = users.find((u: any) => u.user_id === a.assigned_to);
      return [
        asset?.asset_name || "",
        asset?.asset_tag || "",
        user?.username || "",
        a.assigned_date || "",
        a.status || "",
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.setAttribute("download", `assignments-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["assignments"] }),
        queryClient.invalidateQueries({ queryKey: ["assets"] }),
        queryClient.invalidateQueries({ queryKey: ["users"] }),
        queryClient.invalidateQueries({ queryKey: ["departments"] }),
      ]);
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["assignments"] }),
        queryClient.refetchQueries({ queryKey: ["assets"] }),
        queryClient.refetchQueries({ queryKey: ["users"] }),
        queryClient.refetchQueries({ queryKey: ["departments"] }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 md:p-6">
        <Alert>
          <AlertTitle>Loading assignments</AlertTitle>
          <AlertDescription>Fetching assignment records from the server.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 md:p-6">
        <Alert variant="destructive">
          <AlertTitle>Unable to load assignments</AlertTitle>
          <AlertDescription>
            {String(error) || "There was a problem loading assignment data. Please refresh or try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 md:p-6">
      <PageHeader title="Asset Assignments" description="Track asset assignments to staff and departments">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" onClick={refreshData} disabled={isRefreshing}>
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" /> New Assignment
          </Button>
        </div>
      </PageHeader>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAssignment ? "Edit Assignment" : "Create Assignment"}</DialogTitle>
            <DialogDescription>
              {editingAssignment
                ? "Update assignment details and save changes."
                : "Assign an asset to a staff member or department."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveAssignment} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Asset *</label>
              <Select value={assignmentForm.asset_id} onValueChange={(value) => setAssignmentForm({ ...assignmentForm, asset_id: value })}>
                <SelectTrigger>
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
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Assigned To *</label>
              <Select value={assignmentForm.assigned_to} onValueChange={(value) => setAssignmentForm({ ...assignmentForm, assigned_to: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: any) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.username} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Department</label>
              <Select value={assignmentForm.department_id} onValueChange={(value) => setAssignmentForm({ ...assignmentForm, department_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a department (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.department_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Status</label>
              <Select value={assignmentForm.status} onValueChange={(value) => setAssignmentForm({ ...assignmentForm, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-3 justify-end pt-4">
              <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingAssignment ? "Update Assignment" : "Create Assignment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-emerald-700">Total assignments</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-950">{totalAssignments}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-sm">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-sm text-emerald-600">All asset assignments in the system.</p>
        </div>

        <div className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-sky-700">Active assignments</p>
              <p className="mt-2 text-3xl font-semibold text-sky-950">{activeAssignments}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 shadow-sm">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-sm text-sky-600">Assets currently assigned to staff.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search assignments..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Assigned Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          {filteredAssignments.length === 0 ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="p-8 text-center text-muted-foreground">
                  <Alert>
                    <AlertTitle>No assignments found</AlertTitle>
                    <AlertDescription>
                      Try a different search term or create a new assignment to get started.
                    </AlertDescription>
                  </Alert>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {filteredAssignments.map((assignment: any) => {
                const asset = assets.find((a: any) => a.id === assignment.asset_id);
                const user = users.find((u: any) => u.user_id === assignment.assigned_to);
                return (
                  <TableRow key={assignment.id} className="hover:bg-secondary/50">
                    <TableCell>
                      <div>
                        <p className="font-semibold">{asset?.asset_name || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">{asset?.asset_tag || ""}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{user?.username || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
                      </div>
                    </TableCell>
                    <TableCell>{assignment.assigned_date ? new Date(assignment.assigned_date).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(assignment)}>
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
                            <AlertDialogTitle>Delete assignment</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this assignment? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteAssignment(assignment.id)}>
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
