"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, RefreshCw, Clock, CheckCircle2, ArrowRight, CalendarDays, Users, Zap, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { fetchTrialSubscriptions, convertTrialToActive, extendTrial } from "@/lib/api";

interface TrialSubscription {
  id: number;
  userId: number;
  userName: string | null;
  userEmail: string | null;
  productName: string | null;
  bundleName: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  status: string;
}

function daysLeft(dateStr: string | null): number {
  if (!dateStr) return 0;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function TrialBadge({ days }: { days: number }) {
  if (days === 0) return <Badge variant="destructive" className="text-xs">Expired</Badge>;
  if (days <= 2) return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">{days}d left</Badge>;
  if (days <= 5) return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">{days}d left</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">{days}d left</Badge>;
}

export default function TrialsPage() {
  const [trials, setTrials] = useState<TrialSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<number | null>(null);
  const [extendDialog, setExtendDialog] = useState<{ open: boolean; id: number | null; days: string }>({
    open: false, id: null, days: "7",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTrialSubscriptions();
      setTrials(Array.isArray(data) ? data : []);
    } catch {
      setTrials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleConvert = async (id: number) => {
    setActioning(id);
    try {
      await convertTrialToActive(id);
      toast.success("Trial converted to active subscription");
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to convert trial");
    } finally {
      setActioning(null);
    }
  };

  const handleExtend = async () => {
    if (!extendDialog.id) return;
    const days = Number(extendDialog.days);
    if (!days || days < 1 || days > 90) { toast.error("Enter 1–90 days"); return; }
    setActioning(extendDialog.id);
    try {
      await extendTrial(extendDialog.id, days);
      toast.success(`Trial extended by ${days} days`);
      setExtendDialog({ open: false, id: null, days: "7" });
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to extend trial");
    } finally {
      setActioning(null);
    }
  };

  const expiring = trials.filter(t => daysLeft(t.trialEndsAt) <= 3);
  const active = trials.filter(t => daysLeft(t.trialEndsAt) > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trial Management</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage free trial subscriptions</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Trials", value: trials.length, icon: Users, bg: "bg-violet-100", ic: "text-violet-600" },
          { label: "Active Trials", value: active.length, icon: Zap, bg: "bg-emerald-100", ic: "text-emerald-600" },
          { label: "Expiring Soon", value: expiring.length, icon: AlertTriangle, bg: "bg-amber-100", ic: "text-amber-600" },
          { label: "Expired", value: trials.filter(t => daysLeft(t.trialEndsAt) === 0).length, icon: Clock, bg: "bg-red-100", ic: "text-red-600" },
        ].map(s => (
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

      {/* Expiring Soon Banner */}
      {expiring.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900">{expiring.length} trial{expiring.length !== 1 ? "s" : ""} expiring within 3 days</p>
            <p className="text-xs text-amber-700 mt-0.5">Consider sending a conversion email or extending their trial to improve conversion rate.</p>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : trials.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl text-muted-foreground">
          <CalendarDays size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No trial subscriptions</p>
          <p className="text-sm mt-1">Set trial_days on a SaaS product to enable free trials</p>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Trial Ends</TableHead>
                  <TableHead>Days Left</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trials.map(trial => {
                  const days = daysLeft(trial.trialEndsAt);
                  return (
                    <TableRow key={trial.id} className={days === 0 ? "opacity-60" : ""}>
                      <TableCell>
                        <p className="font-medium text-sm">{trial.userName || "—"}</p>
                        <p className="text-xs text-muted-foreground">{trial.userEmail}</p>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {trial.productName || trial.bundleName || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {trial.trialEndsAt
                          ? new Date(trial.trialEndsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </TableCell>
                      <TableCell><TrialBadge days={days} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(trial.createdAt).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => setExtendDialog({ open: true, id: trial.id, days: "7" })}
                            disabled={actioning === trial.id}
                          >
                            <CalendarDays size={12} /> Extend
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1 bg-violet-600 hover:bg-violet-700"
                            onClick={() => handleConvert(trial.id)}
                            disabled={actioning === trial.id}
                          >
                            {actioning === trial.id
                              ? <Loader2 size={12} className="animate-spin" />
                              : <><CheckCircle2 size={12} /> Convert</>
                            }
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Extend Dialog */}
      <Dialog open={extendDialog.open} onOpenChange={v => !v && setExtendDialog(p => ({ ...p, open: false }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays size={18} className="text-violet-600" /> Extend Trial
            </DialogTitle>
            <DialogDescription>
              Add more days to this user's free trial period.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Additional Days (1–90)</Label>
              <Input
                type="number"
                min={1}
                max={90}
                value={extendDialog.days}
                onChange={e => setExtendDialog(p => ({ ...p, days: e.target.value }))}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialog(p => ({ ...p, open: false }))}>Cancel</Button>
            <Button onClick={handleExtend} disabled={actioning !== null}>
              {actioning !== null ? <Loader2 size={14} className="animate-spin mr-1" /> : <ArrowRight size={14} className="mr-1" />}
              Extend Trial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
