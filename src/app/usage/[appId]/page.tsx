"use client";

import { use, useState, useEffect, useCallback } from "react";
import { ArrowLeft, Download, Search, Loader2, AlertTriangle, RefreshCw, BarChart2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorState } from "@/components/ErrorState";
import { fetchAdminAppUsage } from "@/lib/api";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserUsageRow {
  userId: number;
  userName: string | null;
  userEmail: string;
  tier: string;
  counters: Record<string, { used: number; limit: number; percentage: number }>;
  updatedAt: string;
}

interface AppUsageDetailResponse {
  appId: string;
  rows: UserUsageRow[];
  total: number;
  page: number;
  counterKeys: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  free:       "bg-gray-100 text-gray-600",
  standard:   "bg-violet-100 text-violet-700",
  pro:        "bg-orange-100 text-orange-700",
  enterprise: "bg-amber-100 text-amber-700",
};

function PctBadge({ pct }: { pct: number }) {
  const color = pct >= 100 ? "bg-red-100 text-red-700" : pct >= 80 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700";
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${color}`}>
      {pct >= 100 ? "LIMIT" : `${pct}%`}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AppUsageDetailPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = use(params);
  const decodedAppId = decodeURIComponent(appId);

  const [data, setData] = useState<AppUsageDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [limitFilter, setLimitFilter] = useState("all"); // all | near | at

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminAppUsage(decodedAppId, 1, 200);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load usage data");
    } finally {
      setLoading(false);
    }
  }, [decodedAppId]);

  useEffect(() => { load(); }, [load]);

  const rows = data?.rows ?? [];
  const counterKeys = data?.counterKeys ?? [];

  // Unique tiers for filter
  const tiers = Array.from(new Set(rows.map(r => r.tier))).filter(Boolean).sort();

  const filtered = rows.filter(r => {
    const matchSearch = !search || r.userEmail.toLowerCase().includes(search.toLowerCase())
      || (r.userName || "").toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === "all" || r.tier === tierFilter;
    const matchLimit = limitFilter === "all"
      || (limitFilter === "at" && Object.values(r.counters).some(c => c.percentage >= 100))
      || (limitFilter === "near" && Object.values(r.counters).some(c => c.percentage >= 80 && c.percentage < 100));
    return matchSearch && matchTier && matchLimit;
  });

  const exportCsv = () => {
    const headers = ["userId", "email", "name", "tier", ...counterKeys.flatMap(k => [`${k}_used`, `${k}_limit`, `${k}_pct`])];
    const csvRows = filtered.map(r => [
      r.userId, r.userEmail, r.userName || "",  r.tier,
      ...counterKeys.flatMap(k => {
        const c = r.counters[k];
        return c ? [c.used, c.limit, c.percentage] : [0, 0, 0];
      }),
    ]);
    const csv = [headers, ...csvRows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `usage-${decodedAppId}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (error) return <ErrorState error={error} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/usage" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={14} /> Back to Usage Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight capitalize">{decodedAppId} — Usage</h1>
            <p className="text-muted-foreground mt-1">{data?.total ?? 0} users tracked · {counterKeys.length} counter{counterKeys.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load} className="gap-2">
              <RefreshCw size={14} /> Refresh
            </Button>
            <Button variant="outline" onClick={exportCsv} className="gap-2" disabled={filtered.length === 0}>
              <Download size={14} /> Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: rows.length },
          { label: "At Limit", value: rows.filter(r => Object.values(r.counters).some(c => c.percentage >= 100)).length },
          { label: "Near Limit (80%+)", value: rows.filter(r => Object.values(r.counters).some(c => c.percentage >= 80 && c.percentage < 100)).length },
          { label: "Counters Tracked", value: counterKeys.length },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by email or name..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {tiers.length > 0 && (
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Tiers" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              {tiers.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={limitFilter} onValueChange={setLimitFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="All Users" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="at">At Limit Only</SelectItem>
            <SelectItem value="near">Near Limit (80%+)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart2 size={40} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No usage records match your filters</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Tier</TableHead>
                  {counterKeys.map(k => (
                    <TableHead key={k} className="capitalize">{k.replace(/_/g, " ")}</TableHead>
                  ))}
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(row => {
                  const hasAlert = Object.values(row.counters).some(c => c.percentage >= 80);
                  return (
                    <TableRow key={row.userId} className={hasAlert ? "bg-amber-50/30" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {hasAlert && <AlertTriangle size={12} className="text-amber-500 shrink-0" />}
                          <div>
                            <p className="text-sm font-medium">{row.userName || "—"}</p>
                            <p className="text-xs text-muted-foreground">{row.userEmail}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TIER_COLORS[row.tier] ?? "bg-gray-100 text-gray-600"}`}>
                          {row.tier || "—"}
                        </span>
                      </TableCell>
                      {counterKeys.map(k => {
                        const c = row.counters[k];
                        if (!c) return <TableCell key={k} className="text-muted-foreground text-xs">—</TableCell>;
                        return (
                          <TableCell key={k}>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{c.used.toLocaleString()}</span>
                              {c.limit !== -1 && <span className="text-xs text-muted-foreground">/ {c.limit.toLocaleString()}</span>}
                              <PctBadge pct={c.percentage} />
                            </div>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-xs text-muted-foreground">
                        {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="px-4 py-3 border-t text-xs text-muted-foreground">
            Showing {filtered.length} of {rows.length} users
          </div>
        </Card>
      )}
    </div>
  );
}
