"use client";

import { useEffect, useState } from "react";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  CheckCircle, XCircle, Loader2, UserX, CreditCard, AlertCircle, RefreshCw, MessageSquare
} from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  fetchPendingCancellations, approveCancellation, rejectCancellation,
  fetchPendingDeletions, approveDeletion, rejectDeletion 
} from "@/lib/api";

function calculateSubscriptionProration(item: any) {
  const rawAmount = Number(item?.amount) || 0;
  // In user_subscriptions table, amount is stored in paise (e.g. 149900 = 1499 INR).
  // Normalize paise to rupees:
  const amount = rawAmount >= 100 ? Math.round(rawAmount / 100) : rawAmount;
  const createdAt = item?.createdAt || item?.created_at;
  const expiresAt = item?.expiresAt || item?.expires_at;

  if (!createdAt || !expiresAt || amount <= 0) {
    return {
      totalDays: 0,
      usedDays: 0,
      remainingDays: 0,
      usedPercent: 100,
      remainingPercent: 0,
      proratedAmount: amount,
      fullAmount: amount,
    };
  }

  const start = new Date(createdAt).getTime();
  const end = new Date(expiresAt).getTime();
  const now = Date.now();
  const totalMs = end - start;

  if (totalMs <= 0) {
    return {
      totalDays: 0,
      usedDays: 0,
      remainingDays: 0,
      usedPercent: 100,
      remainingPercent: 0,
      proratedAmount: 0,
      fullAmount: amount,
    };
  }

  const remainingMs = Math.max(0, end - now);
  const totalDays = Math.max(1, Math.round(totalMs / (1000 * 60 * 60 * 24)));
  const remainingDays = Math.max(0, Math.round(remainingMs / (1000 * 60 * 60 * 24)));
  const usedDays = Math.max(0, totalDays - remainingDays);

  const remainingPercent = Math.min(100, Math.round((remainingMs / totalMs) * 100));
  const usedPercent = 100 - remainingPercent;

  const proratedAmount = Math.max(0, Math.floor(amount * (remainingMs / totalMs)));

  return {
    totalDays,
    usedDays,
    remainingDays,
    usedPercent,
    remainingPercent,
    proratedAmount,
    fullAmount: amount,
  };
}

