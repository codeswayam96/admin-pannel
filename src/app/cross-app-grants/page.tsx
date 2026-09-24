"use client";

import { useState, useEffect } from "react";
import {
  Share2,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
  Info,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  fetchCrossAppGrants,
  createCrossAppGrant,
  updateCrossAppGrant,
  toggleCrossAppGrant,
  deleteCrossAppGrant,
  seedCrossAppGrants,
  fetchProducts,
  CrossAppGrant,
} from "@/lib/api";

export default function CrossAppGrantsPage() {
  const [grants, setGrants] = useState<CrossAppGrant[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string; saasId: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGrant, setEditingGrant] = useState<CrossAppGrant | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Form state
  const [sourceFamily, setSourceFamily] = useState("neural_web");
  const [targetAppId, setTargetAppId] = useState("*");
  const [featureCategory, setFeatureCategory] = useState("ai_features");
  const [minSourceTier, setMinSourceTier] = useState("standard");
  const [description, setDescription] = useState("");

  // Simulator state
  const [simSourceTier, setSimSourceTier] = useState("standard");
  const [simTargetApp, setSimTargetApp] = useState("auraflow");
  const [simCategory, setSimCategory] = useState("ai_features");

  const loadData = async () => {
    setLoading(true);
    try {
      const [grantsData, productsData] = await Promise.all([
        fetchCrossAppGrants(),
        fetchProducts().catch(() => []),
      ]);
      setGrants(Array.isArray(grantsData) ? grantsData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load cross-app grants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateDialog = () => {
    setEditingGrant(null);
    setSourceFamily("neural_web");
    setTargetAppId("*");
    setFeatureCategory("ai_features");
    setMinSourceTier("standard");
    setDescription("");
    setIsCreateOpen(true);
  };

  const openEditDialog = (grant: CrossAppGrant) => {
    setEditingGrant(grant);
    setSourceFamily(grant.sourceFamily);
    setTargetAppId(grant.targetAppId);
    setFeatureCategory(grant.featureCategory);
    setMinSourceTier(grant.minSourceTier);
    setDescription(grant.description || "");
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingGrant) {
        await updateCrossAppGrant(editingGrant.id, {
          featureCategory,
          minSourceTier,
          description,
        });
        toast.success("Cross-app grant updated successfully");
      } else {
        await createCrossAppGrant({
          sourceFamily,
          targetAppId,
          featureCategory,
          minSourceTier,
          description,
        });
        toast.success("Cross-app grant created successfully");
      }
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save grant");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (grant: CrossAppGrant) => {
    try {
      await toggleCrossAppGrant(grant.id);
      toast.success(
        `Grant ${grant.isActive === 1 ? "disabled" : "activated"} successfully`
      );
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle grant status");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCrossAppGrant(id);
      toast.success("Grant deleted");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete grant");
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const res = await seedCrossAppGrants();
      toast.success("Default Neural Web grants seeded successfully!");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to seed default grants");
    } finally {
      setSeeding(false);
    }
  };

  // Evaluate simulator live
  const simulateGrantMatch = () => {
    const tierWeights: Record<string, number> = {
      free: 0,
      standard: 1,
      pro: 2,
      enterprise: 3,
    };
    const userTierWeight = tierWeights[simSourceTier] ?? 0;

    const matchedGrant = grants.find((g) => {
      if (g.isActive !== 1) return false;
      const targetMatches = g.targetAppId === "*" || g.targetAppId === simTargetApp;
      const categoryMatches =
        g.featureCategory === "*" || g.featureCategory === simCategory;
      const minTierWeight = tierWeights[g.minSourceTier] ?? 1;
      return targetMatches && categoryMatches && userTierWeight >= minTierWeight;
    });

    return matchedGrant;
  };

  const simResult = simulateGrantMatch();

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Cross-App Entitlement Grants</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Central policy rules that bridge subscription value across the 150+ CodeSwayam apps.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="gap-2 bg-purple-500/15 text-purple-700 hover:bg-purple-500/25 dark:text-purple-300"
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            {seeding ? "Seeding..." : "Seed Neural Web Defaults"}
          </Button>

          <Button onClick={openCreateDialog} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Cross-App Grant
          </Button>
        </div>
      </div>

      {/* Visual Explanation Banner */}
      <Card className="border-purple-500/20 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-base">How Universal Entitlements Work</h3>
              </div>
              <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
                When a user holds a <strong>Neural Web</strong> subscription, the Core API entitlement engine checks active <strong>Cross-App Grants</strong>.
                If granted, features like AI Chat or Workflow Automations are unlocked in <strong>AuraFlow</strong> and other apps without asking the user for a secondary subscription or spending their credit balance.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-background/80 backdrop-blur px-4 py-3 rounded-lg border text-xs font-mono">
              <span className="text-purple-500 font-semibold">Neural Web Sub</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
              <Badge variant="outline" className="border-purple-500/40 text-purple-600 dark:text-purple-400">
                Grant: ai_features
              </Badge>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-emerald-500 font-semibold">AuraFlow Free Access</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Active Cross-App Grants</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {grants.filter((g) => g.isActive === 1).length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Out of {grants.length} total configured policies
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Source Platform Families</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {new Set(grants.map((g) => g.sourceFamily)).size}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            E.g. Neural Web, Dev Platform
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Universal Coverage</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {grants.some((g) => g.targetAppId === "*" && g.isActive === 1) ? "Enabled" : "Partial"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Wildcard (*) covers all 150+ apps
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Fallback Access Model</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              Credits
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            1-2 pts/action if neither sub applies
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Configured Cross-App Grants</CardTitle>
              <CardDescription>
                Policies active across the entire CodeSwayam multi-tenant network.
              </CardDescription>
            </div>
            <div className="text-xs text-muted-foreground">
              Evaluated in real-time on every <code className="bg-muted px-1.5 py-0.5 rounded">/entitlements/me</code> call.
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading cross-app policies...
            </div>
          ) : grants.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">No cross-app grants configured yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                  Click the button below to seed the default policy that grants Neural Web subscribers AI access in AuraFlow and all platform apps.
                </p>
              </div>
              <Button
                onClick={handleSeedDefaults}
                disabled={seeding}
                className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Sparkles className="w-4 h-4" />
                Seed Neural Web Defaults
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source Family</TableHead>
                    <TableHead>Min Source Tier</TableHead>
                    <TableHead>Target App</TableHead>
                    <TableHead>Granted Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grants.map((grant) => (
                    <TableRow key={grant.id}>
                      <TableCell className="font-semibold">
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                          {grant.sourceFamily}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize text-xs font-mono">
                          {grant.minSourceTier}+
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {grant.targetAppId === "*" ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                            * (All 150+ Apps)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="font-mono text-xs">
                            {grant.targetAppId}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 font-mono text-xs"
                        >
                          {grant.featureCategory}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs text-xs text-muted-foreground truncate">
                        {grant.description || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={grant.isActive === 1}
                            onCheckedChange={() => handleToggle(grant)}
                          />
                          <span className="text-xs text-muted-foreground">
                            {grant.isActive === 1 ? "Active" : "Off"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(grant)}
                            title="Edit Grant"
                          >
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Delete Grant"
                                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Cross-App Grant?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will revoke the automatic feature category unlock between{" "}
                                  <strong>{grant.sourceFamily}</strong> and <strong>{grant.targetAppId}</strong>.
                                  Users will have to purchase a separate subscription or use pay-per-use credits.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(grant.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Delete Policy
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Policy Simulator */}
      <Card className="border-blue-500/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500" />
            <div>
              <CardTitle>Live Policy Simulator</CardTitle>
              <CardDescription>
                Simulate how the entitlement engine resolves access for a given user state.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label className="text-xs">User Holds Subscription In</Label>
              <div className="flex items-center gap-2">
                <Input value="Neural Web (neural_web)" disabled className="text-xs bg-muted" />
              </div>
              <Label className="text-xs text-muted-foreground">User's Subscription Tier</Label>
              <Select value={simSourceTier} onValueChange={setSimSourceTier}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">User Visits Target App</Label>
              <Select value={simTargetApp} onValueChange={setSimTargetApp}>
                <SelectTrigger className="text-xs font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auraflow">auraflow (Workflow Engine)</SelectItem>
                  <SelectItem value="pdfcraft">pdfcraft (PDF Tools)</SelectItem>
                  <SelectItem value="pixelforge">pixelforge (Design Studio)</SelectItem>
                  <SelectItem value="ems-frontend">ems-frontend (EMS)</SelectItem>
                </SelectContent>
              </Select>
              <Label className="text-xs text-muted-foreground">Target Feature Category Requested</Label>
              <Select value={simCategory} onValueChange={setSimCategory}>
                <SelectTrigger className="text-xs font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai_features">ai_features (AI Chat & Assist)</SelectItem>
                  <SelectItem value="neural_workflows">neural_workflows (Automations)</SelectItem>
                  <SelectItem value="core_export">core_export (Batch Export)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Engine Decision Output</Label>
              <div
                className={`p-4 rounded-lg border text-xs space-y-2.5 ${
                  simResult
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm">
                  {simResult ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span>ACCESS GRANTED: Cross-App Grant</span>
                    </>
                  ) : (
                    <>
                      <Info className="w-5 h-5 text-amber-500" />
                      <span>FALLBACK: Pay-per-use Credits</span>
                    </>
                  )}
                </div>

                <p className="text-xs leading-relaxed opacity-90">
                  {simResult ? (
                    <>
                      Matched policy <strong>#{simResult.id}</strong> (
                      <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">
                        {simResult.sourceFamily} → {simResult.targetAppId} [{simResult.featureCategory}]
                      </code>
                      ). The user is NOT billed any credits and does NOT need an AuraFlow subscription!
                    </>
                  ) : (
                    <>
                      No cross-app grant matched tier <strong>{simSourceTier}</strong> for category{" "}
                      <strong>{simCategory}</strong>. User accesses via <strong>universal credit points</strong> (e.g. 1 pt/chat, 2 pts/workflow).
                    </>
                  )}
                </p>

                <div className="pt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-[11px] font-mono">
                  <span>Method: {simResult ? "cross_app_grant" : "credit_deduct"}</span>
                  <span>Cost to User: {simResult ? "0 Credits" : "1-2 Credits"}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingGrant ? "Edit Cross-App Grant" : "Create New Cross-App Grant"}
            </DialogTitle>
            <DialogDescription>
              Configure how subscriptions in one product family unlock feature categories in another.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sourceFamily">Source Product Family</Label>
              <Input
                id="sourceFamily"
                value={sourceFamily}
                onChange={(e) => setSourceFamily(e.target.value)}
                placeholder="e.g. neural_web"
                disabled={!!editingGrant}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                The product family whose subscribers receive the grant (e.g. <code>neural_web</code>).
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="targetAppId">Target App ID</Label>
              <Input
                id="targetAppId"
                value={targetAppId}
                onChange={(e) => setTargetAppId(e.target.value)}
                placeholder="* for all apps, or auraflow, pdfcraft, etc."
                disabled={!!editingGrant}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Use <code>*</code> to apply universally across all 150+ CodeSwayam apps, or specify a single app like <code>auraflow</code>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="featureCategory">Granted Category</Label>
                <Input
                  id="featureCategory"
                  value={featureCategory}
                  onChange={(e) => setFeatureCategory(e.target.value)}
                  placeholder="ai_features, *, etc."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="minSourceTier">Minimum Source Tier</Label>
                <Select value={minSourceTier} onValueChange={setMinSourceTier}>
                  <SelectTrigger id="minSourceTier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">free (Any tier)</SelectItem>
                    <SelectItem value="standard">standard (Standard+)</SelectItem>
                    <SelectItem value="pro">pro (Pro only)</SelectItem>
                    <SelectItem value="enterprise">enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Policy Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Neural Web Standard grants AI features in AuraFlow"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingGrant ? "Save Changes" : "Create Policy"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
