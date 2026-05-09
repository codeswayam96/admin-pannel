"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Loader2, RefreshCw, Zap, Search, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface FeatureFlag {
  id: number;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  scope: "global" | "saas" | "user";
  saasId: string | null;
  rolloutPercent: number;
  createdAt: string;
  updatedAt: string;
}

const SCOPE_COLORS: Record<string, string> = {
  global: "bg-violet-100 text-violet-700",
  saas: "bg-blue-100 text-blue-700",
  user: "bg-amber-100 text-amber-700",
};

const emptyForm = {
  key: "", name: "", description: "",
  enabled: true, scope: "global" as FeatureFlag["scope"],
  saasId: "", rolloutPercent: 100,
};

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/admin/feature-flags");
      setFlags(Array.isArray(data) ? data : []);
    } catch {
      setFlags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = flags.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) || f.key.toLowerCase().includes(search.toLowerCase());
    const matchScope = scopeFilter === "all" || f.scope === scopeFilter;
    return matchSearch && matchScope;
  });

  const handleToggle = async (flag: FeatureFlag) => {
    setTogglingId(flag.id);
    try {
      await api(`/admin/feature-flags/${flag.id}`, { method: "PATCH", body: JSON.stringify({ enabled: !flag.enabled }) });
      setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, enabled: !f.enabled } : f));
      toast.success(`"${flag.name}" ${!flag.enabled ? "enabled" : "disabled"}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to toggle flag");
    } finally {
      setTogglingId(null);
    }
  };

  const handleSave = async () => {
    if (!form.key.trim() || !form.name.trim()) { toast.error("Key and name are required"); return; }
    if (!/^[a-z0-9_]+$/.test(form.key)) { toast.error("Key must be lowercase letters, numbers, underscores only"); return; }
    setSaving(true);
    try {
      const created = await api("/admin/feature-flags", {
        method: "POST",
        body: JSON.stringify({ ...form, saasId: form.saasId || null, rolloutPercent: Number(form.rolloutPercent) }),
      });
      setFlags(prev => [created, ...prev]);
      toast.success("Feature flag created");
      setDialogOpen(false);
      setForm(emptyForm);
    } catch (e: any) {
      toast.error(e.message || "Failed to create flag");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api(`/admin/feature-flags/${deleteId}`, { method: "DELETE" });
      setFlags(prev => prev.filter(f => f.id !== deleteId));
      toast.success("Flag deleted");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete flag");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feature Flags</h1>
          <p className="text-muted-foreground mt-1">Toggle features on/off without redeploying</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw size={14} /></Button>
          <Button onClick={() => setDialogOpen(true)}><Plus size={16} /> New Flag</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Flags", value: flags.length },
          { label: "Enabled", value: flags.filter(f => f.enabled).length },
          { label: "Global", value: flags.filter(f => f.scope === "global").length },
          { label: "SaaS Scoped", value: flags.filter(f => f.scope === "saas").length },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-5">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search flags..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={scopeFilter} onValueChange={setScopeFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scopes</SelectItem>
            <SelectItem value="global">Global</SelectItem>
            <SelectItem value="saas">SaaS</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl text-muted-foreground">
          <Zap size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">{flags.length === 0 ? "No feature flags yet" : "No flags match your filter"}</p>
          <p className="text-sm mt-1">Create flags to control feature rollouts without redeploying</p>
          {flags.length === 0 && <Button className="mt-4" onClick={() => setDialogOpen(true)}><Plus size={14} /> Create First Flag</Button>}
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-card">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-muted/50 border-b">
              <tr>
                {["Flag", "Key", "Scope", "Rollout", "Status", "Updated", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(flag => (
                <tr key={flag.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{flag.name}</p>
                    {flag.description && <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">{flag.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{flag.key}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${SCOPE_COLORS[flag.scope]}`}>
                      <Tag size={10} /> {flag.scope}
                      {flag.saasId && <span className="opacity-60">· {flag.saasId}</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full" style={{ width: `${flag.rolloutPercent}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{flag.rolloutPercent}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {togglingId === flag.id
                      ? <Loader2 size={16} className="animate-spin text-muted-foreground" />
                      : <Switch checked={flag.enabled} onCheckedChange={() => handleToggle(flag)} />
                    }
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(flag.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(flag.id)}>
                      <Trash2 size={13} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Feature Flag</DialogTitle>
            <DialogDescription>Control feature availability without redeploying.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Flag Name *</Label>
              <Input placeholder="Dark Mode Beta" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Flag Key *</Label>
              <Input placeholder="dark_mode_beta" value={form.key} onChange={e => setForm(p => ({ ...p, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") }))} className="font-mono" />
              <p className="text-xs text-muted-foreground">Lowercase, numbers, underscores only. Used in code.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={2} placeholder="What does this flag control?" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Scope</Label>
                <Select value={form.scope} onValueChange={v => setForm(p => ({ ...p, scope: v as FeatureFlag["scope"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Rollout %</Label>
                <Input type="number" min={0} max={100} value={form.rolloutPercent} onChange={e => setForm(p => ({ ...p, rolloutPercent: Math.min(100, Math.max(0, Number(e.target.value))) }))} />
              </div>
            </div>
            {form.scope === "saas" && (
              <div className="space-y-1.5">
                <Label>SaaS ID</Label>
                <Input placeholder="auraflow" value={form.saasId} onChange={e => setForm(p => ({ ...p, saasId: e.target.value }))} className="font-mono" />
              </div>
            )}
            <div className="flex items-center justify-between py-2 border rounded-lg px-3">
              <div>
                <p className="text-sm font-medium">Enabled on creation</p>
                <p className="text-xs text-muted-foreground">Toggle off to create as disabled</p>
              </div>
              <Switch checked={form.enabled} onCheckedChange={v => setForm(p => ({ ...p, enabled: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
              Create Flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={open => !open && setDeleteId(null)}
        title="Delete feature flag?"
        description="This permanently removes the flag. Code checking this flag will fall back to its default."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
