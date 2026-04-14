import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit, Delete, Search, Download } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { disposalsAPI, assetsAPI } from "@/lib/api";

const disposalReasons = ["End of Life", "Damage Beyond Repair", "Loss", "Obsolete", "Stolen", "Other"];

const initialDisposalForm = {
  asset_id: "",
  disposal_date: "",
  reason: "",
  notes: "",
};

export default function Disposals() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDisposal, setEditingDisposal] = useState<any>(null);
  const [disposalForm, setDisposalForm] = useState(initialDisposalForm);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const queryClient = useQueryClient();

  const {
    data: disposals = [],
    isLoading: disposalsLoading,
    error: disposalsError,
  } = useQuery({ queryKey: ["disposals"], queryFn: disposalsAPI.getAll });

  const {
    data: assets = [],
    isLoading: assetsLoading,
  } = useQuery({ queryKey: ["assets"], queryFn: assetsAPI.getAll });

  const isLoading = disposalsLoading || assetsLoading;
  const error = disposalsError;

  const createMutation = useMutation({
    mutationFn: (data: any) => disposalsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disposals"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setIsDialogOpen(false);
      setEditingDisposal(null);
      setDisposalForm(initialDisposalForm);
    },
    onError: (error: any) => {
      alert(error.message || "Failed to create disposal");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => disposalsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disposals"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setIsDialogOpen(false);
      setEditingDisposal(null);
      setDisposalForm(initialDisposalForm);
    },
    onError: (error: any) => {
      alert(error.message || "Failed to update disposal");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => disposalsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disposals"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (error: any) => {
      alert(error.message || "Failed to delete disposal");
    },
  });

  const filteredDisposals = useMemo(() => {
    const query = search.toLowerCase();
    return disposals.filter((d: any) => {
      const asset = assets.find((a: any) => a.id === d.asset_id);
      return (
        asset?.asset_name?.toLowerCase().includes(query) ||
        asset?.asset_tag?.toLowerCase().includes(query) ||
        d.reason?.toLowerCase().includes(query)
      );
    });
  }, [disposals, assets, search]);

  const totalDisposals = disposals.length;
  const disposalsByReason = useMemo(() => {
    const counts: Record<string, number> = {};
    disposals.forEach((d: any) => {
      const reason = d.reason || "Unknown";
      counts[reason] = (counts[reason] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  }, [disposals]);

  const handleOpenCreate = () => {
    setEditingDisposal(null);
    setDisposalForm(initialDisposalForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (disposal: any) => {
    setEditingDisposal(disposal);
    setDisposalForm({
      asset_id: disposal.asset_id || "",
      disposal_date: disposal.disposal_date || "",
      reason: disposal.reason || "",
      notes: disposal.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSaveDisposal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!disposalForm.asset_id.trim() || !disposalForm.reason.trim()) {
      alert("Asset and reason are required");
      return;
    }

    if (editingDisposal) {
      updateMutation.mutate({ id: editingDisposal.id, data: disposalForm });
    } else {
      createMutation.mutate(disposalForm);
    }
  };

  const handleDeleteDisposal = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleExportExcel = () => {
    const headers = ["Asset", "Asset Tag", "Disposal Date", "Reason", "Notes"];
    const rows = filteredDisposals.map((d: any) => {
      const asset = assets.find((a: any) => a.id === d.asset_id);
      return [
        asset?.asset_name || "",
        asset?.asset_tag || "",
        d.disposal_date || "",
        d.reason || "",
        d.notes || "",
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.setAttribute("download", `disposals-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["disposals"] }),
        queryClient.invalidateQueries({ queryKey: ["assets"] }),
      ]);
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["disposals"] }),
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
          <AlertTitle>Loading disposals</AlertTitle>
          <AlertDescription>Fetching asset disposal records from the server.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 md:p-6">
        <Alert variant="destructive">
          <AlertTitle>Unable to load disposals</AlertTitle>
          <AlertDescription>
            {String(error) || "There was a problem loading disposal data. Please refresh or try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 md:p-6">
      <PageHeader title="Asset Disposals" description="Manage disposed and decommissioned assets">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" onClick={refreshData} disabled={isRefreshing}>
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" /> New Disposal
          </Button>
        </div>
      </PageHeader>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDisposal ? "Edit Disposal" : "Create Disposal"}</DialogTitle>
            <DialogDescription>
              {editingDisposal
                ? "Update disposal details and save changes."
                : "Record the disposal of an asset from the inventory."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveDisposal} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Asset *</label>
              <Select value={disposalForm.asset_id} onValueChange={(value) => setDisposalForm({ ...disposalForm, asset_id: value })}>
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
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Reason *</label>
              <Select value={disposalForm.reason} onValueChange={(value) => setDisposalForm({ ...disposalForm, reason: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select disposal reason" />
                </SelectTrigger>
                <SelectContent>
                  {disposalReasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Disposal Date</label>
              <Input
                type="date"
                value={disposalForm.disposal_date}
                onChange={(e) => setDisposalForm({ ...disposalForm, disposal_date: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Notes</label>
              <Input
                value={disposalForm.notes}
                onChange={(e) => setDisposalForm({ ...disposalForm, notes: e.target.value })}
                placeholder="Disposal notes..."
              />
            </div>

            <div className="flex flex-wrap gap-3 justify-end pt-4">
              <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingDisposal ? "Update Disposal" : "Create Disposal"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-red-700">Total disposals</p>
              <p className="mt-2 text-3xl font-semibold text-red-950">{totalDisposals}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-700 shadow-sm">
              <Trash2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-sm text-red-600">Assets removed from inventory.</p>
        </div>

        <div className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-orange-700">Primary reason</p>
              <p className="mt-2 text-2xl font-semibold text-orange-950">{disposalsByReason?.[0] || "—"}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-700 shadow-sm">
              <Trash2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-sm text-orange-600">
            Most common disposal reason {disposalsByReason?.[1] ? `(${disposalsByReason[1]} cases)` : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search disposals..."
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
              <TableHead>Reason</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          {filteredDisposals.length === 0 ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="p-8 text-center text-muted-foreground">
                  <Alert>
                    <AlertTitle>No disposals found</AlertTitle>
                    <AlertDescription>
                      Try a different search term or create a new disposal record to get started.
                    </AlertDescription>
                  </Alert>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {filteredDisposals.map((disposal: any) => {
                const asset = assets.find((a: any) => a.id === disposal.asset_id);
                return (
                  <TableRow key={disposal.id} className="hover:bg-secondary/50">
                    <TableCell>
                      <div>
                        <p className="font-semibold">{asset?.asset_name || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">{asset?.asset_tag || ""}</p>
                      </div>
                    </TableCell>
                    <TableCell>{disposal.reason || "—"}</TableCell>
                    <TableCell>{disposal.disposal_date || "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">{disposal.notes || "—"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(disposal)}>
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Delete className="w-4 h-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete disposal</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this disposal record? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteDisposal(disposal.id)}>
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
