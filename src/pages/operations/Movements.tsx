import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ArrowLeftRight, Edit, Trash2, Search, Download } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { movementsAPI, assetsAPI, departmentsAPI } from "@/lib/api";

const initialMovementForm = {
  asset_id: "",
  from_department_id: "",
  to_department_id: "",
  movement_date: "",
  reason: "",
  moved_by: "",
};

export default function Movements() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<any>(null);
  const [movementForm, setMovementForm] = useState(initialMovementForm);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const queryClient = useQueryClient();

  const {
    data: movements = [],
    isLoading: movementsLoading,
    error: movementsError,
  } = useQuery({ queryKey: ["movements"], queryFn: movementsAPI.getAll });

  const {
    data: assets = [],
    isLoading: assetsLoading,
  } = useQuery({ queryKey: ["assets"], queryFn: assetsAPI.getAll });

  const {
    data: departments = [],
    isLoading: departmentsLoading,
  } = useQuery({ queryKey: ["departments"], queryFn: departmentsAPI.getAll });

  const isLoading = movementsLoading || assetsLoading || departmentsLoading;
  const error = movementsError;

  const createMutation = useMutation({
    mutationFn: (data: any) => movementsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      setIsDialogOpen(false);
      setEditingMovement(null);
      setMovementForm(initialMovementForm);
    },
    onError: (error: any) => {
      alert(error.message || "Failed to create movement");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => movementsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      setIsDialogOpen(false);
      setEditingMovement(null);
      setMovementForm(initialMovementForm);
    },
    onError: (error: any) => {
      alert(error.message || "Failed to update movement");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => movementsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
    onError: (error: any) => {
      alert(error.message || "Failed to delete movement");
    },
  });

  const filteredMovements = useMemo(() => {
    const query = search.toLowerCase();
    return movements.filter((m: any) => {
      const asset = assets.find((a: any) => a.id === m.asset_id);
      const fromDept = departments.find((d: any) => d.id === m.from_department_id);
      const toDept = departments.find((d: any) => d.id === m.to_department_id);
      return (
        asset?.asset_name?.toLowerCase().includes(query) ||
        asset?.asset_tag?.toLowerCase().includes(query) ||
        fromDept?.department_name?.toLowerCase().includes(query) ||
        toDept?.department_name?.toLowerCase().includes(query)
      );
    });
  }, [movements, assets, departments, search]);

  const totalMovements = movements.length;
  const recentMovements = movements.filter((m: any) => {
    const date = new Date(m.movement_date);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return date >= thirtyDaysAgo;
  }).length;

  const handleOpenCreate = () => {
    setEditingMovement(null);
    setMovementForm(initialMovementForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (movement: any) => {
    setEditingMovement(movement);
    setMovementForm({
      asset_id: movement.asset_id || "",
      from_department_id: movement.from_department_id || "",
      to_department_id: movement.to_department_id || "",
      movement_date: movement.movement_date || "",
      reason: movement.reason || "",
      moved_by: movement.moved_by || "",
    });
    setIsDialogOpen(true);
  };

  const handleSaveMovement = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!movementForm.asset_id.trim() || !movementForm.to_department_id.trim()) {
      alert("Asset and destination department are required");
      return;
    }

    if (editingMovement) {
      updateMutation.mutate({ id: editingMovement.id, data: movementForm });
    } else {
      createMutation.mutate(movementForm);
    }
  };

  const handleDeleteMovement = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleExportExcel = () => {
    const headers = ["Asset", "From Department", "To Department", "Date", "Reason", "Moved By"];
    const rows = filteredMovements.map((m: any) => {
      const asset = assets.find((a: any) => a.id === m.asset_id);
      const fromDept = departments.find((d: any) => d.id === m.from_department_id);
      const toDept = departments.find((d: any) => d.id === m.to_department_id);
      return [
        asset?.asset_name || "",
        fromDept?.department_name || "",
        toDept?.department_name || "",
        m.movement_date || "",
        m.reason || "",
        m.moved_by || "",
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.setAttribute("download", `movements-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["movements"] }),
        queryClient.invalidateQueries({ queryKey: ["assets"] }),
        queryClient.invalidateQueries({ queryKey: ["departments"] }),
      ]);
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["movements"] }),
        queryClient.refetchQueries({ queryKey: ["assets"] }),
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
          <AlertTitle>Loading movements</AlertTitle>
          <AlertDescription>Fetching asset movement records from the server.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 md:p-6">
        <Alert variant="destructive">
          <AlertTitle>Unable to load movements</AlertTitle>
          <AlertDescription>
            {String(error) || "There was a problem loading movement data. Please refresh or try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 md:p-6">
      <PageHeader title="Asset Movements" description="Track assets moving between departments">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" onClick={refreshData} disabled={isRefreshing}>
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" /> New Movement
          </Button>
        </div>
      </PageHeader>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMovement ? "Edit Movement" : "Create Movement"}</DialogTitle>
            <DialogDescription>
              {editingMovement
                ? "Update movement details and save changes."
                : "Record the movement of an asset between departments."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveMovement} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Asset *</label>
              <Select value={movementForm.asset_id} onValueChange={(value) => setMovementForm({ ...movementForm, asset_id: value })}>
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
              <label className="mb-2 block text-sm font-medium text-muted-foreground">From Department</label>
              <Select value={movementForm.from_department_id} onValueChange={(value) => setMovementForm({ ...movementForm, from_department_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select from department" />
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
              <label className="mb-2 block text-sm font-medium text-muted-foreground">To Department *</label>
              <Select value={movementForm.to_department_id} onValueChange={(value) => setMovementForm({ ...movementForm, to_department_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select to department" />
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
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Movement Date</label>
              <Input
                type="date"
                value={movementForm.movement_date}
                onChange={(e) => setMovementForm({ ...movementForm, movement_date: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Reason</label>
              <Input
                value={movementForm.reason}
                onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                placeholder="Reason for movement..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Moved By</label>
              <Input
                value={movementForm.moved_by}
                onChange={(e) => setMovementForm({ ...movementForm, moved_by: e.target.value })}
                placeholder="Name of person who moved the asset..."
              />
            </div>

            <div className="flex flex-wrap gap-3 justify-end pt-4">
              <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingMovement ? "Update Movement" : "Create Movement"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-emerald-700">Total movements</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-950">{totalMovements}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-sm">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-sm text-emerald-600">All asset movements recorded in the system.</p>
        </div>

        <div className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-sky-700">Recent movements (30 days)</p>
              <p className="mt-2 text-3xl font-semibold text-sky-950">{recentMovements}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 shadow-sm">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-sm text-sky-600">Movements in the last thirty days.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search movements..."
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
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          {filteredMovements.length === 0 ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="p-8 text-center text-muted-foreground">
                  <Alert>
                    <AlertTitle>No movements found</AlertTitle>
                    <AlertDescription>
                      Try a different search term or create a new movement record to get started.
                    </AlertDescription>
                  </Alert>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {filteredMovements.map((movement: any) => {
                const asset = assets.find((a: any) => a.id === movement.asset_id);
                const fromDept = departments.find((d: any) => d.id === movement.from_department_id);
                const toDept = departments.find((d: any) => d.id === movement.to_department_id);
                return (
                  <TableRow key={movement.id} className="hover:bg-secondary/50">
                    <TableCell>
                      <div>
                        <p className="font-semibold">{asset?.asset_name || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">{asset?.asset_tag || ""}</p>
                      </div>
                    </TableCell>
                    <TableCell>{fromDept?.department_name || "—"}</TableCell>
                    <TableCell>{toDept?.department_name || "—"}</TableCell>
                    <TableCell>{movement.movement_date || "—"}</TableCell>
                    <TableCell>{movement.reason || "—"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(movement)}>
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
                            <AlertDialogTitle>Delete movement</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this movement record? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteMovement(movement.id)}>
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
