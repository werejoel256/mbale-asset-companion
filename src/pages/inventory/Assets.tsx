import { useState } from "react";
import { Plus, Search, Filter, Edit, Trash2, Eye } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { assetsAPI, departmentsAPI, assetCategoriesAPI, suppliersAPI } from "@/lib/api";
import "./css/assets.css";

interface AssetFormData {
  asset_name: string;
  asset_tag: string;
  serial_number?: string;
  category_id: string;
  purchase_date?: string;
  purchase_cost?: number;
  supplier_id?: string;
  warranty_expiry?: string;
  asset_condition: string;
  status: string;
  department_id?: string;
}

const assetConditions = ["excellent", "good", "fair", "poor", "damaged"];
const assetStatuses = ["available", "assigned", "under_maintenance", "disposed", "lost"];

export default function Assets() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AssetFormData>({
    defaultValues: {
      asset_name: "",
      asset_tag: "",
      serial_number: "",
      category_id: "",
      purchase_date: "",
      purchase_cost: 0,
      supplier_id: "",
      warranty_expiry: "",
      asset_condition: "good",
      status: "available",
      department_id: "",
    },
  });

  const {
    data: assets = [],
    isLoading: assetsLoading,
    error: assetsError,
  } = useQuery({ queryKey: ["assets"], queryFn: assetsAPI.getAll });

  const {
    data: departments = [],
    isLoading: departmentsLoading,
    error: departmentsError,
  } = useQuery({ queryKey: ["departments"], queryFn: departmentsAPI.getAll });

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({ queryKey: ["assetCategories"], queryFn: assetCategoriesAPI.getAll });

  const {
    data: suppliers = [],
    isLoading: suppliersLoading,
    error: suppliersError,
  } = useQuery({ queryKey: ["suppliers"], queryFn: suppliersAPI.getAll });

  const isLoading = assetsLoading || departmentsLoading || categoriesLoading || suppliersLoading;
  const error = assetsError || departmentsError || categoriesError || suppliersError;

  // Mutations
  const createMutation = useMutation({
    mutationFn: assetsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Asset created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create asset",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AssetFormData> }) =>
      assetsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setEditingAsset(null);
      form.reset();
      toast({
        title: "Success",
        description: "Asset updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update asset",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: assetsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast({
        title: "Success",
        description: "Asset deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete asset",
        variant: "destructive",
      });
    },
  });

  const filtered = assets.filter((a: any) => {
    const matchSearch = a.asset_name.toLowerCase().includes(search.toLowerCase()) ||
      a.asset_tag.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = (data: AssetFormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (asset: any) => {
    setEditingAsset(asset);
    form.reset({
      asset_name: asset.asset_name,
      asset_tag: asset.asset_tag,
      serial_number: asset.serial_number || "",
      category_id: asset.category_id || "",
      purchase_date: asset.purchase_date ? new Date(asset.purchase_date).toISOString().split('T')[0] : "",
      purchase_cost: asset.purchase_cost || 0,
      supplier_id: asset.supplier_id || "",
      warranty_expiry: asset.warranty_expiry ? new Date(asset.warranty_expiry).toISOString().split('T')[0] : "",
      asset_condition: asset.asset_condition || "good",
      status: asset.status || "available",
      department_id: asset.department_id || "",
    });
  };

  const handleView = (asset: any) => {
    setSelectedAsset(asset);
  };

  const handleUpdate = (data: AssetFormData) => {
    if (editingAsset) {
      updateMutation.mutate({ id: editingAsset.id, data });
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const openCreateDialog = () => {
    setEditingAsset(null);
    form.reset({
      asset_name: "",
      asset_tag: "",
      serial_number: "",
      category_id: "",
      purchase_date: "",
      purchase_cost: 0,
      supplier_id: "",
      warranty_expiry: "",
      asset_condition: "good",
      status: "available",
      department_id: "",
    });
    setIsCreateDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 md:p-6">
        <Alert>
          <AlertTitle>Loading assets</AlertTitle>
          <AlertDescription>Fetching assets, departments, categories, and suppliers from the server.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 md:p-6">
        <Alert variant="destructive">
          <AlertTitle>Unable to load assets</AlertTitle>
          <AlertDescription>
            {String(error) || "There was a problem loading asset data. Please refresh or try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 md:p-6">
      <PageHeader title="Assets" description="Manage all hospital assets">
        <Dialog open={isCreateDialogOpen || !!editingAsset} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingAsset(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreateDialog}>
              <Plus className="w-4 h-4" /> Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAsset ? "Edit Asset" : "Add New Asset"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(editingAsset ? handleUpdate : handleCreate)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="asset_name"
                    rules={{ required: "Asset name is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter asset name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="asset_tag"
                    rules={{ required: "Asset tag is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset Tag *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter asset tag" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="serial_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serial Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter serial number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category_id"
                    rules={{ required: "Category is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat: any) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.category_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="purchase_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="purchase_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Cost (UGX)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="supplier_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select supplier" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {suppliers.map((sup: any) => (
                              <SelectItem key={sup.id} value={sup.id}>
                                {sup.supplier_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="warranty_expiry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warranty Expiry</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="asset_condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {assetConditions.map((condition) => (
                              <SelectItem key={condition} value={condition}>
                                {condition.charAt(0).toUpperCase() + condition.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {assetStatuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="department_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((dept: any) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.department_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setEditingAsset(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingAsset ? "Update Asset" : "Create Asset"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedAsset} onOpenChange={(open) => {
          if (!open) setSelectedAsset(null);
        }}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Asset Details</DialogTitle>
            </DialogHeader>
            {selectedAsset ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tag</p>
                  <p className="font-medium">{selectedAsset.asset_tag}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedAsset.asset_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{categories.find((c: any) => c.id === selectedAsset.category_id)?.category_name || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{departments.find((d: any) => d.id === selectedAsset.department_id)?.department_name || "—"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Condition</p>
                    <StatusBadge status={selectedAsset.asset_condition} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <StatusBadge status={selectedAsset.status} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Purchase Cost</p>
                  <p className="font-medium">UGX {Number(selectedAsset.purchase_cost).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Supplier</p>
                  <p className="font-medium">{suppliers.find((s: any) => s.id === selectedAsset.supplier_id)?.supplier_name || "—"}</p>
                </div>
              </div>
            ) : null}
            <div className="mt-6 text-right">
              <Button variant="secondary" onClick={() => setSelectedAsset(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {["All", "available", "under_maintenance", "disposed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {s === "available" ? "Available" : s === "under_maintenance" ? "Under Maintenance" : s === "disposed" ? "Disposed" : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Asset Tag</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Condition</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cost</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            {filtered.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={8} className="px-4 py-8">
                    <Alert>
                      <AlertTitle>No assets found</AlertTitle>
                      <AlertDescription>
                        No assets match your current search or filter selections. Try updating your terms or clear the filters.
                      </AlertDescription>
                    </Alert>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {filtered.map((a: any) => {
                  const cat = categories.find((c: any) => c.id === a.category_id);
                  const dept = departments.find((d: any) => d.id === a.department_id);
                  return (
                    <tr key={a.id} className="border-t border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-primary">{a.asset_tag}</td>
                      <td className="py-3 px-4 font-medium">{a.asset_name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{cat?.category_name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{dept?.department_name}</td>
                      <td className="py-3 px-4"><StatusBadge status={a.asset_condition} /></td>
                      <td className="py-3 px-4"><StatusBadge status={a.status} /></td>
                      <td className="py-3 px-4 text-right font-medium">UGX {Number(a.purchase_cost).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleView(a)}>
                          <Eye className="w-4 h-4" />
                          Need
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleEdit(a)}>
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button variant="default" size="sm" onClick={() => handleEdit(a)}>
                          Update
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
                              <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{a.asset_name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(a.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
