"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2, Package, Users, IndianRupee, Layers, RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { fetchSubscriptions, fetchBundles, createBundle, updateBundle, deleteBundle, fetchProducts } from "@/lib/api";
import { ErrorState } from "@/components/ErrorState";
import { usePagination, Pagination } from "@/components/Pagination";
import { ExportButton } from "@/components/dashboard/ExportButton";
import { exportToCSV, exportToJSON } from "@/lib/export/csv-exporter";
import { exportToPDF } from "@/lib/export/pdf-exporter";

interface Subscription {
  id: number;
  userId: number;
  userName: string | null;
  userEmail: string | null;
  status: string;
  planType: string;
  billingCycle: string | null;
  amount: number | null;           // in paise
  currency: string | null;
  razorpayPaymentId: string | null;
  canceledAt: string | null;
  productName: string | null;
  bundleName: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface Bundle {
  id: number;
  name: string;
  description: string | null;
  price: number;
  monthlyPriceInr?: number;
  yearlyPriceInr?: number;
  monthlyPriceUsd?: number;
  yearlyPriceUsd?: number;
  features?: string | null;
  creditPoints?: number | null;
  status: string;
  createdAt: string;
  items: { bundleId: number; saasProductId: number; productName: string | null; productSaasId: string | null }[];
}

interface Product { id: number; name: string; saasId: string; price: number | null; }

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  past_due: "bg-amber-100 text-amber-700",
  expired: "bg-amber-100 text-amber-700",
  canceled: "bg-red-100 text-red-700",
  pending_cancellation: "bg-orange-100 text-orange-700",
};

export function isSubscriptionExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

export function getEffectiveStatus(sub: { status: string; expiresAt?: string | null }): string {
  if (sub.status === "active" && isSubscriptionExpired(sub.expiresAt)) {
    return "expired";
  }
  return sub.status;
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "active") return <CheckCircle2 size={13} className="text-emerald-600" />;
  if (status === "canceled") return <XCircle size={13} className="text-red-500" />;
  if (status === "expired") return <Clock size={13} className="text-amber-500" />;
  return <Clock size={13} className="text-amber-500" />;
};