export default function ApprovalsPage() {
  const [cancellations, setCancellations] = useState<any[]>([]);
  const [deletions, setDeletions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  
  // Dialog States
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: number | null; type: 'cancellation' | 'deletion'; reason: string }>({ 
    open: false, id: null, type: 'cancellation', reason: "" 
  });
  const [approveDialog, setApproveDialog] = useState<{
    open: boolean;
    id: number | null;
    item: any | null;
    refund: boolean;
    refundMethod: 'wallet' | 'original';
    refundAmount: number;
  }>({
    open: false,
    id: null,
    item: null,
    refund: true,
    refundMethod: 'wallet',
    refundAmount: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [cancData, delData] = await Promise.all([
        fetchPendingCancellations(),
        fetchPendingDeletions()
      ]);
      setCancellations(cancData);
      setDeletions(delData);
    } catch (err: any) {
      toast.error(err.message || "Failed to load pending requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (
    type: 'cancellation' | 'deletion',
    id: number,
    action: 'approve' | 'reject',
    params: { reason?: string; refund?: boolean; refundMethod?: 'wallet' | 'original'; refundAmount?: number } = {},
  ) => {
    const key = `${type}-${id}-${action}`;
    setActioning(key);
    try {
      if (type === 'cancellation') {
        if (action === 'approve') {
          await approveCancellation(id, {
            refund: params.refund,
            refundMethod: params.refundMethod,
            refundAmount: params.refundAmount,
          });
        } else {
          await rejectCancellation(id, params.reason);
        }
      } else {
        if (action === 'approve') {
          await approveDeletion(id);
        } else {
          await rejectDeletion(id, params.reason);
        }
      }
      toast.success(`Request ${action}d successfully`);
      setRejectDialog(p => ({ ...p, open: false, id: null, reason: "" }));
      setApproveDialog(p => ({ ...p, open: false, id: null, item: null }));
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setActioning(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
          <p className="text-muted-foreground">Manage user requests for subscription cancellations and account deletions.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadData} 
          disabled={loading}
          className="flex items-center gap-1.5"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="cancellations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cancellations" className="flex items-center gap-2">
            <CreditCard size={16} />
            Subscription Cancellations
            {cancellations.length > 0 && (
              <span className="ml-1 bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full text-[10px]">
                {cancellations.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="deletions" className="flex items-center gap-2">
            <UserX size={16} />
            Account Deletions
            {deletions.length > 0 && (
              <span className="ml-1 bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full text-[10px]">
                {deletions.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cancellations">
          <Card>
            <CardHeader>
              <CardTitle>Pending Cancellations</CardTitle>
              <CardDescription>Review subscription termination requests.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-violet-500" /></div>
              ) : cancellations.length > 0 ? (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Product / Plan</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Prorated Est.</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cancellations.map((item) => {
                      const proration = calculateSubscriptionProration(item);
                      const displayAmount = (Number(item.amount) || 0) >= 100 ? Math.round(Number(item.amount) / 100) : (Number(item.amount) || 0);
                      const billingCycle = item.billingCycle || item.billing_cycle || 'active';
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="font-medium">{item.userEmail}</div>
                            {item.userName && <div className="text-xs text-muted-foreground">{item.userName}</div>}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{item.productName || item.bundleName || 'Subscription'}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge variant="outline" className="text-[10px] uppercase font-normal px-1.5 py-0">
                                {billingCycle}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-gray-900">
                            ₹{displayAmount}
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-emerald-700">₹{proration.proratedAmount}</span>
                            <span className="text-[10px] text-muted-foreground block">{proration.remainingDays} days remaining</span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(item.updatedAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-green-600 hover:text-green-700 border-green-200"
                              onClick={() => {
                                const p = calculateSubscriptionProration(item);
                                setApproveDialog({
                                  open: true,
                                  id: item.id,
                                  item,
                                  refund: true,
                                  refundMethod: 'wallet',
                                  refundAmount: p.proratedAmount,
                                });
                              }}
                              disabled={!!actioning}
                            >
                              <CheckCircle size={14} className="mr-1" />
                              Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 border-red-200"
                              onClick={() => setRejectDialog({ open: true, id: item.id, type: 'cancellation', reason: "" })}
                              disabled={!!actioning}
                            >
                              <XCircle size={14} className="mr-1" />
                              Reject
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="mb-2 flex justify-center text-gray-200">
                    <CheckCircle size={48} strokeWidth={1} />
                  </div>
                  <p>No pending cancellations found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deletions">
          <Card>
            <CardHeader>
              <CardTitle>Pending Deletions</CardTitle>
              <CardDescription>Permanently remove user accounts and data.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-red-500" /></div>
              ) : deletions.length > 0 ? (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletions.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.name || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">{item.email}</div>
                        </TableCell>
                        <TableCell>
                           <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold">PENDING_DELETION</span>
                        </TableCell>
                        <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleAction('deletion', item.id, 'approve')}
                            disabled={!!actioning}
                          >
                            {actioning === `deletion-${item.id}-approve` ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} className="mr-1" />}
                            Delete Permanently
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setRejectDialog({ open: true, id: item.id, type: 'deletion', reason: "" })}
                            disabled={!!actioning}
                          >
                            <XCircle size={14} className="mr-1" />
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="mb-2 flex justify-center text-gray-200">
                    <UserX size={48} strokeWidth={1} />
                  </div>
                  <p>No pending deletions found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Approval Dialog ── */}
      <Dialog open={approveDialog.open} onOpenChange={(v) => !v && setApproveDialog(p => ({ ...p, open: false }))}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="text-green-600" size={22} />
              Confirm Subscription Cancellation
            </DialogTitle>
            <DialogDescription>
              Review the subscription usage and select the refund option.
            </DialogDescription>
          </DialogHeader>
          
          {approveDialog.item && (() => {
            const proration = calculateSubscriptionProration(approveDialog.item);
            const isProratedSelected = approveDialog.refundAmount === proration.proratedAmount;
            const isFullSelected = approveDialog.refundAmount === proration.fullAmount && proration.fullAmount !== proration.proratedAmount;

            return (
              <div className="py-2 space-y-4">
                {/* Subscription Details Card */}
                <div className="rounded-lg border bg-slate-50/70 p-3.5 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-900 text-sm">
                        {approveDialog.item.productName || approveDialog.item.bundleName || 'Subscription Plan'}
                      </span>
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-violet-100 text-violet-700">
                        {approveDialog.item.billingCycle || approveDialog.item.billing_cycle || 'active'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">Paid: </span>
                      <span className="font-bold text-gray-900 text-sm">₹{proration.fullAmount}</span>
                    </div>
                  </div>

                  {/* Dates & Timeline */}
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="block text-[10px] uppercase font-medium text-gray-500">Start Date</span>
                      <span className="font-medium text-gray-700">
                        {approveDialog.item.createdAt || approveDialog.item.created_at ? new Date(approveDialog.item.createdAt || approveDialog.item.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-medium text-gray-500">Expiry Date</span>
                      <span className="font-medium text-gray-700">
                        {approveDialog.item.expiresAt || approveDialog.item.expires_at ? new Date(approveDialog.item.expiresAt || approveDialog.item.expires_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Visual Usage Progress Bar */}
                  {proration.totalDays > 0 && (
                    <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-600 font-medium">
                          Used: <strong className="text-slate-800">{proration.usedDays} days</strong> ({proration.usedPercent}%)
                        </span>
                        <span className="text-emerald-700 font-medium">
                          Remaining: <strong className="text-emerald-800">{proration.remainingDays} days</strong> ({proration.remainingPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden flex">
                        <div
                          className="bg-slate-400 transition-all duration-300"
                          style={{ width: `${proration.usedPercent}%` }}
                          title={`Used: ${proration.usedDays} days`}
                        />
                        <div
                          className="bg-emerald-500 transition-all duration-300"
                          style={{ width: `${proration.remainingPercent}%` }}
                          title={`Unused: ${proration.remainingDays} days`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Refund Toggle */}
                <div className="flex items-center justify-between rounded-lg border p-3 bg-white shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-gray-900">Issue Refund?</Label>
                    <p className="text-[11px] text-muted-foreground">Return funds to the user based on remaining subscription time.</p>
                  </div>
                  <Switch 
                    checked={approveDialog.refund}
                    onCheckedChange={(v) => {
                      setApproveDialog(p => ({
                        ...p,
                        refund: v,
                        refundAmount: v ? (p.refundAmount > 0 ? p.refundAmount : proration.proratedAmount) : 0,
                      }));
                    }}
                  />
                </div>

                {approveDialog.refund && (
                  <div className="space-y-3.5 p-3.5 rounded-lg border border-violet-100 bg-violet-50/25">
                    {/* Quick Presets */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-gray-700">Quick Calculation Presets</Label>
                        <span className="text-[10px] text-muted-foreground">Click to apply</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setApproveDialog(p => ({ ...p, refundAmount: proration.proratedAmount }))}
                          className={`p-2.5 rounded-md border text-left transition-all ${
                            isProratedSelected
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-600 shadow-sm'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">Prorated Refund</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">Recommended</span>
                          </div>
                          <div className="text-base font-extrabold text-emerald-700 mt-1">
                            ₹{proration.proratedAmount}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {proration.remainingDays} unused days ({proration.remainingPercent}%)
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setApproveDialog(p => ({ ...p, refundAmount: proration.fullAmount }))}
                          className={`p-2.5 rounded-md border text-left transition-all ${
                            isFullSelected
                              ? 'border-violet-600 bg-violet-50 text-violet-950 font-semibold ring-1 ring-violet-600 shadow-sm'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">Full Refund</span>
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded">100%</span>
                          </div>
                          <div className="text-base font-extrabold text-gray-900 mt-1">
                            ₹{proration.fullAmount}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Complete original payment
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Refund Destination */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">Refund Destination</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setApproveDialog(p => ({ ...p, refundMethod: 'wallet' }))}
                          className={`p-2.5 rounded-md border text-left transition-all ${
                            approveDialog.refundMethod === 'wallet'
                              ? 'border-violet-600 bg-violet-50 text-violet-900 font-semibold ring-1 ring-violet-600 shadow-sm'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-violet-600" />
                            Wallet Credits
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Instant · 0% fee · Default (Recommended)
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setApproveDialog(p => ({ ...p, refundMethod: 'original' }))}
                          className={`p-2.5 rounded-md border text-left transition-all ${
                            approveDialog.refundMethod === 'original'
                              ? 'border-violet-600 bg-violet-50 text-violet-900 font-semibold ring-1 ring-violet-600 shadow-sm'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                            Razorpay / Bank
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            5–7 business days to card/UPI
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Refund Amount Input */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="refund-amount" className="text-xs font-semibold text-gray-700">Refund Amount (₹)</Label>
                        <span className="text-[11px] text-muted-foreground">
                          {approveDialog.refundAmount === proration.proratedAmount ? '(Prorated value)' : approveDialog.refundAmount === proration.fullAmount ? '(Full refund)' : '(Custom amount)'}
                        </span>
                      </div>
                      <Input
                        id="refund-amount"
                        type="number"
                        min="0"
                        max={proration.fullAmount}
                        value={approveDialog.refundAmount}
                        onChange={(e) => setApproveDialog(p => ({ ...p, refundAmount: Number(e.target.value) }))}
                        className="h-9 text-sm font-semibold"
                      />
                    </div>

                    {/* Notice */}
                    <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-50/90 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                      <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-600" />
                      <p>
                        {approveDialog.refundMethod === 'wallet'
                          ? `₹${approveDialog.refundAmount} will be immediately credited to the user's CodeSwayam wallet. The user can use this balance for future upgrades or renewals.`
                          : `A refund of ₹${approveDialog.refundAmount} will be processed to the user's original payment method via Razorpay (takes 5-7 business days).`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="ghost" onClick={() => setApproveDialog({ open: false, id: null, item: null, refund: false, refundMethod: 'wallet', refundAmount: 0 })}>
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => approveDialog.id && handleAction('cancellation', approveDialog.id, 'approve', {
                refund: approveDialog.refund,
                refundMethod: approveDialog.refundMethod,
                refundAmount: approveDialog.refundAmount,
              })}
              disabled={!!actioning}
            >
              {actioning?.includes('approve') ? <Loader2 size={14} className="animate-spin mr-2" /> : <RefreshCw size={14} className="mr-2" />}
              Confirm & {approveDialog.refund ? (approveDialog.refundMethod === 'wallet' ? 'Credit Wallet' : 'Refund via Razorpay') : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Rejection Dialog ── */}
      <Dialog open={rejectDialog.open} onOpenChange={(v) => !v && setRejectDialog(p => ({ ...p, open: false }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="text-red-600" size={20} />
              Reject {rejectDialog.type === 'cancellation' ? 'Cancellation' : 'Account Deletion'}
            </DialogTitle>
            <DialogDescription>
              Provide a reason for the user so they understand why their request was denied.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-3">
            <Label htmlFor="reason" className="text-xs font-bold uppercase tracking-wider text-gray-500">Rejection Reason</Label>
            <Textarea 
              id="reason"
              placeholder={rejectDialog.type === 'cancellation' ? "e.g. Please contact support to discuss your contract terms..." : "e.g. Your account has a pending balance..."}
              value={rejectDialog.reason}
              onChange={(e) => setRejectDialog(p => ({ ...p, reason: e.target.value }))}
              rows={3}
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setRejectDialog(p => ({ ...p, open: false, id: null, reason: "" }))}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => rejectDialog.id && handleAction(rejectDialog.type, rejectDialog.id, 'reject', { reason: rejectDialog.reason })}
              disabled={!!actioning || !rejectDialog.reason.trim()}
            >
              {actioning?.includes('reject') ? <Loader2 size={14} className="animate-spin mr-2" /> : <MessageSquare size={14} className="mr-2" />}
              Send Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
