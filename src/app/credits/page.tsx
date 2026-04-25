"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Coins, Zap, Users, History, Plus, Pencil, Trash2, Loader2,
  MoreVertical, TrendingUp, AlertCircle, CheckCircle2, Star, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreditPack { id: number; name: string; description: string | null; points: number; priceInr: number; priceUsd: number | null; bonusPoints: number; isPopular: number; sortOrder: number; status: string; }
interface FeatureCost { id: number; saasId: string; featureKey: string; featureName: string; description: string | null; pointCost: number; category: string; isActive: number; showOnWebsite: number; createdAt: string; }
interface Transaction { id: number; userId: number; userName: string | null; userEmail: string | null; type: string; points: number; balanceAfter: number; description: string; saasId: string | null; featureKey: string | null; razorpayPaymentId: string | null; createdAt: string; }
interface UserBalance { userId: number; balance: number; lifetimeEarned: number; lifetimeSpent: number; updatedAt: string; userName: string | null; userEmail: string | null; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatInr(paise: number) { return `₹${(paise / 100).toLocaleString("en-IN")}`; }

const TX_COLORS: Record<string, string> = {
  purchase: "bg-green-100 text-green-700 border-green-200",
  usage:    "bg-red-100 text-red-700 border-red-200",
  refund:   "bg-blue-100 text-blue-700 border-blue-200",
  bonus:    "bg-purple-100 text-purple-700 border-purple-200",
  adjustment: "bg-amber-100 text-amber-700 border-amber-200",
  expiry:   "bg-gray-100 text-gray-600 border-gray-200",
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, bg, color }: { label: string; value: string | number; icon: React.ReactNode; bg: string; color: string }) {
  return (
    <Card><CardContent className="p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${bg}`} style={{ color }}>{icon}</div>
      <div><p className="text-2xl font-bold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>
    </CardContent></Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "packs" | "features" | "transactions" | "users";

export default function CreditsPage() {
  const [tab, setTab] = useState<Tab>("packs");

  // Data
  const [packs, setPacks]         = useState<CreditPack[]>([]);
  const [features, setFeatures]   = useState<FeatureCost[]>([]);
  const [transactions, setTx]     = useState<Transaction[]>([]);
  const [userBals, setUserBals]   = useState<UserBalance[]>([]);
  const [loading, setLoading]     = useState(true);

  // Pack dialog
  const [packDlg, setPackDlg]     = useState(false);
  const [editPack, setEditPack]   = useState<CreditPack | null>(null);
  const [packForm, setPackForm]   = useState({ name: "", description: "", points: "", priceInr: "", priceUsd: "", bonusPoints: "0", isPopular: "0", sortOrder: "0", status: "active" });

  // Feature dialog
  const [fcDlg, setFcDlg]         = useState(false);
  const [editFc, setEditFc]       = useState<FeatureCost | null>(null);
  const [fcForm, setFcForm]       = useState({ saasId: "", featureKey: "", featureName: "", description: "", pointCost: "", category: "general", isActive: "1", showOnWebsite: "1" });

  // Adjust dialog
  const [adjustDlg, setAdjustDlg] = useState<UserBalance | null>(null);
  const [adjustForm, setAdjustForm] = useState({ points: "", reason: "" });

  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [p, f, t, u] = await Promise.all([
        api("/admin/credits/packs"),
        api("/admin/credits/features"),
        api("/admin/credits/transactions"),
        api("/admin/credits/users"),
      ]);
      setPacks(p); setFeatures(f); setTx(t); setUserBals(u);
    } catch (e: any) { toast.error(e.message || "Failed to load credits data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Pack CRUD ──────────────────────────────────────────────────────────────

  const openCreatePack = () => {
    setEditPack(null);
    setPackForm({ name: "", description: "", points: "", priceInr: "", priceUsd: "", bonusPoints: "0", isPopular: "0", sortOrder: "0", status: "active" });
    setPackDlg(true);
  };

  const openEditPack = (p: CreditPack) => {
    setEditPack(p);
    setPackForm({
      name: p.name, description: p.description || "", points: String(p.points),
      priceInr: String(p.priceInr / 100), priceUsd: p.priceUsd ? String(p.priceUsd / 100) : "",
      bonusPoints: String(p.bonusPoints ?? 0), isPopular: String(p.isPopular ?? 0),
      sortOrder: String(p.sortOrder ?? 0), status: p.status,
    });
    setPackDlg(true);
  };

  const savePack = async () => {
    if (!packForm.name || !packForm.points || !packForm.priceInr) { toast.error("Name, points, and INR price are required"); return; }
    setSaving(true);
    try {
      const body = {
        name: packForm.name.trim(), description: packForm.description.trim() || undefined,
        points: Number(packForm.points),
        priceInr: Math.round(parseFloat(packForm.priceInr) * 100),
        priceUsd: packForm.priceUsd ? Math.round(parseFloat(packForm.priceUsd) * 100) : undefined,
        bonusPoints: Number(packForm.bonusPoints), isPopular: Number(packForm.isPopular),
        sortOrder: Number(packForm.sortOrder), status: packForm.status,
      };
      if (editPack) {
        const updated = await api(`/admin/credits/packs/${editPack.id}`, { method: "PATCH", body: JSON.stringify(body) });
        setPacks(prev => prev.map(p => p.id === editPack.id ? updated : p));
        toast.success("Pack updated");
      } else {
        const created = await api("/admin/credits/packs", { method: "POST", body: JSON.stringify(body) });
        setPacks(prev => [...prev, created]);
        toast.success("Pack created");
      }
      setPackDlg(false);
    } catch (e: any) { toast.error(e.message || "Failed to save pack"); }
    finally { setSaving(false); }
  };

  const deletePack = async (id: number) => {
    try {
      await api(`/admin/credits/packs/${id}`, { method: "DELETE" });
      setPacks(prev => prev.filter(p => p.id !== id));
      toast.success("Pack deleted");
    } catch { toast.error("Failed to delete pack"); }
  };

  // ── Feature Cost CRUD ──────────────────────────────────────────────────────

  const openCreateFc = () => {
    setEditFc(null);
    setFcForm({ saasId: "", featureKey: "", featureName: "", description: "", pointCost: "", category: "general", isActive: "1", showOnWebsite: "1" });
    setFcDlg(true);
  };

  const openEditFc = (f: FeatureCost) => {
    setEditFc(f);
    setFcForm({
      saasId: f.saasId, featureKey: f.featureKey, featureName: f.featureName,
      description: f.description || "", pointCost: String(f.pointCost),
      category: f.category, isActive: String(f.isActive), showOnWebsite: String(f.showOnWebsite),
    });
    setFcDlg(true);
  };

  const saveFc = async () => {
    if (!fcForm.saasId || !fcForm.featureKey || !fcForm.featureName || !fcForm.pointCost) {
      toast.error("SaaS ID, feature key, name, and cost are required"); return;
    }
    setSaving(true);
    try {
      const body = { ...fcForm, pointCost: Number(fcForm.pointCost), isActive: Number(fcForm.isActive), showOnWebsite: Number(fcForm.showOnWebsite), description: fcForm.description || undefined };
      if (editFc) {
        const u = await api(`/admin/credits/features/${editFc.id}`, { method: "PATCH", body: JSON.stringify(body) });
        setFeatures(prev => prev.map(f => f.id === editFc.id ? u : f));
        toast.success("Feature cost updated");
      } else {
        const c = await api("/admin/credits/features", { method: "POST", body: JSON.stringify(body) });
        setFeatures(prev => [...prev, c]);
        toast.success("Feature cost created");
      }
      setFcDlg(false);
    } catch (e: any) { toast.error(e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const deleteFc = async (id: number) => {
    try {
      await api(`/admin/credits/features/${id}`, { method: "DELETE" });
      setFeatures(prev => prev.filter(f => f.id !== id));
      toast.success("Feature cost deleted");
    } catch { toast.error("Failed to delete"); }
  };

  // ── Credit Adjustment ──────────────────────────────────────────────────────

  const saveAdjust = async () => {
    if (!adjustDlg || !adjustForm.points || !adjustForm.reason) { toast.error("Points and reason required"); return; }
    setSaving(true);
    try {
      const result = await api(`/admin/credits/users/${adjustDlg.userId}/adjust`, {
        method: "POST", body: JSON.stringify({ points: Number(adjustForm.points), reason: adjustForm.reason }),
      });
      toast.success(`Credits adjusted. New balance: ${result.newBalance}`);
      setAdjustDlg(null);
      setAdjustForm({ points: "", reason: "" });
      await loadAll();
    } catch (e: any) { toast.error(e.message || "Adjustment failed"); }
    finally { setSaving(false); }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────

  const totalRevenue = transactions.filter(t => t.type === "purchase" && t.points > 0).reduce((s, t) => s + t.points, 0);
  const totalSpent   = transactions.filter(t => t.type === "usage").reduce((s, t) => s + Math.abs(t.points), 0);
  const totalBalance = userBals.reduce((s, u) => s + u.balance, 0);

  // ── Tabs ───────────────────────────────────────────────────────────────────

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "packs",        label: `Credit Packs (${packs.length})`,       icon: <Coins size={15} /> },
    { id: "features",     label: `Feature Costs (${features.length})`,   icon: <Zap size={15} /> },
    { id: "transactions", label: `Transactions (${transactions.length})`, icon: <History size={15} /> },
    { id: "users",        label: `User Balances (${userBals.length})`,    icon: <Users size={15} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credits Management</h1>
          <p className="text-muted-foreground mt-1">Manage credit packs, feature costs, and user balances</p>
        </div>
        <div className="flex gap-2">
          {tab === "packs"    && <Button onClick={openCreatePack} className="gap-2"><Plus size={15} /> Add Pack</Button>}
          {tab === "features" && <Button onClick={openCreateFc}   className="gap-2"><Plus size={15} /> Add Feature Cost</Button>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Packs"      value={packs.filter(p => p.status === "active").length} icon={<Coins size={18} />}    bg="bg-violet-100" color="#7c3aed" />
        <StatCard label="Feature Rules"     value={features.length} icon={<Zap size={18} />}        bg="bg-blue-100"   color="#2563eb" />
        <StatCard label="Pts Purchased"     value={totalRevenue.toLocaleString()}  icon={<TrendingUp size={18} />} bg="bg-green-100"  color="#16a34a" />
        <StatCard label="Total Held (pts)"  value={totalBalance.toLocaleString()}  icon={<Users size={18} />}      bg="bg-amber-100"  color="#d97706" />
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            style={{ borderBottom: `2px solid ${tab === t.id ? "hsl(var(--primary))" : "transparent"}`, marginBottom: "-1px" }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* ────────── TAB: PACKS ────────── */}
          {tab === "packs" && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {packs.length === 0 ? (
                <div className="col-span-full border rounded-xl p-16 text-center text-muted-foreground">
                  <Coins size={36} className="mx-auto mb-3 opacity-30" />
                  <p>No credit packs yet. Click "Add Pack" to create one.</p>
                </div>
              ) : packs.map(pack => (
                <div key={pack.id} className="border rounded-xl p-5 relative group hover:shadow-md transition-shadow bg-card" style={{ borderColor: pack.isPopular ? "#7c3aed" : undefined }}>
                  {pack.isPopular === 1 && (
                    <Badge className="absolute top-3 right-10" style={{ backgroundColor: "#7c3aed" }}>
                      <Star size={10} className="mr-1" fill="white" /> Popular
                    </Badge>
                  )}
                  {/* Pack action menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-50 group-hover:opacity-100">
                        <MoreVertical size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditPack(pack)}><Pencil size={13} className="mr-2" /> Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={e => e.preventDefault()}>
                            <Trash2 size={13} className="mr-2" /> Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {pack.name}?</AlertDialogTitle>
                            <AlertDialogDescription>Users who already purchased this pack will keep their credits. This pack won't be available for new purchases.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deletePack(pack.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: pack.isPopular ? "#ede9fe" : "#f3f4f6" }}>
                      <Coins size={20} style={{ color: pack.isPopular ? "#7c3aed" : "#6b7280" }} />
                    </div>
                    <div>
                      <h3 className="font-bold">{pack.name}</h3>
                      {pack.description && <p className="text-xs text-muted-foreground">{pack.description}</p>}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-black">{(pack.points + (pack.bonusPoints ?? 0)).toLocaleString()}</span>
                    <span className="text-muted-foreground text-sm">pts</span>
                    {(pack.bonusPoints ?? 0) > 0 && (
                      <Badge variant="outline" className="text-amber-600 border-amber-200 text-[10px]">+{pack.bonusPoints} bonus</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mt-3 pt-3 border-t">
                    <div><p className="text-xs text-muted-foreground">INR</p><p className="font-bold">{formatInr(pack.priceInr)}</p></div>
                    <div><p className="text-xs text-muted-foreground">USD</p><p className="font-bold">{pack.priceUsd ? `$${(pack.priceUsd / 100).toFixed(2)}` : "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Status</p>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${pack.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>{pack.status}</span>
                    </div>
                    <div><p className="text-xs text-muted-foreground">Sort</p><p className="font-medium">{pack.sortOrder}</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ────────── TAB: FEATURE COSTS ────────── */}
          {tab === "features" && (
            <div className="border rounded-xl overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    {["SaaS ID", "Feature Key", "Feature Name", "Category", "Cost (pts)", "Visible", "Active", ""].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {features.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">
                      <Zap size={28} className="mx-auto mb-2 opacity-30" /><br />No feature costs yet.
                    </td></tr>
                  ) : features.map((f, i) => (
                    <tr key={f.id} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{f.saasId}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{f.featureKey}</td>
                      <td className="px-4 py-2.5 font-medium">{f.featureName}</td>
                      <td className="px-4 py-2.5 capitalize text-xs">{f.category}</td>
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-1 font-bold text-violet-700">
                          <Zap size={11} fill="#6d28d9" className="text-violet-700" /> {f.pointCost}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">{f.showOnWebsite ? <CheckCircle2 size={14} className="text-green-500" /> : <X size={14} className="text-muted-foreground" />}</td>
                      <td className="px-4 py-2.5">{f.isActive ? <CheckCircle2 size={14} className="text-green-500" /> : <X size={14} className="text-muted-foreground" />}</td>
                      <td className="px-4 py-2.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical size={13} /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditFc(f)}><Pencil size={13} className="mr-2" /> Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive" onSelect={e => e.preventDefault()}><Trash2 size={13} className="mr-2" /> Delete</DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete feature cost?</AlertDialogTitle>
                                  <AlertDialogDescription>This removes the credit cost rule for "{f.featureName}". The feature will no longer be accessible via credits.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteFc(f.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ────────── TAB: TRANSACTIONS ────────── */}
          {tab === "transactions" && (
            <div className="border rounded-xl overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    {["User", "Type", "Points", "Balance After", "Description", "SaaS", "Date"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <History size={28} className="mx-auto mb-2 opacity-30" /><br />No transactions yet.
                    </td></tr>
                  ) : transactions.map((t, i) => (
                    <tr key={t.id} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                      <td className="px-4 py-2.5">
                        <p className="font-medium">{t.userName || "?"}</p>
                        <p className="text-xs text-muted-foreground">{t.userEmail}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold capitalize ${TX_COLORS[t.type] || TX_COLORS.adjustment}`}>{t.type}</span>
                      </td>
                      <td className="px-4 py-2.5 font-bold" style={{ color: t.points > 0 ? "#16a34a" : "#dc2626" }}>
                        {t.points > 0 ? "+" : ""}{t.points.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{t.balanceAfter.toLocaleString()}</td>
                      <td className="px-4 py-2.5 max-w-[200px] truncate">{t.description}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{t.saasId || "—"}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ────────── TAB: USER BALANCES ────────── */}
          {tab === "users" && (
            <div className="border rounded-xl overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    {["User", "Balance", "Lifetime Earned", "Lifetime Spent", "Last Updated", ""].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {userBals.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Users size={28} className="mx-auto mb-2 opacity-30" /><br />No users have credits yet.
                    </td></tr>
                  ) : userBals.map((u, i) => (
                    <tr key={u.userId} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                      <td className="px-4 py-2.5">
                        <p className="font-medium">{u.userName || "—"}</p>
                        <p className="text-xs text-muted-foreground">{u.userEmail}</p>
                      </td>
                      <td className="px-4 py-2.5 font-black text-lg" style={{ color: u.balance > 0 ? "#7c3aed" : "#9ca3af" }}>
                        {u.balance.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">pts</span>
                      </td>
                      <td className="px-4 py-2.5 text-green-600 font-medium">{u.lifetimeEarned.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-red-500 font-medium">{u.lifetimeSpent.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(u.updatedAt).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-2.5">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setAdjustDlg(u); setAdjustForm({ points: "", reason: "" }); }}>
                          Adjust
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ────────── Pack Create/Edit Dialog ────────── */}
      <Dialog open={packDlg} onOpenChange={setPackDlg}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editPack ? "Edit Credit Pack" : "Add Credit Pack"}</DialogTitle>
            <DialogDescription>Configure pricing, points, and visibility for this credit pack.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Pack Name <span className="text-destructive">*</span></Label>
                <Input placeholder="Starter Pack" value={packForm.name} onChange={e => setPackForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Description</Label>
                <Textarea rows={2} placeholder="Great for light users..." value={packForm.description} onChange={e => setPackForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Points <span className="text-destructive">*</span></Label>
                <Input type="number" min="1" placeholder="100" value={packForm.points} onChange={e => setPackForm(p => ({ ...p, points: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Bonus Points</Label>
                <Input type="number" min="0" placeholder="0" value={packForm.bonusPoints} onChange={e => setPackForm(p => ({ ...p, bonusPoints: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>INR Price (₹) <span className="text-destructive">*</span></Label>
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <Input type="number" min="0" placeholder="99" className="pl-7" value={packForm.priceInr} onChange={e => setPackForm(p => ({ ...p, priceInr: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>USD Price ($)</Label>
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input type="number" min="0" placeholder="1.99" className="pl-7" value={packForm.priceUsd} onChange={e => setPackForm(p => ({ ...p, priceUsd: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Popular?</Label>
                <Select value={packForm.isPopular} onValueChange={v => setPackForm(p => ({ ...p, isPopular: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="1">Yes — Show badge</SelectItem><SelectItem value="0">No</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={packForm.status} onValueChange={v => setPackForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPackDlg(false)}>Cancel</Button>
            <Button onClick={savePack} disabled={saving} className="min-w-28">
              {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
              {editPack ? "Save Changes" : "Create Pack"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────── Feature Cost Dialog ────────── */}
      <Dialog open={fcDlg} onOpenChange={setFcDlg}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editFc ? "Edit Feature Cost" : "Add Feature Cost"}</DialogTitle>
            <DialogDescription>Define how many credits a SaaS feature costs per usage.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>SaaS ID <span className="text-destructive">*</span></Label>
                <Input placeholder="auraflow" value={fcForm.saasId} onChange={e => setFcForm(p => ({ ...p, saasId: e.target.value }))} className="font-mono text-sm" />
                <p className="text-[10px] text-muted-foreground">Must match product saasId</p>
              </div>
              <div className="space-y-1.5">
                <Label>Feature Key <span className="text-destructive">*</span></Label>
                <Input placeholder="ai_summary" value={fcForm.featureKey} onChange={e => setFcForm(p => ({ ...p, featureKey: e.target.value }))} className="font-mono text-sm" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Feature Name <span className="text-destructive">*</span></Label>
                <Input placeholder="AI Article Summary" value={fcForm.featureName} onChange={e => setFcForm(p => ({ ...p, featureName: e.target.value }))} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Description</Label>
                <Textarea rows={2} placeholder="Generates a summary using AI..." value={fcForm.description} onChange={e => setFcForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Point Cost <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Zap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-500" />
                  <Input type="number" min="1" placeholder="5" className="pl-8" value={fcForm.pointCost} onChange={e => setFcForm(p => ({ ...p, pointCost: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={fcForm.category} onValueChange={v => setFcForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai">AI</SelectItem><SelectItem value="export">Export</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem><SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Active?</Label>
                <Select value={fcForm.isActive} onValueChange={v => setFcForm(p => ({ ...p, isActive: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="1">Active</SelectItem><SelectItem value="0">Disabled</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Show on Website?</Label>
                <Select value={fcForm.showOnWebsite} onValueChange={v => setFcForm(p => ({ ...p, showOnWebsite: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="1">Yes</SelectItem><SelectItem value="0">No</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFcDlg(false)}>Cancel</Button>
            <Button onClick={saveFc} disabled={saving} className="min-w-28">
              {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
              {editFc ? "Save Changes" : "Add Feature Cost"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────── Credit Adjustment Dialog ────────── */}
      <Dialog open={!!adjustDlg} onOpenChange={() => setAdjustDlg(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adjust Credits</DialogTitle>
            <DialogDescription>
              {adjustDlg ? `Manually add or remove credits for ${adjustDlg.userName || adjustDlg.userEmail}. Current balance: ${adjustDlg.balance.toLocaleString()} pts` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Points (use negative to deduct)</Label>
              <Input type="number" placeholder="e.g. 100 or -50" value={adjustForm.points} onChange={e => setAdjustForm(p => ({ ...p, points: e.target.value }))} />
              <p className="text-[10px] text-muted-foreground">Positive = add credits · Negative = remove credits</p>
            </div>
            <div className="space-y-1.5">
              <Label>Reason <span className="text-destructive">*</span></Label>
              <Textarea rows={2} placeholder="Refund for accidental charge, promotional bonus..." value={adjustForm.reason} onChange={e => setAdjustForm(p => ({ ...p, reason: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDlg(null)}>Cancel</Button>
            <Button onClick={saveAdjust} disabled={saving} className="min-w-28">
              {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
              Apply Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
