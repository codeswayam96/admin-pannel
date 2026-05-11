"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, MoreVertical, Loader2, Globe, IndianRupee, Users, TrendingUp, CheckCircle2, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ErrorState } from "@/components/ErrorState";
import { fetchProducts, createProduct, updateProduct, deleteProduct } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: number;
  saasId: string;
  productFamily: string | null;
  icon: string | null;
  name: string;
  tag: string;
  description: string;
  domain: string;
  status: string;
  featured: string | null;
  price: number | null;
  monthlyPriceInr: number | null;
  yearlyPriceInr: number | null;
  monthlyPriceUsd: number | null;
  yearlyPriceUsd: number | null;
  features: string | null;
  planTier: string | null;
  isFreeTier: number | null;
  usageLimits: string | null;
  subscribers: number | null;
  createdAt: string;
  updatedAt: string;
}

interface ProductForm {
  saasId: string;
  productFamily: string;
  name: string;
  tag: string;
  description: string;
  domain: string;
  status: string;
  featured: string;
  icon: string;
  price: string;
  subscribers: string;
  // Pricing
  monthlyPriceInr: string;
  yearlyPriceInr: string;
  monthlyPriceUsd: string;
  yearlyPriceUsd: string;
  // Advanced
  planTier: string;
  isFreeTier: boolean;
  trialDays: string;
  featuresText: string;   // comma-separated string parsed to JSON array before save
  usageLimitsText: string; // JSON text parsed before save
}

// ─── Constants ────────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  beta: "bg-blue-100 text-blue-700 border-blue-200",
  deprecated: "bg-red-100 text-red-700 border-red-200",
  "coming-soon": "bg-amber-100 text-amber-700 border-amber-200",
};

const planTierColors: Record<string, string> = {
  free: "bg-gray-100 text-gray-700",
  standard: "bg-violet-100 text-violet-700",
  pro: "bg-indigo-100 text-indigo-700",
  enterprise: "bg-orange-100 text-orange-700",
};