const emptyBundleForm = { 
  name: "", description: "", price: "", status: "active", 
  monthlyPriceInr: "", yearlyPriceInr: "", monthlyPriceUsd: "", yearlyPriceUsd: "", 
  features: "", creditPoints: "", productIds: [] as number[] 
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bundleDialog, setBundleDialog] = useState(false);
  const [editBundle, setEditBundle] = useState<Bundle | null>(null);
  const [bundleForm, setBundleForm] = useState<{ 
    name: string; description: string; price: string; status: string; 
    monthlyPriceInr: string; yearlyPriceInr: string; monthlyPriceUsd: string; yearlyPriceUsd: string; 
    features: string; creditPoints: string; productIds: number[] 
  }>(emptyBundleForm);
  const [saving, setSaving] = useState(false);

  const subPagination = usePagination(subscriptions, 25);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([fetchSubscriptions(), fetchBundles(), fetchProducts()])
      .then(([subs, buns, prods]) => {
        // Subscriptions table strictly displays commercial/paid customer commitments
        const paidSubs = (subs || []).filter((s: Subscription) => 
          (s.amount != null && s.amount > 0) || 
          (s.productName && !s.productName.toLowerCase().includes('free'))
        );
        setSubscriptions(paidSubs);
        setBundles(buns);
        setProducts(prods);
      })
      .catch((err) => setError(err.message || "Failed to load data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreateBundle = () => { setBundleForm(emptyBundleForm); setEditBundle(null); setBundleDialog(true); };
  const openEditBundle = (b: Bundle) => {
    let feats = "";
    if (b.features) {
      try { feats = JSON.parse(b.features).join(", "); } catch (e) { feats = ""; }
    }
    setBundleForm({ 
      name: b.name, description: b.description || "", price: String(b.price), status: b.status || "active", 
      monthlyPriceInr: b.monthlyPriceInr ? String(b.monthlyPriceInr / 100) : "",
      yearlyPriceInr: b.yearlyPriceInr ? String(b.yearlyPriceInr / 100) : "",
      monthlyPriceUsd: b.monthlyPriceUsd ? String(b.monthlyPriceUsd / 100) : "",
      yearlyPriceUsd: b.yearlyPriceUsd ? String(b.yearlyPriceUsd / 100) : "",
      features: feats,
      creditPoints: b.creditPoints != null ? String(b.creditPoints) : "",
      productIds: b.items.map(i => i.saasProductId) 
    });
    setEditBundle(b);
    setBundleDialog(true);
  };

  const toggleProduct = (id: number) => {
    setBundleForm(p => ({ ...p, productIds: p.productIds.includes(id) ? p.productIds.filter(x => x !== id) : [...p.productIds, id] }));
  };

  const handleSaveBundle = async () => {
    if (!bundleForm.name.trim()) { toast.error("Bundle name is required"); return; }
    if (!bundleForm.price || isNaN(Number(bundleForm.price))) { toast.error("Valid price is required"); return; }
    setSaving(true);
    try {
      let parsedFeatures = undefined;
      if (bundleForm.features.trim()) {
        parsedFeatures = bundleForm.features.split(",").map(f => f.trim()).filter(Boolean);
      }

      const payload = { 
        name: bundleForm.name, 
        description: bundleForm.description, 
        price: Number(bundleForm.price), 
        monthlyPriceInr: bundleForm.monthlyPriceInr ? Number(bundleForm.monthlyPriceInr) * 100 : undefined,
        yearlyPriceInr: bundleForm.yearlyPriceInr ? Number(bundleForm.yearlyPriceInr) * 100 : undefined,
        monthlyPriceUsd: bundleForm.monthlyPriceUsd ? Number(bundleForm.monthlyPriceUsd) * 100 : undefined,
        yearlyPriceUsd: bundleForm.yearlyPriceUsd ? Number(bundleForm.yearlyPriceUsd) * 100 : undefined,
        features: parsedFeatures,
        creditPoints: bundleForm.creditPoints ? Number(bundleForm.creditPoints) : 0,
        status: bundleForm.status, 
        productIds: bundleForm.productIds 
      };
      if (editBundle) {
        const updated = await updateBundle(editBundle.id, payload);
        setBundles(prev => prev.map(b => b.id === editBundle.id ? { ...b, ...updated, items: b.items } : b));
        toast.success("Bundle updated!");
      } else {
        const created = await createBundle(payload);
        setBundles(prev => [...prev, { ...created, items: [] }]);
        toast.success("Bundle created!");
      }
      setBundleDialog(false);
      load(); // reload to get full data
    } catch (err: any) { toast.error(err.message || "Failed to save bundle"); }
    setSaving(false);
  };

  const handleDeleteBundle = async (id: number) => {
    try {
      await deleteBundle(id);
      setBundles(prev => prev.filter(b => b.id !== id));
      toast.success("Bundle deleted");
    } catch { toast.error("Failed to delete bundle"); }
  };

  const activeSubs = subscriptions.filter(s => getEffectiveStatus(s) === "active");
  const stats = {
    total: subscriptions.length,
    active: activeSubs.length,
    // Revenue: sum of actual active subscription amounts (in paise → convert to rupees for display)
    revenuePaise: activeSubs.reduce((sum, s) => {
      const mo = s.billingCycle === "yearly" ? Math.round((s.amount ?? 0) / 12) : (s.amount ?? 0);
      return sum + mo;
    }, 0),
    bundles: bundles.length,
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (error) return <ErrorState error={error} onRetry={load} />;

  const handleExportSubscriptions = async (format: "csv" | "pdf" | "json") => {
    if (subscriptions.length === 0) {
      toast.error("No subscriptions to export");
      return;
    }

    const data = subscriptions.map((s) => ({
      id: s.id,
      user: s.userName || "—",
      email: s.userEmail || "—",
      planType: s.planType?.replace(/_/g, " ") || "—",
      productOrBundle: s.productName || s.bundleName || "—",
      billingCycle: s.billingCycle || "—",
      amountInr: s.amount != null ? s.amount / 100 : 0,
      currency: s.currency || "INR",
      status: getEffectiveStatus(s),
      paymentId: s.razorpayPaymentId || "—",
      expiresAt: s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : "Never",
      createdAt: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—",
    }));

    if (format === "csv") {
      exportToCSV(data, "subscriptions_export", [
        { key: "id", header: "Subscription ID" },
        { key: "user", header: "User Name" },
        { key: "email", header: "User Email" },
        { key: "planType", header: "Plan Type" },
        { key: "productOrBundle", header: "Product / Bundle" },
        { key: "billingCycle", header: "Cycle" },
        { key: "amountInr", header: "Amount (INR)" },
        { key: "currency", header: "Currency" },
        { key: "status", header: "Status" },
        { key: "paymentId", header: "Payment ID" },
        { key: "expiresAt", header: "Expires At" },
        { key: "createdAt", header: "Created At" },
      ]);
      toast.success(`Exported ${data.length} subscriptions to CSV`);
    } else if (format === "pdf") {
      await exportToPDF(
        data,
        "subscriptions_export",
        [
          { key: "id", header: "ID" },
          { key: "user", header: "User" },
          { key: "email", header: "Email" },
          { key: "productOrBundle", header: "Product/Bundle" },
          { key: "billingCycle", header: "Cycle" },
          { key: "amountInr", header: "Amount (Rs)" },
          { key: "status", header: "Status" },
          { key: "expiresAt", header: "Expires" },
        ],
        {
          title: "User Subscriptions Directory",
          subtitle: `Total: ${data.length} subscriptions • Exported on ${new Date().toLocaleDateString()}`,
        }
      );
      toast.success(`Exported ${data.length} subscriptions to PDF`);
    } else if (format === "json") {
      exportToJSON(data, "subscriptions_export");
      toast.success(`Exported ${data.length} subscriptions to JSON`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground mt-1">Manage user subscriptions and product bundles</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButton
            onExportCSV={() => handleExportSubscriptions("csv")}
            onExportPDF={() => handleExportSubscriptions("pdf")}
            onExportJSON={() => handleExportSubscriptions("json")}
            label="Export Subscriptions"
            count={subscriptions.length}
          />
          <Button variant="outline" size="sm" onClick={load}><RefreshCw size={14} /></Button>
          <Button onClick={openCreateBundle}><Plus size={16} /> New Bundle</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Subscriptions", value: stats.total, icon: Users, bg: "bg-violet-100", ic: "text-violet-600" },
          { label: "Active", value: stats.active, icon: CheckCircle2, bg: "bg-emerald-100", ic: "text-emerald-600" },
          { label: "Monthly Revenue", value: `₹${(stats.revenuePaise / 100).toLocaleString("en-IN")}`, icon: IndianRupee, bg: "bg-blue-100", ic: "text-blue-600" },
          { label: "Bundles", value: stats.bundles, icon: Layers, bg: "bg-amber-100", ic: "text-amber-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-start gap-4">
              <div className={`p-2.5 rounded-lg ${s.bg}`}><s.icon size={18} className={s.ic} /></div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="subscriptions">
        <TabsList>
          <TabsTrigger value="subscriptions" className="gap-1.5"><Users size={14} /> User Subscriptions</TabsTrigger>
          <TabsTrigger value="bundles" className="gap-1.5"><Layers size={14} /> Bundles</TabsTrigger>
        </TabsList>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="mt-4">
          {subscriptions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No subscriptions yet</p>
              <p className="text-sm mt-1">User subscriptions will appear here when users subscribe to your products</p>
            </div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan / Cycle</TableHead>
                    <TableHead>Product / Bundle</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Since</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subPagination.paginated.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{sub.userName || "—"}</p>
                          <p className="text-xs text-muted-foreground">{sub.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <Badge variant="outline" className="text-xs capitalize w-fit">{sub.planType?.replace(/_/g, " ")}</Badge>
                          {sub.billingCycle && (
                            <span className="text-[10px] text-muted-foreground capitalize">{sub.billingCycle}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{sub.productName || sub.bundleName || "—"}</TableCell>
                      <TableCell className="text-sm font-medium">
                        {sub.amount != null && sub.amount > 0
                          ? `${sub.currency === "USD" ? "$" : "₹"}${(sub.amount / 100).toLocaleString("en-IN")}/${sub.billingCycle === "yearly" ? "yr" : "mo"}`
                          : <span className="text-muted-foreground text-xs">Free</span>
                        }
                      </TableCell>
                      {(() => {
                        const effStatus = getEffectiveStatus(sub);
                        const isExpired = isSubscriptionExpired(sub.expiresAt);
                        return (
                          <>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[effStatus] || "bg-gray-100 text-gray-600"}`}>
                                <StatusIcon status={effStatus} />
                                {effStatus.replace(/_/g, " ")}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {sub.expiresAt ? (
                                <span className={isExpired ? "text-amber-600 font-medium" : ""}>
                                  {new Date(sub.expiresAt).toLocaleDateString()}
                                  {isExpired && " (Expired)"}
                                </span>
                              ) : "Never"}
                            </TableCell>
                          </>
                        );
                      })()}
                      <TableCell className="text-xs">
                        {sub.razorpayPaymentId
                          ? <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[120px] block" title={sub.razorpayPaymentId}>{sub.razorpayPaymentId}</span>
                          : <span className="text-muted-foreground">—</span>
                        }
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
              <Pagination
                page={subPagination.page} totalPages={subPagination.totalPages}
                total={subPagination.total} pageSize={subPagination.pageSize}
                onPageChange={subPagination.setPage} onPageSizeChange={subPagination.changePageSize}
                label="subscriptions"
              />
            </Card>
          )}
        </TabsContent>

        {/* Bundles Tab */}
        <TabsContent value="bundles" className="mt-4">
          {bundles.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No bundles yet</p>
              <p className="text-sm mt-1">Create bundles to offer multiple products at a discounted price</p>
              <Button className="mt-4" onClick={openCreateBundle}><Plus size={14} /> Create Bundle</Button>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {bundles.map((bundle) => {
                const totalSubscribers = subscriptions.filter(s => s.planType === "BUNDLE" && s.bundleName === bundle.name && s.status === "active").length;
                return (
                <Card key={bundle.id} className="group border hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                          <Layers size={18} className="text-violet-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{bundle.name}</CardTitle>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bundle.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                              {bundle.status}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users size={11} /> {totalSubscribers} active
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditBundle(bundle)}>
                          <Pencil size={13} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                              <Trash2 size={13} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete &quot;{bundle.name}&quot;?</AlertDialogTitle>
                              <AlertDialogDescription>This will delete the bundle. Existing user subscriptions will be unaffected.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDeleteBundle(bundle.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">{bundle.description || "No description"}</p>
                    <div className="flex flex-wrap gap-1">
                      {bundle.items.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No products assigned</span>
                      ) : (
                        bundle.items.map(i => <Badge key={i.saasProductId} variant="outline" className="text-xs">{i.productName}</Badge>)
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div>
                        <span className="text-lg font-bold">₹{(bundle.monthlyPriceInr ? bundle.monthlyPriceInr / 100 : bundle.price).toLocaleString()}</span>
                        <span className="text-xs font-normal text-muted-foreground">/mo</span>
                        {(bundle.yearlyPriceInr || bundle.price > 0) && (
                          <p className="text-xs text-emerald-600 font-medium">Yearly: ₹{((bundle.yearlyPriceInr ? bundle.yearlyPriceInr / 100 : bundle.price * 10)).toLocaleString()}</p>
                        )}
                        {bundle.creditPoints != null && bundle.creditPoints > 0 && (
                          <p className="text-xs text-violet-600 font-semibold mt-0.5">+{bundle.creditPoints.toLocaleString()} credits included</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{bundle.items.length} products</span>
                    </div>
                  </CardContent>
                </Card>
              )})}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Bundle Dialog */}
      <Dialog open={bundleDialog} onOpenChange={setBundleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editBundle ? "Edit Bundle" : "Create Bundle"}</DialogTitle>
            <DialogDescription>Bundles let you offer multiple SaaS products together at a single price.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Bundle Name *</Label>
                <Input placeholder="Starter Pack" value={bundleForm.name} onChange={(e) => setBundleForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Legacy Price (Internal/Reference) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                  <Input type="number" placeholder="999" className="pl-7" value={bundleForm.price} onChange={(e) => setBundleForm(p => ({ ...p, price: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 p-4 rounded-lg border bg-muted/20">
              <div className="space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">INR Pricing (Primary)</p>
                <div className="space-y-1.5">
                  <Label className="text-xs">Monthly Price (₹) *</Label>
                  <Input type="number" placeholder="999" value={bundleForm.monthlyPriceInr} onChange={(e) => setBundleForm(p => ({ ...p, monthlyPriceInr: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Yearly Price (₹)</Label>
                  <Input type="number" placeholder="9990" value={bundleForm.yearlyPriceInr} onChange={(e) => setBundleForm(p => ({ ...p, yearlyPriceInr: e.target.value }))} />
                  <p className="text-[10px] text-muted-foreground">Leave blank to disable yearly billing.</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">USD Pricing (Global)</p>
                <div className="space-y-1.5">
                  <Label className="text-xs">Monthly Price ($)</Label>
                  <Input type="number" placeholder="12" value={bundleForm.monthlyPriceUsd} onChange={(e) => setBundleForm(p => ({ ...p, monthlyPriceUsd: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Yearly Price ($)</Label>
                  <Input type="number" placeholder="120" value={bundleForm.yearlyPriceUsd} onChange={(e) => setBundleForm(p => ({ ...p, yearlyPriceUsd: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={2} placeholder="Brief bundle description..." value={bundleForm.description} onChange={(e) => setBundleForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={bundleForm.status} onValueChange={(v) => setBundleForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active — Visible to users</SelectItem>
                    <SelectItem value="inactive">Inactive — Hidden from users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Features (Comma separated)</Label>
                <Input placeholder="Feature 1, Feature 2" value={bundleForm.features} onChange={(e) => setBundleForm(p => ({ ...p, features: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Credit Points</Label>
                <Input type="number" min="0" placeholder="0" value={bundleForm.creditPoints} onChange={(e) => setBundleForm(p => ({ ...p, creditPoints: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Include Products</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {products.map((p) => {
                  const selected = bundleForm.productIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProduct(p.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-sm transition-all ${selected ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"}`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selected ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                        {selected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>}
                      </div>
                      <span className="truncate">{p.name}</span>
                    </button>
                  );
                })}
              </div>
              {bundleForm.productIds.length > 0 && (
                <p className="text-xs text-muted-foreground">{bundleForm.productIds.length} product{bundleForm.productIds.length !== 1 ? "s" : ""} selected</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBundleDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveBundle} disabled={saving}>
              {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
              {editBundle ? "Save Changes" : "Create Bundle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
