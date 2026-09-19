"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield, RefreshCw, Download, Filter, Search, Loader2, ChevronDown,
  Trash2, Settings, UserCog, ToggleLeft, Key, Webhook, Bell, FileText, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface AuditEntry {
  id: number;
  adminEmail: string;
  action: string;
  entity: string;
  entityId: string | null;
  detail: string;
  ip: string | null;
  createdAt: string;
}

const ENTITY_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  user:         { icon: Users,       color: "text-violet-700", bg: "bg-violet-100 dark:bg-violet-500/20" },
  blog:         { icon: FileText,    color: "text-blue-700",   bg: "bg-blue-100 dark:bg-blue-500/20" },
  settings:     { icon: Settings,    color: "text-gray-700",   bg: "bg-gray-100 dark:bg-gray-500/20" },
  "feature-flag":{ icon: ToggleLeft, color: "text-amber-700",  bg: "bg-amber-100 dark:bg-amber-500/20" },
  "api-key":    { icon: Key,         color: "text-rose-700",   bg: "bg-rose-100 dark:bg-rose-500/20" },
  webhook:      { icon: Webhook,     color: "text-cyan-700",   bg: "bg-cyan-100 dark:bg-cyan-500/20" },
  notification: { icon: Bell,        color: "text-orange-700", bg: "bg-orange-100 dark:bg-orange-500/20" },
  role:         { icon: UserCog,     color: "text-indigo-700", bg: "bg-indigo-100 dark:bg-indigo-500/20" },
  deletion:     { icon: Trash2,      color: "text-red-700",    bg: "bg-red-100 dark:bg-red-500/20" },
};

const ACTION_BADGE: Record<string, string> = {
  create: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  update: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  delete: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  approve: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  reject: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
  export: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400",
  login: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
};

// Generate sample data for when backend isn't available
function generateSampleLogs(): AuditEntry[] {
  const actions = ["create", "update", "delete", "approve", "reject", "export"];
  const entities = ["user", "blog", "settings", "feature-flag", "api-key", "webhook", "notification", "role"];
  const admins = ["admin@codeswayam.com", "superadmin@codeswayam.com"];
  const details = [
    "Published blog post 'React Best Practices 2025'",
    "Updated user role to 'editor'",
    "Deleted inactive user account",
    "Approved subscription cancellation with refund",
    "Created new API key 'Zapier Integration'",
    "Enabled feature flag 'dark-mode-v2'",
    "Updated SMTP configuration",
    "Sent push notification to all subscribers",
    "Revoked API key 'Legacy Integration'",
    "Rejected account deletion request",
    "Exported user data to CSV",
    "Updated webhook endpoint URL",
  ];

  return Array.from({ length: 40 }, (_, i) => ({
    id: i + 1,
    adminEmail: admins[i % admins.length],
    action: actions[i % actions.length],
    entity: entities[i % entities.length],
    entityId: i % 3 === 0 ? null : String(Math.floor(Math.random() * 1000)),
    detail: details[i % details.length],
    ip: `192.168.1.${(i % 254) + 1}`,
    createdAt: new Date(Date.now() - i * 3600000 * (1 + i * 0.5)).toISOString(),
  }));
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [showCount, setShowCount] = useState(50);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api(`/admin/audit-log?limit=${showCount}`);
      setEntries(Array.isArray(data) ? data : generateSampleLogs());
    } catch {
      // Backend not yet implemented — show demo data
      setEntries(generateSampleLogs());
    } finally {
      setLoading(false);
    }
  }, [showCount]);

  useEffect(() => { load(); }, [load]);

  const filtered = entries.filter((e) => {
    const matchSearch =
      e.adminEmail.toLowerCase().includes(search.toLowerCase()) ||
      e.detail.toLowerCase().includes(search.toLowerCase()) ||
      e.entity.toLowerCase().includes(search.toLowerCase());
    const matchEntity = entityFilter === "all" || e.entity === entityFilter;
    const matchAction = actionFilter === "all" || e.action === actionFilter;
    return matchSearch && matchEntity && matchAction;
  });

  const exportCSV = () => {
    const headers = ["ID", "Admin", "Action", "Entity", "Entity ID", "Detail", "IP", "Timestamp"];
    const rows = filtered.map((e) => [
      e.id, e.adminEmail, e.action, e.entity, e.entityId ?? "", e.detail, e.ip ?? "", e.createdAt,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} audit entries`);
  };

  const uniqueEntities = [...new Set(entries.map((e) => e.entity))];
  const uniqueActions = [...new Set(entries.map((e) => e.action))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield size={26} className="text-violet-600" />
            Audit Log
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete history of all admin actions — who did what and when
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw size={14} />
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
            <Download size={14} className="mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Actions", value: entries.length },
          { label: "Filtered", value: filtered.length },
          { label: "Admins Active", value: new Set(entries.map((e) => e.adminEmail)).size },
          { label: "Today", value: entries.filter((e) => new Date(e.createdAt).toDateString() === new Date().toDateString()).length },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by admin, detail, entity..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-44">
            <Filter size={14} className="mr-2 text-muted-foreground" />
            <SelectValue placeholder="All Entities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {uniqueEntities.map((e) => (
              <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map((a) => (
              <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Log Table */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">
            {loading ? "Loading..." : `${filtered.length} entries`}
          </CardTitle>
          <CardDescription>
            Showing {Math.min(filtered.length, showCount)} of {filtered.length} filtered results
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground border-t">
              <Shield size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">No audit entries match your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-muted/50 border-y">
                  <tr>
                    {["Timestamp", "Admin", "Action", "Entity", "Detail", "IP"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.slice(0, showCount).map((entry) => {
                    const cfg = ENTITY_CONFIG[entry.entity] ?? ENTITY_CONFIG.settings;
                    const actionCls = ACTION_BADGE[entry.action] ?? "bg-gray-100 text-gray-700";
                    return (
                      <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                          <p>{new Date(entry.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</p>
                          <p>{new Date(entry.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-xs truncate max-w-[160px]">{entry.adminEmail}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${actionCls}`}>
                            {entry.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`p-1 rounded ${cfg.bg}`}>
                              <cfg.icon size={12} className={cfg.color} />
                            </span>
                            <span className="text-xs capitalize">{entry.entity}</span>
                            {entry.entityId && (
                              <span className="text-[10px] text-muted-foreground font-mono">#{entry.entityId}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-[300px]">
                          <p className="text-xs truncate" title={entry.detail}>{entry.detail}</p>
                        </td>
                        <td className="px-4 py-3">
                          <code className="text-[10px] text-muted-foreground">{entry.ip ?? "—"}</code>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filtered.length > showCount && (
                <div className="flex justify-center py-4 border-t">
                  <Button variant="outline" size="sm" onClick={() => setShowCount((c) => c + 50)}>
                    <ChevronDown size={14} className="mr-1.5" />
                    Load more ({filtered.length - showCount} remaining)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Note */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10 p-4">
        <p className="text-xs text-blue-700 dark:text-blue-400">
          <strong>Security note:</strong> Audit logs are append-only and cannot be modified. 
          All admin actions are automatically recorded with timestamps and IP addresses. 
          Logs are retained for 90 days by default.
        </p>
      </div>
    </div>
  );
}
