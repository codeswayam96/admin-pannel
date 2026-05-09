"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Loader2, RefreshCw, Webhook, Search, CheckCircle2, XCircle, Clock, Send, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface WebhookEndpoint {
  id: number;
  url: string;
  secret: string;
  events: string[];
  enabled: boolean;
  lastStatus: "success" | "failed" | "pending" | null;
  lastTriggeredAt: string | null;
  failureCount: number;
  createdAt: string;
}

const ALL_EVENTS = [
  { group: "Users", events: ["user.created", "user.updated", "user.deleted", "user.suspended"] },
  { group: "Subscriptions", events: ["subscription.created", "subscription.canceled", "subscription.renewed", "subscription.expired"] },
  { group: "Payments", events: ["payment.success", "payment.failed", "payment.refunded"] },
  { group: "Blogs", events: ["blog.published", "blog.deleted"] },
  { group: "Credits", events: ["credits.purchased", "credits.used", "credits.adjusted"] },
];

const STATUS_CFG = {
  success: { cls: "bg-emerald-100 text-emerald-700", Icon: CheckCircle2 },
  failed: { cls: "bg-red-100 text-red-700", Icon: XCircle },
  pending: { cls: "bg-amber-100 text-amber-700", Icon: Clock },
};

const emptyForm = { url: "", secret: "", events: [] as string[], enabled: true };

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/admin/webhooks");
      setWebhooks(Array.isArray(data) ? data : []);
    } catch {
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleEvent = (event: string) => {
    setForm(p => ({
      ...p,
      events: p.events.includes(event) ? p.events.filter(e => e !== event) : [...p.events, event],
    }));
  };

  const toggleGroup = (events: string[]) => {
    const allSelected = events.every(e => form.events.includes(e));
    setForm(p => ({
      ...p,
      events: allSelected
        ? p.events.filter(e => !events.includes(e))
        : [...new Set([...p.events, ...events])],
    }));
  };

  const generateSecret = () => {
    const secret = "whsec_" + Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, "0")).join("");
    setForm(p => ({ ...p, secret }));
  };

  const handleSave = async () => {
    if (!form.url.trim()) { toast.error("URL is required"); return; }
    if (!form.url.startsWith("https://")) { toast.error("Webhook URL must use HTTPS"); return; }
    if (form.events.length === 0) { toast.error("Select at least one event"); return; }
    setSaving(true);
    try {
      const created = await api("/admin/webhooks", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setWebhooks(prev => [created, ...prev]);
      toast.success("Webhook endpoint created");
      setDialogOpen(false);
      setForm(emptyForm);
    } catch (e: any) {
      toast.error(e.message || "Failed to create webhook");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (wh: WebhookEndpoint) => {
    try {
      await api(`/admin/webhooks/${wh.id}`, { method: "PATCH", body: JSON.stringify({ enabled: !wh.enabled }) });
      setWebhooks(prev => prev.map(w => w.id === wh.id ? { ...w, enabled: !w.enabled } : w));
      toast.success(`Webhook ${!wh.enabled ? "enabled" : "disabled"}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to update webhook");
    }
  };

  const handleTest = async (id: number) => {
    setTestingId(id);
    try {
      await api(`/admin/webhooks/${id}/test`, { method: "POST" });
      toast.success("Test event sent! Check your endpoint logs.");
    } catch (e: any) {
      toast.error(e.message || "Test delivery failed");
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api(`/admin/webhooks/${deleteId}`, { method: "DELETE" });
      setWebhooks(prev => prev.filter(w => w.id !== deleteId));
      toast.success("Webhook deleted");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete webhook");
    } finally {
      setDeleteId(null);
    }
  };

  const filtered = webhooks.filter(w => w.url.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground mt-1">Send real-time events to external services</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw size={14} /></Button>
          <Button onClick={() => setDialogOpen(true)}><Plus size={16} /> Add Endpoint</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Endpoints", value: webhooks.length },
          { label: "Active", value: webhooks.filter(w => w.enabled).length },
          { label: "Healthy", value: webhooks.filter(w => w.lastStatus === "success").length },
          { label: "Failing", value: webhooks.filter(w => w.failureCount > 0).length },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-5">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search endpoints..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Endpoints */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl text-muted-foreground">
          <Webhook size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">{webhooks.length === 0 ? "No webhook endpoints yet" : "No endpoints match your search"}</p>
          <p className="text-sm mt-1">Connect external services like Slack, Zapier, or your own backend</p>
          {webhooks.length === 0 && <Button className="mt-4" onClick={() => setDialogOpen(true)}><Plus size={14} /> Add First Endpoint</Button>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(wh => {
            const statusCfg = wh.lastStatus ? STATUS_CFG[wh.lastStatus] : null;
            return (
              <Card key={wh.id} className={`border ${!wh.enabled ? "opacity-60" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <code className="text-sm font-mono font-semibold truncate max-w-[300px]">{wh.url}</code>
                        {statusCfg && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.cls}`}>
                            <statusCfg.Icon size={10} /> {wh.lastStatus}
                          </span>
                        )}
                        {wh.failureCount > 0 && (
                          <Badge variant="destructive" className="text-xs">{wh.failureCount} failures</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {wh.events.slice(0, 5).map(e => (
                          <span key={e} className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">{e}</span>
                        ))}
                        {wh.events.length > 5 && (
                          <span className="text-[10px] text-muted-foreground">+{wh.events.length - 5} more</span>
                        )}
                      </div>
                      {wh.lastTriggeredAt && (
                        <p className="text-xs text-muted-foreground">
                          Last triggered: {new Date(wh.lastTriggeredAt).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch checked={wh.enabled} onCheckedChange={() => handleToggle(wh)} />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5"
                        onClick={() => handleTest(wh.id)}
                        disabled={testingId === wh.id || !wh.enabled}
                      >
                        {testingId === wh.id ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                        Test
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(wh.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Webhook Endpoint</DialogTitle>
            <DialogDescription>We'll send POST requests to this URL when selected events occur.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Endpoint URL * (HTTPS required)</Label>
              <Input placeholder="https://your-service.com/webhooks/codeswayam" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Signing Secret</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showSecret ? "text" : "password"}
                    placeholder="whsec_..."
                    value={form.secret}
                    onChange={e => setForm(p => ({ ...p, secret: e.target.value }))}
                    className="pr-10 font-mono text-sm"
                  />
                  <button type="button" onClick={() => setShowSecret(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={generateSecret}>Generate</Button>
              </div>
              <p className="text-xs text-muted-foreground">Used to verify webhook authenticity via HMAC-SHA256 signature.</p>
            </div>
            <div className="space-y-2">
              <Label>Events to Subscribe *</Label>
              <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                {ALL_EVENTS.map(({ group, events }) => {
                  const allSelected = events.every(e => form.events.includes(e));
                  return (
                    <div key={group} className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{group}</p>
                        <button type="button" onClick={() => toggleGroup(events)} className="text-xs text-violet-600 hover:underline">
                          {allSelected ? "Deselect all" : "Select all"}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {events.map(event => (
                          <button
                            key={event}
                            type="button"
                            onClick={() => toggleEvent(event)}
                            className={`text-[11px] px-2 py-0.5 rounded-full border font-mono transition-colors ${
                              form.events.includes(event)
                                ? "bg-violet-100 border-violet-300 text-violet-700"
                                : "bg-background border-border text-muted-foreground hover:border-violet-300"
                            }`}
                          >
                            {event}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {form.events.length > 0 && (
                <p className="text-xs text-muted-foreground">{form.events.length} event{form.events.length !== 1 ? "s" : ""} selected</p>
              )}
            </div>
            <div className="flex items-center justify-between py-2 border rounded-lg px-3">
              <div>
                <p className="text-sm font-medium">Active on creation</p>
                <p className="text-xs text-muted-foreground">Disable to pause delivery</p>
              </div>
              <Switch checked={form.enabled} onCheckedChange={v => setForm(p => ({ ...p, enabled: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
              Add Endpoint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={open => !open && setDeleteId(null)}
        title="Delete webhook endpoint?"
        description="This permanently removes the endpoint. No more events will be delivered to this URL."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
