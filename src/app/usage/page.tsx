"use client";

import { useState, useEffect } from "react";
import { BarChart2, RefreshCw, AlertTriangle, Users, Loader2, ArrowRight, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorState } from "@/components/ErrorState";
import { fetchAdminUsage } from "@/lib/api";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppUsageSummary {
  appId: string;
  totalUsers: number;
  usersAtLimit: number;       // >= 100%
  usersNearLimit: number;     // >= 80%
  counters: Record<string, { total: number; avg: number; max: number }>;
}

interface UsageSummaryResponse {
  apps: AppUsageSummary[];
  totalTrackedUsers: number;
  totalCounterEvents: number;
  period: string;
}

// ─── Usage Bar ────────────────────────────────────────────────────────────────

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-full">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ─── App Usage Card ───────────────────────────────────────────────────────────

function AppUsageCard({ app, maxUsers }: { app: AppUsageSummary; maxUsers: number }) {
  const atLimitPct = app.totalUsers > 0 ? Math.round((app.usersAtLimit / app.totalUsers) * 100) : 0;
  const nearLimitPct = app.totalUsers > 0 ? Math.round((app.usersNearLimit / app.totalUsers) * 100) : 0;
  const counterKeys = Object.keys(app.counters);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 border border-violet-200 flex items-center justify-center text-sm font-extrabold text-violet-700 shrink-0">
              {app.appId.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-[15px] text-gray-900 capitalize">{app.appId}</p>
              <p className="text-[11px] text-gray-400">{app.totalUsers.toLocaleString()} tracked users</p>
            </div>
          </div>
          <Link
            href={`/usage/${encodeURIComponent(app.appId)}`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:underline shrink-0"
          >
            Details <ArrowRight size={11} />
          </Link>
        </div>

        {/* User volume bar */}
        <div>
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>Users tracked</span>
            <span>{app.totalUsers.toLocaleString()}</span>
          </div>
          <MiniBar value={app.totalUsers} max={maxUsers} color="#7c3aed" />
        </div>

        {/* Limit alerts */}
        {(app.usersAtLimit > 0 || app.usersNearLimit > 0) && (
          <div className="grid grid-cols-2 gap-2">
            {app.usersAtLimit > 0 && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-2.5 py-2">
                <AlertTriangle size={12} className="text-red-500 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-red-700">{app.usersAtLimit} at limit</p>
                  <p className="text-[10px] text-red-500">{atLimitPct}% of users</p>
                </div>
              </div>
            )}
            {app.usersNearLimit > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2">
                <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-amber-700">{app.usersNearLimit} near limit</p>
                  <p className="text-[10px] text-amber-500">{nearLimitPct}% of users</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Counter breakdown */}
        {counterKeys.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-gray-100">
            {counterKeys.slice(0, 3).map(key => {
              const c = app.counters[key];
              return (
                <div key={key} className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 capitalize">{key.replace(/_/g, " ")}</span>
                  <div className="flex items-center gap-3 text-gray-700">
                    <span>avg <strong>{Math.round(c.avg).toLocaleString()}</strong></span>
                    <span>max <strong>{c.max.toLocaleString()}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsageDashboardPage() {
  const [data, setData] = useState<UsageSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appFilter, setAppFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminUsage({ limit: 100 });
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load usage data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const apps = data?.apps ?? [];
  const filtered = appFilter === "all" ? apps : apps.filter(a => a.appId === appFilter);
  const maxUsers = Math.max(...apps.map(a => a.totalUsers), 1);

  const totalAtLimit = apps.reduce((s, a) => s + a.usersAtLimit, 0);
  const totalNearLimit = apps.reduce((s, a) => s + a.usersNearLimit, 0);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (error) return <ErrorState error={error} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usage Dashboard</h1>
          <p className="text-muted-foreground mt-1">Cross-app usage counters and limit alerts</p>
        </div>
        <Button variant="outline" onClick={load} className="gap-2 w-full sm:w-auto">
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Apps Tracked", value: apps.length, icon: <Activity size={18} className="text-violet-600" />, bg: "bg-violet-100" },
          { label: "Tracked Users", value: (data?.totalTrackedUsers ?? 0).toLocaleString(), icon: <Users size={18} className="text-blue-600" />, bg: "bg-blue-100" },
          { label: "At Limit", value: totalAtLimit.toLocaleString(), icon: <AlertTriangle size={18} className="text-red-600" />, bg: "bg-red-100" },
          { label: "Near Limit (80%+)", value: totalNearLimit.toLocaleString(), icon: <AlertTriangle size={18} className="text-amber-600" />, bg: "bg-amber-100" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-start gap-4">
              <div className={`p-2.5 rounded-lg ${s.bg} shrink-0`}>{s.icon}</div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      {apps.length > 1 && (
        <div className="flex items-center gap-3">
          <BarChart2 size={15} className="text-muted-foreground" />
          <Select value={appFilter} onValueChange={setAppFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Apps" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Apps</SelectItem>
              {apps.map(a => (
                <SelectItem key={a.appId} value={a.appId} className="capitalize">{a.appId}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* App Cards */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart2 size={40} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">No usage data yet</p>
            <p className="text-xs text-muted-foreground mt-1">Usage counters appear once apps start tracking via POST /v1/usage/track</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered
            .sort((a, b) => (b.usersAtLimit + b.usersNearLimit) - (a.usersAtLimit + a.usersNearLimit))
            .map(app => (
              <AppUsageCard key={app.appId} app={app} maxUsers={maxUsers} />
            ))}
        </div>
      )}
    </div>
  );
}
