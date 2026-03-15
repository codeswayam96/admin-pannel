"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, MoreVertical, Loader2, Globe, Package, IndianRupee, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ErrorState } from "@/components/ErrorState";
import { fetchProducts, createProduct, updateProduct, deleteProduct } from "@/lib/api";

interface Product {
  id: number;
  saasId: string;
  icon: string | null;
  name: string;
  tag: string;
  description: string;
  domain: string;
  status: string;
  featured: string | null;
  price: number | null;
  subscribers: number | null;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  beta: "bg-blue-100 text-blue-700",
  deprecated: "bg-red-100 text-red-700",
  "coming-soon": "bg-amber-100 text-amber-700",
};

const emptyForm = { saasId: "", name: "", tag: "", description: "", domain: "", status: "active", icon: "", featured: "no", price: "", subscribers: "" };

export default function SaasProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch((err) => setError(err.message || "Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.tag.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.subscribers || 0)), 0);
  const totalSubscribers = products.reduce((sum, p) => sum + (p.subscribers || 0), 0);
  const activeProducts = products.filter(p => p.status === "active").length;

  const openCreate = () => { setForm(emptyForm); setEditProduct(null); setDialogOpen(true); };
  const openEdit = (p: Product) => {
    setForm({
      saasId: p.saasId, name: p.name, tag: p.tag, description: p.description,
      domain: p.domain, status: p.status, icon: p.icon || "", featured: p.featured || "no",
      price: p.price != null ? String(p.price) : "",
      subscribers: p.subscribers != null ? String(p.subscribers) : "",
    });
    setEditProduct(p);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Product name is required"); return; }
    if (!form.saasId.trim()) { toast.error("SaaS ID is required"); return; }
    setSaving(true);
    try {
      const payload = {
        saasId: form.saasId, name: form.name, tag: form.tag, description: form.description,
        domain: form.domain, status: form.status, icon: form.icon || undefined,
        featured: form.featured, price: form.price ? Number(form.price) : undefined,
        subscribers: form.subscribers ? Number(form.subscribers) : undefined,
      };
      if (editProduct) {
        const updated = await updateProduct(editProduct.id, payload);
        setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...p, ...updated } : p));
        toast.success("Product updated!");
      } else {
        const created = await createProduct(payload);
        setProducts(prev => [...prev, created]);
        toast.success("Product created!");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save product");
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    }
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SaaS Products</h1>
          <p className="text-muted-foreground mt-1">Manage your product catalog</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-violet-100"><IndianRupee size={18} className="text-violet-600" /></div>
            <div>
              <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Monthly Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-blue-100"><Users size={18} className="text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold">{totalSubscribers.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Subscribers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-emerald-100"><Globe size={18} className="text-emerald-600" /></div>
            <div>
              <p className="text-2xl font-bold">{activeProducts}</p>
              <p className="text-sm text-muted-foreground">Active Products</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="beta">Beta</SelectItem>
            <SelectItem value="coming-soon">Coming Soon</SelectItem>
            <SelectItem value="deprecated">Deprecated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((product) => {
          const statusClass = statusColors[product.status] || "bg-gray-100 text-gray-700";
          const statusLabel = product.status === "coming-soon" ? "Coming Soon" : product.status.charAt(0).toUpperCase() + product.status.slice(1);
          const monthlyRevenue = (product.price || 0) * (product.subscribers || 0);
          return (
            <Card key={product.id} className="relative overflow-hidden group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{product.name}</CardTitle>
                    <CardDescription className="mt-0.5 text-xs">{product.tag}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>{statusLabel}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" disabled={deletingId === product.id}>
                          {deletingId === product.id ? <Loader2 size={14} className="animate-spin" /> : <MoreVertical size={14} />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(product)}>
                          <Pencil size={14} className="mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                              <Trash2 size={14} className="mr-2" /> Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {product.name}?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently remove the product and all related data.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(product.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div>
                    <p className="text-lg font-bold">{product.price != null ? `₹${product.price.toLocaleString()}` : "Free"}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users size={13} /> {(product.subscribers || 0).toLocaleString()}</span>
                    <span className="flex items-center gap-1 text-emerald-600"><TrendingUp size={13} /> ₹{monthlyRevenue.toLocaleString()}</span>
                  </div>
                </div>
                {product.featured === "yes" && (
                  <div className="pt-1">
                    <Badge variant="default" className="text-xs">Featured</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>{editProduct ? "Update product details." : "Fill in the details to create a new SaaS product."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>SaaS ID *</Label>
                <Input placeholder="analytics-pro" value={form.saasId} onChange={(e) => setForm(p => ({ ...p, saasId: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Product Name *</Label>
                <Input placeholder="Analytics Pro" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tag</Label>
                <Input placeholder="analytics" value={form.tag} onChange={(e) => setForm(p => ({ ...p, tag: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Domain</Label>
                <Input placeholder="analytics.codeswayam.com" value={form.domain} onChange={(e) => setForm(p => ({ ...p, domain: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={2} placeholder="Brief product description..." value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Price (₹/mo)</Label>
                <Input type="number" placeholder="999" value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Subscribers</Label>
                <Input type="number" placeholder="0" value={form.subscribers} onChange={(e) => setForm(p => ({ ...p, subscribers: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="beta">Beta</SelectItem>
                    <SelectItem value="coming-soon">Coming Soon</SelectItem>
                    <SelectItem value="deprecated">Deprecated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Featured</Label>
                <Select value={form.featured} onValueChange={(v) => setForm(p => ({ ...p, featured: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Icon URL</Label>
              <Input placeholder="https://example.com/icon.svg" value={form.icon} onChange={(e) => setForm(p => ({ ...p, icon: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
              {editProduct ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
