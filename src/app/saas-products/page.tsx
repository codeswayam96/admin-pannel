"use client";

import { useState } from "react";
import { Plus, Search, Pencil, Trash2, MoreVertical, TrendingUp, TrendingDown, Users, DollarSign } from "lucide-react";
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

type ProductStatus = "active" | "beta" | "deprecated" | "coming-soon";

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  billing: string;
  status: ProductStatus;
  subscribers: number;
  revenue: number;
  category: string;
  trend: "up" | "down" | "stable";
  trendValue: string;
}

const initialProducts: Product[] = [
  { id: 1, name: "Analytics Pro", description: "Advanced SaaS analytics with real-time insights", price: "₹2,999", billing: "monthly", status: "active", subscribers: 284, revenue: 851316, category: "Analytics", trend: "up", trendValue: "+12%" },
  { id: 2, name: "CRM Suite", description: "Complete customer relationship management platform", price: "₹1,999", billing: "monthly", status: "active", subscribers: 192, revenue: 383808, category: "CRM", trend: "up", trendValue: "+8%" },
  { id: 3, name: "Dev Tools", description: "Developer productivity and code review tools", price: "₹999", billing: "monthly", status: "beta", subscribers: 98, revenue: 97902, category: "Development", trend: "up", trendValue: "+24%" },
  { id: 4, name: "Marketing Hub", description: "Email campaigns and marketing automation", price: "₹1,499", billing: "monthly", status: "active", subscribers: 156, revenue: 233844, category: "Marketing", trend: "down", trendValue: "-3%" },
  { id: 5, name: "Support Desk", description: "AI-powered customer support ticketing", price: "₹799", billing: "monthly", status: "active", subscribers: 211, revenue: 168589, category: "Support", trend: "stable", trendValue: "+1%" },
  { id: 6, name: "AI Writer", description: "AI-powered content generation and editing", price: "₹3,499", billing: "monthly", status: "coming-soon", subscribers: 0, revenue: 0, category: "AI/ML", trend: "stable", trendValue: "—" },
];

const statusConfig: Record<ProductStatus, { label: string; variant: "success" | "info" | "secondary" | "warning" }> = {
  active: { label: "Active", variant: "success" },
  beta: { label: "Beta", variant: "info" },
  deprecated: { label: "Deprecated", variant: "secondary" },
  "coming-soon": { label: "Coming Soon", variant: "warning" },
};

const emptyForm = { name: "", description: "", price: "", billing: "monthly", status: "active" as ProductStatus, category: "" };

export default function SaasProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setForm(emptyForm); setEditProduct(null); setDialogOpen(true); };
  const openEdit = (p: Product) => {
    setForm({ name: p.name, description: p.description, price: p.price, billing: p.billing, status: p.status, category: p.category });
    setEditProduct(p);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Product name is required"); return; }
    if (editProduct) {
      setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...p, ...form } : p));
      toast.success("Product updated!");
    } else {
      const newProduct: Product = {
        id: products.length + 1, ...form as Omit<Product, "id" | "subscribers" | "revenue" | "trend" | "trendValue">,
        subscribers: 0, revenue: 0, trend: "stable", trendValue: "—"
      };
      setProducts(prev => [...prev, newProduct]);
      toast.success("Product created!");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success("Product deleted");
  };

  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
  const totalSubscribers = products.reduce((sum, p) => sum + p.subscribers, 0);
  const activeProducts = products.filter(p => p.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SaaS Products</h1>
          <p className="text-muted-foreground mt-1">Manage your product catalog and subscriptions</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-violet-100"><DollarSign size={18} className="text-violet-600" /></div>
            <div>
              <p className="text-2xl font-bold">₹{(totalRevenue / 1000).toFixed(0)}K</p>
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
            <div className="p-2.5 rounded-lg bg-emerald-100"><TrendingUp size={18} className="text-emerald-600" /></div>
            <div>
              <p className="text-2xl font-bold">{activeProducts}</p>
              <p className="text-sm text-muted-foreground">Active Products</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search products..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((product) => {
          const sc = statusConfig[product.status];
          return (
            <Card key={product.id} className="relative overflow-hidden group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{product.name}</CardTitle>
                    <CardDescription className="mt-0.5 text-xs">{product.category}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={sc.variant}>{sc.label}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical size={14} />
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
                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <div>
                    <p className="text-lg font-bold">{product.price}</p>
                    <p className="text-xs text-muted-foreground">/{product.billing}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{product.subscribers} subscribers</p>
                    <div className={`flex items-center gap-1 text-xs justify-end ${product.trend === "up" ? "text-emerald-600" : product.trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
                      {product.trend === "up" ? <TrendingUp size={12} /> : product.trend === "down" ? <TrendingDown size={12} /> : null}
                      {product.trendValue}
                    </div>
                  </div>
                </div>
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
            <div className="space-y-1.5">
              <Label>Product Name *</Label>
              <Input placeholder="Analytics Pro" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={2} placeholder="Brief product description..." value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Price</Label>
                <Input placeholder="₹999" value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Billing</Label>
                <Select value={form.billing} onValueChange={(v) => setForm(p => ({ ...p, billing: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="one-time">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input placeholder="Analytics" value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v as ProductStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="beta">Beta</SelectItem>
                    <SelectItem value="coming-soon">Coming Soon</SelectItem>
                    <SelectItem value="deprecated">Deprecated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editProduct ? "Save Changes" : "Create Product"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
