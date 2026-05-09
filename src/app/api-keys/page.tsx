"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Loader2, RefreshCw, Key, Copy, Eye, EyeOff, Search, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface ApiKey {
  id: number;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  createdBy: string | null;
  requestCount: number;
}

interface NewKeyResponse {
  key: ApiKey;
  plaintext: string;
}

const ALL_SCOPES = [
  { value: "read:users", label: "Read Users" },
  { value: "write:users", label: "Write Users" },
  { value: "read:blogs", label: "Read Blogs" },
  { value: "write:blogs", label: "Write Blogs" },
  { value: "read:analytics", label: "Read Analytics" },
  { value: "read:subscriptions", label: "Read Subscriptions" },
  { value: "write:subscriptions", label: "Write Subscriptions" },
  { value: "read:products", label: "Read Products" },
  { value: "write:products", label: "Write Products" },
  { value: "admin:*", label: "Full Admin Access" },
];

const emptyForm = { name: "", scopes: [] as string[], expiresIn: "never" };

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newKeyDialog, setNewKeyDialog] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/admin/api-keys");
      setKeys(Array.isArray(data) ? data : []);
    } catch {
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleScope = (scope: string) => {
    if (scope === "admin:*") {
      setForm(p => ({ ...p, scopes: p.scopes.includes("admin:*") ? [] : ["admin:*"] }));
      return;
    }
    setForm(p => ({
      ...p,
      scopes: p.scopes.includes(scope)
        ? p.scopes.filter(s => s !== scope)
        : [...p.scopes.filter(s => s !== "admin:*"), scope],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Key name is required"); return; }
    if (form.scopes.length === 0) { toast.error("Select at least one scope"); return; }
    setSaving(true);
    try {
      const expiresAt = form.expiresIn === "never" ? null
        : new Date(Date.now() + {
            "30d": 30, "90d": 90, "1y": 365,
          }[form.expiresIn as string]! * 86400000).toISOString();

      const res: NewKeyResponse = await api("/admin/api-keys", {
        method: "POST",
        body: JSON.stringify({ name: form.name, scopes: form.scopes, expiresAt }),
      });
      setKeys(prev => [res.key, ...prev]);
      setNewKeyDialog(res.plaintext);
      setDialogOpen(false);
      setForm(emptyForm);
    } catch (e: any) {
      toast.error(e.message || "Failed to create API key");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api(`/admin/api-keys/${deleteId}`, { method: "DELETE" });
      setKeys(prev => prev.filter(k => k.id !== deleteId));
      toast.success("API key revoked");
    } catch (e: any) {
      toast.error(e.message || "Failed to revoke key");
    } finally {
      setDeleteId(null);
    }
  };

  const copyKey = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = keys.filter(k => k.name.toLowerCase().includes(search.toLowerCase()));

  const isExpired = (expiresAt: string | null) => expiresAt ? new Date(expiresAt) < new Date() : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground mt-1">Issue and manage API keys for external integrations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw size={14} /></Button>
          <Button onClick={() => setDialogOpen(true)}><Plus size={16} /> New API Key</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Keys", value: keys.length },
          { label: "Active", value: keys.filter(k => !isExpired(k.expiresAt)).length },
          { label: "Expired", value: keys.filter(k => isExpired(k.expiresAt)).length },
          { label: "Total Requests", value: keys.reduce((s, k) => s + k.requestCount, 0).toLocaleString() },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-5">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Security notice */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20 px-4 py-3">
        <p className="text-xs text-amber-700 dark:text-amber-400">
          <strong>Security:</strong> API keys are shown only once at creation. Store them securely — they cannot be retrieved again. Revoke immediately if compromised.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search keys..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Keys Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl text-muted-foreground">
          <Key size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">{keys.length === 0 ? "No API keys yet" : "No keys match your search"}</p>
          <p className="text-sm mt-1">Create keys to allow external services to access your API</p>
          {keys.length === 0 && <Button className="mt-4" onClick={() => setDialogOpen(true)}><Plus size={14} /> Create First Key</Button>}
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-card">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-muted/50 border-b">
              <tr>
                {["Name", "Key", "Scopes", "Requests", "Last Used", "Expires", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(key => {
                const expired = isExpired(key.expiresAt);
                return (
                  <tr key={key.id} className={`hover:bg-muted/20 transition-colors ${expired ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{key.name}</p>
                        {expired && <Badge variant="destructive" className="text-[10px]">Expired</Badge>}
                      </div>
                      {key.createdBy && <p className="text-xs text-muted-foreground">by {key.createdBy}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{key.keyPrefix}••••••••</code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.includes("admin:*")
                          ? <Badge variant="destructive" className="text-[10px]">Full Access</Badge>
                          : key.scopes.slice(0, 2).map(s => (
                            <span key={s} className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">{s}</span>
                          ))
                        }
                        {key.scopes.length > 2 && !key.scopes.includes("admin:*") && (
                          <span className="text-[10px] text-muted-foreground">+{key.scopes.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{key.requestCount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString("en-IN") : "Never"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {key.expiresAt ? new Date(key.expiresAt).toLocaleDateString("en-IN") : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(key.id)}>
                        <Trash2 size={13} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>The key will only be shown once. Copy it immediately after creation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Key Name *</Label>
              <Input placeholder="My Integration" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Descriptive name to identify this key's purpose</p>
            </div>
            <div className="space-y-1.5">
              <Label>Expiry</Label>
              <Select value={form.expiresIn} onValueChange={v => setForm(p => ({ ...p, expiresIn: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                  <SelectItem value="1y">1 year</SelectItem>
                  <SelectItem value="never">Never expires</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Scopes * (principle of least privilege)</Label>
              <div className="border rounded-lg p-3 space-y-2 max-h-52 overflow-y-auto">
                {ALL_SCOPES.map(scope => (
                  <label key={scope.value} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.scopes.includes(scope.value)}
                      onChange={() => toggleScope(scope.value)}
                      className="accent-violet-600 w-4 h-4"
                    />
                    <span className="text-sm group-hover:text-foreground transition-colors">{scope.label}</span>
                    <code className="text-[10px] text-muted-foreground font-mono ml-auto">{scope.value}</code>
                  </label>
                ))}
              </div>
              {form.scopes.length > 0 && (
                <p className="text-xs text-muted-foreground">{form.scopes.length} scope{form.scopes.length !== 1 ? "s" : ""} selected</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
              Create Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Key Reveal Dialog */}
      <Dialog open={newKeyDialog !== null} onOpenChange={() => setNewKeyDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 size={20} /> API Key Created
            </DialogTitle>
            <DialogDescription>
              Copy this key now. It will never be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border bg-muted p-3">
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono flex-1 break-all">
                  {showKey ? newKeyDialog : newKeyDialog?.replace(/./g, "•")}
                </code>
                <button onClick={() => setShowKey(p => !p)} className="text-muted-foreground hover:text-foreground shrink-0">
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <Button className="w-full gap-2" onClick={() => newKeyDialog && copyKey(newKeyDialog)}>
              {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
              {copied ? "Copied!" : "Copy to Clipboard"}
            </Button>
            <p className="text-xs text-amber-600 text-center">
              ⚠️ Store this key securely. It cannot be retrieved after closing this dialog.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={open => !open && setDeleteId(null)}
        title="Revoke API key?"
        description="This immediately invalidates the key. Any integrations using it will stop working."
        confirmLabel="Revoke Key"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