const emptyForm: ProductForm = {
  saasId: "", productFamily: "", name: "", tag: "", description: "", domain: "",
  status: "active", featured: "no", icon: "", price: "", subscribers: "",
  monthlyPriceInr: "", yearlyPriceInr: "",
  monthlyPriceUsd: "", yearlyPriceUsd: "",
  planTier: "standard", isFreeTier: false, trialDays: "0",
  featuresText: "", usageLimitsText: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Safely parse JSON, returning fallback on error */
function safeParse<T>(str: string | null | undefined, fallback: T): T {
  try { return str ? JSON.parse(str) : fallback; }
  catch { return fallback; }
}

/** Format features array from JSON string to comma-separated display text */
function featuresToText(raw: string | null | undefined): string {
  const arr = safeParse<string[]>(raw, []);
  return arr.join(", ");
}

/** Parse comma-separated text to JSON array string */
function textToFeaturesJson(text: string): string {
  if (!text.trim()) return "[]";
  const arr = text.split(",").map(f => f.trim()).filter(Boolean);
  return JSON.stringify(arr);
}

/** Validate usageLimits JSON text */
function validateUsageLimits(text: string): { valid: boolean; error?: string } {
  if (!text.trim() || text.trim() === "{}") return { valid: true };
  try { JSON.parse(text); return { valid: true }; }
  catch { return { valid: false, error: "Invalid JSON format" }; }
}

/** Format price in paise/cents to display (dividing by 100) */
function formatPrice(paise: number | null): string {
  if (paise == null || paise === 0) return "";
  return String(paise / 100);
}

/** Parse display price (rupees/dollars) back to paise/cents */
function parsePrice(display: string): number | undefined {
  if (!display.trim()) return undefined;
  const n = parseFloat(display);
  return isNaN(n) ? undefined : Math.round(n * 100);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SaasProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [usageLimitsError, setUsageLimitsError] = useState("");

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch((err) => setError(err.message || "Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
      || (p.productFamily || "").toLowerCase().includes(search.toLowerCase())
      || p.saasId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalSubscribers = products.reduce((sum, p) => sum + (p.subscribers || 0), 0);
  const activeProducts = products.filter(p => p.status === "active").length;
  // Revenue estimate using monthly INR pricing (in paise → rupees)
  const totalMonthlyRevenue = products.reduce((sum, p) => {
    const priceInr = (p.monthlyPriceInr || 0) / 100;
    return sum + priceInr * (p.subscribers || 0);
  }, 0);

  // ── Dialog Handlers ────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm(emptyForm);
    setEditProduct(null);
    setUsageLimitsError("");
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setForm({
      saasId: p.saasId,
      productFamily: p.productFamily || "",
      name: p.name,
      tag: p.tag,
      description: p.description,
      domain: p.domain,
      status: p.status,
      featured: p.featured || "no",
      icon: p.icon || "",
      price: p.price != null ? String(p.price) : "",
      subscribers: p.subscribers != null ? String(p.subscribers) : "",
      // Pricing — display in human-readable units (divide by 100)
      monthlyPriceInr: formatPrice(p.monthlyPriceInr),
      yearlyPriceInr: formatPrice(p.yearlyPriceInr),
      monthlyPriceUsd: formatPrice(p.monthlyPriceUsd),
      yearlyPriceUsd: formatPrice(p.yearlyPriceUsd),
      // Advanced
      planTier: p.planTier || "standard",
      isFreeTier: (p.isFreeTier ?? 0) === 1,
      trialDays: String((p as any).trialDays ?? 0),
      featuresText: featuresToText(p.features),
      usageLimitsText: p.usageLimits && p.usageLimits !== "{}" ? p.usageLimits : "",
    });
    setEditProduct(p);
    setUsageLimitsError("");
    setDialogOpen(true);
  };

  const setField = (key: keyof ProductForm, value: string | boolean) => {
    setForm(prev => {
      const updated = { ...prev, [key]: value };
      // Auto-populate productFamily from saasId when creating (not editing)
      // Strip plan suffixes like _pro, _enter, _enterprise, _standard, _free
      if (key === "saasId" && !editProduct && typeof value === "string") {
        const family = value.replace(/[_-](pro|enterprise|enter|standard|free|basic|starter|growth|scale|plus|max)$/i, "");
        updated.productFamily = family;
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Product name is required"); return; }
    if (!form.saasId.trim()) { toast.error("SaaS ID is required"); return; }
    if (!form.productFamily.trim()) { toast.error("Product Family is required — used for JWT scopes and GTM"); return; }
    if (!form.domain.trim()) { toast.error("Domain is required"); return; }

    // Validate usage limits JSON if provided
    if (form.usageLimitsText.trim()) {
      const { valid, error: jsonError } = validateUsageLimits(form.usageLimitsText);
      if (!valid) { setUsageLimitsError(jsonError || "Invalid JSON"); return; }
    }
    setUsageLimitsError("");

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        saasId: form.saasId.trim(),
        productFamily: form.productFamily.trim(),
        name: form.name.trim(),
        tag: form.tag.trim(),
        description: form.description.trim(),
        domain: form.domain.trim(),
        status: form.status,
        featured: form.featured,
        icon: form.icon.trim() || undefined,
        price: form.price ? Number(form.price) : undefined,
        subscribers: form.subscribers ? Number(form.subscribers) : undefined,
        // Pricing — convert from human-readable ₹/$ back to paise/cents
        // If Free tier, force to 0
        monthlyPriceInr: form.planTier === "free" ? 0 : parsePrice(form.monthlyPriceInr),
        yearlyPriceInr:  form.planTier === "free" ? 0 : parsePrice(form.yearlyPriceInr),
        monthlyPriceUsd: form.planTier === "free" ? 0 : parsePrice(form.monthlyPriceUsd),
        yearlyPriceUsd:  form.planTier === "free" ? 0 : parsePrice(form.yearlyPriceUsd),
        // Advanced
        planTier: form.planTier,
        isFreeTier: (form.isFreeTier || form.planTier === "free") ? 1 : 0,
        trialDays: form.trialDays ? Number(form.trialDays) : 0,
        features: textToFeaturesJson(form.featuresText),
        usageLimits: form.usageLimitsText.trim() || "{}",
      };

      if (editProduct) {
        const updated = await updateProduct(editProduct.id, payload);
        setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...p, ...updated } : p));
        toast.success("Product updated successfully!");
      } else {
        const created = await createProduct(payload);
        setProducts(prev => [...prev, created]);
        toast.success("Product created successfully!");
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (error) return <ErrorState error={error} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SaaS Products</h1>
          <p className="text-muted-foreground mt-1">Manage products, plans, and subscription pricing</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} /> Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-violet-100"><IndianRupee size={18} className="text-violet-600" /></div>
            <div>
              <p className="text-2xl font-bold">₹{totalMonthlyRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
              <p className="text-sm text-muted-foreground">Est. Monthly Revenue</p>
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
          <Input placeholder="Search by name, family, or ID..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="beta">Beta</SelectItem>
            <SelectItem value="coming-soon">Coming Soon</SelectItem>
            <SelectItem value="deprecated">Deprecated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Product Grid Grouped by Product Family */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Globe size={40} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">No products found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {search ? "Try a different search term" : 'Click "Add Product" to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-10">
          {Object.entries(
            filtered.reduce((acc, p) => {
              const family = p.productFamily || p.saasId || "Uncategorized";
              if (!acc[family]) acc[family] = [];
              acc[family].push(p);
              return acc;
            }, {} as Record<string, Product[]>)
          )
          .sort(([familyA, productsA], [familyB, productsB]) => {
            const activeA = productsA.some(p => p.status === "active");
            const activeB = productsB.some(p => p.status === "active");
            if (activeA && !activeB) return -1;
            if (!activeA && activeB) return 1;
            return familyA.localeCompare(familyB);
          })
          .map(([family, groupProducts]) => {
            const familyRevenue = groupProducts.reduce((sum, p) => sum + ((p.monthlyPriceInr || 0) / 100) * (p.subscribers || 0), 0);
            const familySubscribers = groupProducts.reduce((sum, p) => sum + (p.subscribers || 0), 0);
            return (
            <div key={family} className="space-y-4">
              <div className="flex items-center gap-3 px-1">
                <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                  <Globe size={14} className="text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold tracking-tight capitalize">{family.replace(/-/g, " ")}</h2>
                    <Badge variant="outline" className="text-[10px] py-0 h-4 bg-gray-50 font-mono">{family}</Badge>
                    <Badge variant="outline" className="text-[10px] py-0 h-4 bg-gray-50">{groupProducts.length} plan{groupProducts.length !== 1 ? "s" : ""}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {familySubscribers.toLocaleString()} subscribers · ₹{familyRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}/mo
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {groupProducts
                  .sort((a, b) => {
                    // Active first, then by tier priority
                    if (a.status === "active" && b.status !== "active") return -1;
                    if (a.status !== "active" && b.status === "active") return 1;
                    const tiers = ["free", "standard", "pro", "enterprise"];
                    return tiers.indexOf(a.planTier || "") - tiers.indexOf(b.planTier || "");
                  })
                  .map((product) => {
                    const statusClass = statusColors[product.status] || "bg-gray-100 text-gray-700 border-gray-200";
                    const statusLabel = product.status === "coming-soon" ? "Coming Soon"
                      : product.status.charAt(0).toUpperCase() + product.status.slice(1);
                    const monthlyRevenue = ((product.monthlyPriceInr || 0) / 100) * (product.subscribers || 0);
                    const features = safeParse<string[]>(product.features, []);
                    const monthlyInr = product.monthlyPriceInr ? (product.monthlyPriceInr / 100) : null;
                    const yearlyInr = product.yearlyPriceInr ? (product.yearlyPriceInr / 100) : null;

                    return (
                      <Card key={product.id} className={`relative overflow-hidden group border hover:shadow-md transition-shadow ${product.status !== 'active' ? 'opacity-75 grayscale-[0.3]' : ''}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-semibold text-base truncate">{product.name}</h3>
                                {product.featured === "yes" && (
                                  <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">Featured</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusClass}`}>{statusLabel}</span>
                                {product.planTier && (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${planTierColors[product.planTier] || "bg-gray-100 text-gray-700"}`}>
                                    {product.planTier}
                                  </span>
                                )}
                                {product.isFreeTier === 1 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Free Tier</span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 font-mono">{product.saasId}</p>
                              {product.productFamily && product.productFamily !== product.saasId && (
                                <p className="text-[10px] text-muted-foreground/60 font-mono">family: {product.productFamily}</p>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" disabled={deletingId === product.id}>
                                  {deletingId === product.id ? <Loader2 size={14} className="animate-spin" /> : <MoreVertical size={14} />}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem onClick={() => openEdit(product)}>
                                  <Pencil size={14} className="mr-2" /> Edit Product
                                </DropdownMenuItem>
                                {product.domain && (
                                  <DropdownMenuItem asChild>
                                    <a href={product.domain.startsWith("http") ? product.domain : `https://${product.domain}`} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink size={14} className="mr-2" /> Visit Site
                                    </a>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={e => e.preventDefault()}>
                                      <Trash2 size={14} className="mr-2" /> Delete
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete {product.name}?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This permanently removes the product and all associated subscription data. This action cannot be undone.
                                      </AlertDialogDescription>
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
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0">
                          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>

                          {/* Pricing block */}
                          <div className="rounded-lg bg-muted/40 border p-3 space-y-1.5">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pricing</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground">Monthly (INR)</p>
                                <p className="font-semibold">{monthlyInr ? `₹${monthlyInr.toLocaleString("en-IN")}` : <span className="text-muted-foreground text-xs">—</span>}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Yearly (INR)</p>
                                <p className="font-semibold">{yearlyInr ? `₹${yearlyInr.toLocaleString("en-IN")}` : <span className="text-muted-foreground text-xs">—</span>}</p>
                              </div>
                            </div>
                          </div>

                          {/* Features preview */}
                          {features.length > 0 && (
                            <div className="space-y-1">
                              {features.slice(0, 3).map((f, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                                  <span className="truncate">{f}</span>
                                </div>
                              ))}
                              {features.length > 3 && (
                                <p className="text-xs text-muted-foreground pl-4">+{features.length - 3} more</p>
                              )}
                            </div>
                          )}

                          {/* Footer stats */}
                          <div className="flex items-center justify-between pt-2 border-t text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Users size={12} /> {(product.subscribers || 0).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1 text-emerald-600 font-medium">
                              <TrendingUp size={12} /> ₹{monthlyRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}/mo
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* ───────── Create / Edit Dialog ───────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              {editProduct ? "Update the product details and pricing." : "Fill in the details to create a new SaaS product in the SSS catalog."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* ── Section 1: General Info ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe size={15} className="text-primary" />
                <h3 className="text-sm font-semibold">General Info</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>SaaS ID <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="auraflow_pro"
                    value={form.saasId}
                    onChange={e => setField("saasId", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    className="font-mono text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">Unique plan key, e.g. <code>auraflow_pro</code></p>
                </div>
                <div className="space-y-1.5">
                  <Label>Product Family <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="auraflow"
                    value={form.productFamily}
                    onChange={e => setField("productFamily", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    className="font-mono text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">Shared app id across all plans, e.g. <code>auraflow</code>. Used for JWT scopes &amp; GTM.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Product Name <span className="text-destructive">*</span></Label>
                  <Input placeholder="AuraFlow Pro" value={form.name} onChange={e => setField("name", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tag / Category</Label>
                  <Input placeholder="workflow-ai" value={form.tag} onChange={e => setField("tag", e.target.value)} />
                  <p className="text-[10px] text-muted-foreground">Groups plans visually in the admin panel</p>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Domain <span className="text-destructive">*</span></Label>
                  <Input placeholder="auraflow.codeswayam.com" value={form.domain} onChange={e => setField("domain", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea rows={2} placeholder="Brief product description..." value={form.description} onChange={e => setField("description", e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setField("status", v)}>
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
                  <Select value={form.featured} onValueChange={v => setField("featured", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Subscribers</Label>
                  <Input type="number" placeholder="0" min="0" value={form.subscribers} onChange={e => setField("subscribers", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Icon URL</Label>
                <Input placeholder="https://cdn.example.com/icon.svg" value={form.icon} onChange={e => setField("icon", e.target.value)} />
              </div>
            </div>

            <Separator />

            {/* ── Section 2: Subscription Pricing ── */}
            {form.planTier !== "free" ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2">
                  <IndianRupee size={15} className="text-primary" />
                  <h3 className="text-sm font-semibold">Subscription Pricing</h3>
                  <span className="text-xs text-muted-foreground">(Enter in ₹ / $, e.g. 999 for ₹999/mo)</span>
                </div>

                {/* INR Pricing */}
                <div className="rounded-lg border p-4 space-y-3 bg-gray-50/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">🇮🇳 Indian Rupee (INR)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Monthly Price (₹)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                        <Input type="number" placeholder="999" min="0" className="pl-7 bg-white" value={form.monthlyPriceInr} onChange={e => setField("monthlyPriceInr", e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Yearly Price (₹)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                        <Input type="number" placeholder="9999" min="0" className="pl-7 bg-white" value={form.yearlyPriceInr} onChange={e => setField("yearlyPriceInr", e.target.value)} />
                      </div>
                      {form.monthlyPriceInr && form.yearlyPriceInr && (
                        <p className="text-[10px] text-emerald-600 font-medium">
                          Saves ₹{Math.max(0, (parseFloat(form.monthlyPriceInr) * 12) - parseFloat(form.yearlyPriceInr)).toLocaleString("en-IN")} vs monthly
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* USD Pricing */}
                <div className="rounded-lg border p-4 space-y-3 bg-gray-50/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">🌍 US Dollar (USD)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Monthly Price ($)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                        <Input type="number" placeholder="12" min="0" className="pl-7 bg-white" value={form.monthlyPriceUsd} onChange={e => setField("monthlyPriceUsd", e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Yearly Price ($)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                        <Input type="number" placeholder="120" min="0" className="pl-7 bg-white" value={form.yearlyPriceUsd} onChange={e => setField("yearlyPriceUsd", e.target.value)} />
                      </div>
                      {form.monthlyPriceUsd && form.yearlyPriceUsd && (
                        <p className="text-[10px] text-emerald-600 font-medium">
                          Saves ${Math.max(0, (parseFloat(form.monthlyPriceUsd) * 12) - parseFloat(form.yearlyPriceUsd)).toFixed(0)} vs monthly
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <Separator />
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 mb-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Sparkles size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-900">Free Tier Selected</p>
                  <p className="text-xs text-emerald-700">Pricing details are hidden as this plan will be free for all users.</p>
                </div>
              </div>
            )}

            {/* ── Section 3: Advanced / Plan Configuration ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-primary" />
                <h3 className="text-sm font-semibold">Plan Configuration</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Plan Tier</Label>
                  <Select value={form.planTier} onValueChange={v => setField("planTier", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Free Tier Available?</Label>
                  <Select value={form.isFreeTier ? "yes" : "no"} onValueChange={v => setField("isFreeTier", v === "yes")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes — Has Free Plan</SelectItem>
                      <SelectItem value="no">No — Paid Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Shows "Free Forever" badge on pricing cards</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Free Trial Days</Label>
                  <Input
                    type="number"
                    min="0"
                    max="90"
                    placeholder="0"
                    value={form.trialDays ?? ""}
                    onChange={e => setField("trialDays", e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">0 = no trial. Users get full access for this many days before billing starts.</p>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-1.5">
                <Label>Features</Label>
                <Textarea
                  rows={3}
                  placeholder="Unlimited flows, Real-time collaboration, 4K exports, Priority support"
                  value={form.featuresText}
                  onChange={e => setField("featuresText", e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  Comma-separated list. These are automatically displayed in pricing cards and checkout flows.
                </p>
              </div>

              {/* Usage Limits */}
              <div className="space-y-1.5">
                <Label>Usage Limits (JSON)</Label>
                <Textarea
                  rows={3}
                  placeholder={`{"generations": 5000, "seats": 3, "storage_gb": 10}`}
                  value={form.usageLimitsText}
                  onChange={e => {
                    setField("usageLimitsText", e.target.value);
                    setUsageLimitsError("");
                  }}
                  className={usageLimitsError ? "border-destructive" : ""}
                />
                {usageLimitsError ? (
                  <p className="text-[10px] text-destructive font-medium">{usageLimitsError}</p>
                ) : (
                  <p className="text-[10px] text-muted-foreground">
                    Valid JSON object. Used by downstream apps to enforce soft caps. Leave empty if unlimited.
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-background py-3 border-t -mx-6 px-6 mt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-28">
              {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
              {editProduct ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
