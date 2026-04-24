"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Ticket, Users, Coins, Loader2 } from "lucide-react";
import {
  createAdminCoupon,
  deleteAdminCoupon,
  fetchAdminCoupons,
  fetchAdminReferrals,
  updateAdminCoupon,
} from "@/lib/api";

type Coupon = {
  id: number;
  code: string;
  pointsAwarded: number;
  maxUses: number;
  usesCount: number;
  isActive: number;
  expiresAt: string | null;
  createdAt: string;
};

type ReferralRow = {
  id: number;
  createdAt: string;
  status: string;
  pointsAwarded: number;
  referrerId: number;
  referrerName: string | null;
  referrerEmail: string | null;
  redeemerId: number;
  redeemerName: string | null;
  redeemerEmail: string | null;
};

export default function RewardsPage() {
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [summary, setSummary] = useState({ totalReferrals: 0, totalPointsAwarded: 0 });
  const [tab, setTab] = useState<"coupons" | "referrals">("coupons");

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    pointsAwarded: "",
    maxUses: "0",
    isActive: "1",
    expiresAt: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [couponData, referralData] = await Promise.all([
        fetchAdminCoupons(),
        fetchAdminReferrals(200),
      ]);

      setCoupons(couponData || []);
      setReferrals(referralData?.items || []);
      setSummary({
        totalReferrals: referralData?.summary?.totalReferrals || 0,
        totalPointsAwarded: referralData?.summary?.totalPointsAwarded || 0,
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to load rewards data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeCoupons = useMemo(() => coupons.filter((c) => c.isActive === 1).length, [coupons]);
  const totalCouponClaims = useMemo(() => coupons.reduce((acc, c) => acc + (c.usesCount || 0), 0), [coupons]);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: "", pointsAwarded: "", maxUses: "0", isActive: "1", expiresAt: "" });
    setOpenDialog(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      pointsAwarded: String(coupon.pointsAwarded),
      maxUses: String(coupon.maxUses || 0),
      isActive: String(coupon.isActive ?? 1),
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : "",
    });
    setOpenDialog(true);
  };

  const saveCoupon = async () => {
    if (!form.code.trim() || !form.pointsAwarded) {
      toast.error("Code and points are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        pointsAwarded: Number(form.pointsAwarded),
        maxUses: Number(form.maxUses || 0),
        isActive: Number(form.isActive || 1),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      };

      if (editing) {
        await updateAdminCoupon(editing.id, payload);
        toast.success("Coupon updated");
      } else {
        await createAdminCoupon(payload);
        toast.success("Coupon created");
      }

      setOpenDialog(false);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  };

  const archiveCoupon = async (id: number) => {
    try {
      await deleteAdminCoupon(id);
      setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: 0 } : c)));
      toast.success("Coupon archived");
    } catch (err: any) {
      toast.error(err?.message || "Failed to archive coupon");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rewards Management</h1>
          <p className="text-muted-foreground mt-1">Manage coupon campaigns and monitor referral rewards.</p>
        </div>
        {tab === "coupons" && (
          <Button onClick={openCreate} className="gap-2">
            <Plus size={16} /> New Coupon
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-5 flex items-center gap-3"><Ticket className="text-violet-600" size={20} /><div><p className="text-2xl font-bold">{coupons.length}</p><p className="text-sm text-muted-foreground">Total Coupons</p></div></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-3"><Coins className="text-emerald-600" size={20} /><div><p className="text-2xl font-bold">{activeCoupons}</p><p className="text-sm text-muted-foreground">Active Coupons</p></div></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-3"><Users className="text-blue-600" size={20} /><div><p className="text-2xl font-bold">{summary.totalReferrals}</p><p className="text-sm text-muted-foreground">Total Referrals</p></div></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-3"><Coins className="text-amber-600" size={20} /><div><p className="text-2xl font-bold">{summary.totalPointsAwarded.toLocaleString()}</p><p className="text-sm text-muted-foreground">Referral Points Awarded</p></div></CardContent></Card>
      </div>

      <div className="flex gap-2 border-b">
        <button className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === "coupons" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`} onClick={() => setTab("coupons")}>Coupons</button>
        <button className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === "referrals" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`} onClick={() => setTab("referrals")}>Referrals</button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin" /></div>
      ) : tab === "coupons" ? (
        <div className="border rounded-xl overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                {['Code', 'Points', 'Usage', 'Expires', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr><td className="px-4 py-12 text-center text-muted-foreground" colSpan={6}>No coupons found.</td></tr>
              ) : coupons.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                  <td className="px-4 py-3">{c.pointsAwarded}</td>
                  <td className="px-4 py-3">{c.usesCount}{c.maxUses > 0 ? ` / ${c.maxUses}` : " / Unlimited"}</td>
                  <td className="px-4 py-3">{c.expiresAt ? new Date(c.expiresAt).toLocaleString() : 'Never'}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={c.isActive ? "text-green-700 border-green-200" : "text-gray-600"}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(c)} className="gap-1"><Pencil size={14} /> Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => archiveCoupon(c.id)} className="gap-1 text-destructive"><Trash2 size={14} /> Archive</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                {['Date', 'Referrer', 'Redeemer', 'Points', 'Status'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {referrals.length === 0 ? (
                <tr><td className="px-4 py-12 text-center text-muted-foreground" colSpan={5}>No referral activity found.</td></tr>
              ) : referrals.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.referrerName || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">{r.referrerEmail || '-'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.redeemerName || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">{r.redeemerEmail || '-'}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">+{r.pointsAwarded}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Coupon Code</Label>
              <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="WELCOME50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Points Awarded</Label>
                <Input type="number" min={1} value={form.pointsAwarded} onChange={(e) => setForm((p) => ({ ...p, pointsAwarded: e.target.value }))} />
              </div>
              <div>
                <Label>Max Uses (0 = unlimited)</Label>
                <Input type="number" min={0} value={form.maxUses} onChange={(e) => setForm((p) => ({ ...p, maxUses: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status (1 active / 0 inactive)</Label>
                <Input type="number" min={0} max={1} value={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.value }))} />
              </div>
              <div>
                <Label>Expires At (optional)</Label>
                <Input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={saveCoupon} disabled={saving}>{saving ? "Saving..." : editing ? "Update Coupon" : "Create Coupon"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="text-xs text-muted-foreground">Coupon claims tracked: {totalCouponClaims.toLocaleString()}</div>
    </div>
  );
}
