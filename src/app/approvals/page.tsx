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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  fetchPendingCancellations, approveCancellation, rejectCancellation,
  fetchPendingDeletions, approveDeletion, rejectDeletion 
} from "@/lib/api";

export default function ApprovalsPage() {
  const [cancellations, setCancellations] = useState<any[]>([]);
  const [deletions, setDeletions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  
  // Dialog States
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: number | null; type: 'cancellation' | 'deletion'; reason: string }>({ 
    open: false, id: null, type: 'cancellation', reason: "" 
  });
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; id: number | null; refund: boolean }>({ open: false, id: null, refund: false });

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

  const handleAction = async (type: 'cancellation' | 'deletion', id: number, action: 'approve' | 'reject', params: { reason?: string; refund?: boolean } = {}) => {
    const key = `${type}-${id}-${action}`;
    setActioning(key);
    try {
      if (type === 'cancellation') {
        if (action === 'approve') {
          await approveCancellation(id, params.refund);
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
      setApproveDialog({ open: false, id: null, refund: false });
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setActioning(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
        <p className="text-muted-foreground">Manage user requests for subscription cancellations and account deletions.</p>
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
                      <TableHead>Product</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cancellations.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.userEmail}</TableCell>
                        <TableCell>{item.productName || 'Bundle'}</TableCell>
                        <TableCell>{new Date(item.updatedAt).toLocaleString()}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-600 hover:text-green-700 border-green-200"
                            onClick={() => setApproveDialog({ open: true, id: item.id, refund: false })}
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
                    ))}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="text-green-600" size={20} />
              Confirm Cancellation
            </DialogTitle>
            <DialogDescription>
              Approving this will terminate the user's subscription immediately.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4 bg-gray-50/50">
              <div className="space-y-0.5">
                <Label className="text-base">Issue Refund?</Label>
                <p className="text-xs text-muted-foreground">Automatically trigger a full refund via Razorpay.</p>
              </div>
              <Switch 
                checked={approveDialog.refund}
                onCheckedChange={(v) => setApproveDialog(p => ({ ...p, refund: v }))}
              />
            </div>
            
            {approveDialog.refund && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-100 text-amber-800 text-[11px] leading-relaxed">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <p><b>Note:</b> A full refund will be processed to the user's original payment method. This cannot be undone.</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setApproveDialog({ open: false, id: null, refund: false })}>
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => approveDialog.id && handleAction('cancellation', approveDialog.id, 'approve', { refund: approveDialog.refund })}
              disabled={!!actioning}
            >
              {actioning?.includes('approve') ? <Loader2 size={14} className="animate-spin mr-2" /> : <RefreshCw size={14} className="mr-2" />}
              Confirm & {approveDialog.refund ? 'Refund' : 'Approve'}
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
