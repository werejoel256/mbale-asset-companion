import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Truck, Mail, Phone, User, Search, Edit, Trash2, Download, RefreshCw } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { suppliersAPI } from "@/lib/api";

const initialSupplierForm = {
  supplier_name: "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
};

export default function Suppliers() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [supplierForm, setSupplierForm] = useState(initialSupplierForm);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const queryClient = useQueryClient();

  const {
    data: suppliers = [],
    isLoading,
    error,
  } = useQuery({ queryKey: ["suppliers"], queryFn: suppliersAPI.getAll });

  const createMutation = useMutation({
    mutationFn: (data: any) => suppliersAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setIsDialogOpen(false);
      setEditingSupplier(null);
      setSupplierForm(initialSupplierForm);
    },
    onError: (error: any) => {
      alert(error.message || "Failed to create supplier");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => suppliersAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setIsDialogOpen(false);
      setEditingSupplier(null);
      setSupplierForm(initialSupplierForm);
    },
    onError: (error: any) => {
      alert(error.message || "Failed to update supplier");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => suppliersAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (error: any) => {
      alert(error.message || "Failed to delete supplier");
    },
  });

  const filteredSuppliers = useMemo(() => {
    const query = search.toLowerCase();
    return suppliers.filter((supplier: any) =>
      supplier.supplier_name?.toLowerCase().includes(query) ||
      supplier.contact_person?.toLowerCase().includes(query) ||
      supplier.email?.toLowerCase().includes(query) ||
      supplier.phone?.toLowerCase().includes(query) ||
      supplier.address?.toLowerCase().includes(query)
    );
  }, [suppliers, search]);

  const totalSuppliers = suppliers.length;
  const withEmail = suppliers.filter((supplier: any) => supplier.email).length;
  const withPhone = suppliers.filter((supplier: any) => supplier.phone).length;

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setSupplierForm(initialSupplierForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      supplier_name: supplier.supplier_name || "",
      contact_person: supplier.contact_person || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
    });
    setIsDialogOpen(true);
  };

  const handleSaveSupplier = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supplierForm.supplier_name.trim()) {
      alert("Supplier name is required");
      return;
    }

    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data: supplierForm });
    } else {
      createMutation.mutate(supplierForm);
    }
  };

  const handleDeleteSupplier = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleExportExcel = () => {
    const headers = ["Supplier Name", "Contact Person", "Phone", "Email", "Address"];
    const rows = filteredSuppliers.map((supplier: any) => [
      supplier.supplier_name || "",
      supplier.contact_person || "",
      supplier.phone || "",
      supplier.email || "",
      supplier.address || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.setAttribute("download", `suppliers-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      await queryClient.refetchQueries({ queryKey: ["suppliers"] });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 md:p-6">
        <Alert>
          <AlertTitle>Loading suppliers</AlertTitle>
          <AlertDescription>Fetching supplier records from the server.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 md:p-6">
        <Alert variant="destructive">
          <AlertTitle>Unable to load suppliers</AlertTitle>
          <AlertDescription>
            {String(error) || "There was a problem loading supplier data. Please refresh or try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 md:p-6 space-y-6">
      <PageHeader 
        title="Suppliers" 
        description="Manage equipment and service suppliers for the hospital"
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
            <Plus className="w-4 h-4" /> New Supplier
          </Button>
        </div>
      </PageHeader>

      {/* Stats Cards - Improved for Mobile & Dark Mode */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6 border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/50 dark:to-zinc-950 hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Total Suppliers</p>
              <p className="text-4xl font-bold text-emerald-950 dark:text-white mt-3">{totalSuppliers}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Truck className="h-6 w-6" />
            </div>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-4">All registered suppliers</p>
        </Card>

        <Card className="p-6 border-sky-200 dark:border-sky-900 bg-gradient-to-br from-sky-50 to-white dark:from-sky-950/50 dark:to-zinc-950 hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-sky-600 dark:text-sky-400">With Email</p>
              <p className="text-4xl font-bold text-sky-950 dark:text-white mt-3">{withEmail}</p>
              <p className="text-sm text-sky-600 dark:text-sky-500 mt-1">
                {totalSuppliers > 0 ? Math.round((withEmail / totalSuppliers) * 100) : 0}% coverage
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Mail className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-violet-200 dark:border-violet-900 bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/50 dark:to-zinc-950 hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-violet-600 dark:text-violet-400">With Phone</p>
              <p className="text-4xl font-bold text-violet-950 dark:text-white mt-3">{withPhone}</p>
              <p className="text-sm text-violet-600 dark:text-violet-500 mt-1">
                {totalSuppliers > 0 ? Math.round((withPhone / totalSuppliers) * 100) : 0}% coverage
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Phone className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-11 h-11 bg-white dark:bg-zinc-950"
            placeholder="Search by supplier name, contact, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50 dark:bg-zinc-900">
            <TableRow>
              <TableHead className="font-semibold">Supplier</TableHead>
              <TableHead className="font-semibold">Contact Person</TableHead>
              <TableHead className="font-semibold">Phone</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="hidden md:table-cell font-semibold">Address</TableHead>
              <TableHead className="text-right font-semibold w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>

          {filteredSuppliers.length === 0 ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Truck className="h-12 w-12 mb-4 opacity-40" />
                    <p className="text-lg font-medium">No suppliers found</p>
                    <p className="text-sm mt-1">Try adjusting your search term</p>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {filteredSuppliers.map((supplier: any) => (
                <TableRow key={supplier.id} className="hover:bg-muted/50 dark:hover:bg-zinc-900/50 group transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Truck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{supplier.supplier_name}</p>
                        {supplier.contact_person && (
                          <p className="text-xs text-muted-foreground mt-0.5">{supplier.contact_person}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {supplier.contact_person || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {supplier.phone || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground break-all">
                    {supplier.email || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground max-w-xs truncate">
                    {supplier.address || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(supplier)}
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
                            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to permanently delete{" "}
                              <span className="font-medium">"{supplier.supplier_name}"</span>? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteSupplier(supplier.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete Supplier
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </Card>

      {/* Create/Edit Dialog - Improved Layout */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? "Edit Supplier" : "Create New Supplier"}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier 
                ? "Update the supplier information below." 
                : "Add a new supplier for hospital equipment and services."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSupplier} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Supplier Name <span className="text-destructive">*</span></label>
                <Input
                  value={supplierForm.supplier_name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, supplier_name: e.target.value })}
                  placeholder="e.g. MedEquip Uganda Ltd"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Person</label>
                <Input
                  value={supplierForm.contact_person}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
                  placeholder="e.g. Dr. Sarah Nakato"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  placeholder="+256 700 123 456"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  placeholder="contact@medequip.co.ug"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Full Address</label>
              <Textarea
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                placeholder="Plot 45, Kampala Road, Uganda"
                rows={3}
              />
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
                {editingSupplier ? "Update Supplier" : "Create Supplier"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}