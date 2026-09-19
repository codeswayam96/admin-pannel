"use client";

import { useEffect, useCallback, useMemo, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, Cell,
} from "recharts";
import {
  Users, FileText, ShoppingBag, TrendingUp, TrendingDown, Eye,
  DollarSign, ArrowUpRight, Bell, UserPlus, PlusCircle, HeartPulse,
  Zap, Wifi, WifiOff, RefreshCw, Calendar,
} from "lucide-react";
import Link from "next/link";
import { fetchDashboard } from "@/lib/api";
import { ErrorState, SkeletonStatCard } from "@codeswayam/ui";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ExportButton } from "@/components/dashboard/ExportButton";
import { exportToCSV, exportToJSON } from "@/lib/export/csv-exporter";
import { exportToPDF } from "@/lib/export/pdf-exporter";

type DashboardStats = {
  totalUsers: number;
  usersTrend: number;
  monthlyRevenue: number;
  revenueTrend: number;
  publishedBlogs: number;
  blogsTrend: number;
  saasProducts: number;
  inactiveProducts: number;
};

type DashboardResponse = {
  stats: DashboardStats;
  userGrowth: { month: string; users: number; revenue: number }[];
  revenueByProduct: { name: string; revenue: number }[];
  recentActivity: { action: string; user: string; time: string; type: "user" | "blog" | "sale" | "comment" }[];
  topBlogs: { title: string; views: number; status: string }[];
  availableMonths?: { value: string; label: string }[];
  period?: string;
  waterfall?: { newMrr: number; expansion: number; contraction: number; churn: number; netChange: number };
};

/** Animated number counter that transitions between values */
function AnimatedNumber({ value = 0, prefix = '' }: { value?: number; prefix?: string }) {
  const numericValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  const [displayed, setDisplayed] = useState(numericValue);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = displayed ?? 0;
    const end = numericValue;
    if (start === end) return;
    const duration = 600;
    const startTime = performance.now();

    const step = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
      setDisplayed(Math.round(start + (end - start) * eased));
      if (t < 1) frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericValue]);

  return <>{prefix}{(displayed ?? 0).toLocaleString()}</>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [period, setPeriod] = useState<string>("all");
  const esRef = useRef<EventSource | null>(null);

  // ── Fetch dashboard data with period filter ──────────────────────────────
  const loadDashboard = useCallback((selectedPeriod: string = period) => {
    setLoading(true);
    setError(null);
    fetchDashboard(selectedPeriod)
      .then((res) => {
        setData(res);
        setStats(res?.stats ?? null);
        setLastUpdated(new Date());
      })
      .catch((err) => setError(err.message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    loadDashboard(period);
  }, [period, loadDashboard]);

  // ── SSE connection for live stat updates ──────────────────────────────────
  useEffect(() => {
    if (typeof EventSource === 'undefined') return;

    const connect = () => {
      const es = new EventSource('/api/dashboard/stream');
      esRef.current = es;

      es.onopen = () => setSseConnected(true);

      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          // Only update live stats if viewing live/current view
          if ((period === 'all' || period === 'current') && (payload.type === 'snapshot' || payload.type === 'update')) {
            setStats(payload.stats);
            setLastUpdated(new Date());
          }
        } catch { /* malformed frame */ }
      };

      es.onerror = () => {
        setSseConnected(false);
        es.close();
        // Reconnect after 15 seconds
        setTimeout(connect, 15_000);
      };
    };

    connect();
    return () => {
      esRef.current?.close();
    };
  }, [period]);

  // statCards reads from live 'stats' (updated by SSE) instead of initial data.stats
  const statCards = useMemo(() => {
    const s = stats;
    if (!s) return [];

    const totalUsers = s.totalUsers ?? 0;
    const usersTrend = s.usersTrend ?? 0;
    const monthlyRevenue = s.monthlyRevenue ?? 0;
    const revenueTrend = s.revenueTrend ?? 0;
    const publishedBlogs = s.publishedBlogs ?? 0;
    const blogsTrend = s.blogsTrend ?? 0;
    const saasProducts = s.saasProducts ?? (s as Record<string, any>).totalProducts ?? 0;
    const inactiveProducts = s.inactiveProducts ?? 0;

    return [
      {
        label: "Total Users",
        rawValue: totalUsers,
        prefix: '',
        change: `${usersTrend >= 0 ? '+' : ''}${usersTrend}%`,
        positive: usersTrend >= 0,
        icon: Users,
        color: 'text-violet-600 dark:text-violet-400',
        bg: 'bg-violet-100 dark:bg-violet-500/20',
        description: period === 'all' ? 'total registered' : 'users in period',
      },
      {
        label: period === 'all' ? 'Monthly Revenue (MRR)' : 'Period Revenue',
        rawValue: monthlyRevenue,
        prefix: '₹',
        change: `${revenueTrend >= 0 ? '+' : ''}${revenueTrend}%`,
        positive: revenueTrend >= 0,
        icon: DollarSign,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-100 dark:bg-emerald-500/20',
        description: period === 'all' || period === 'current' ? 'MRR this month' : 'for selected period',
      },
      {
        label: 'Published Blogs',
        rawValue: publishedBlogs,
        prefix: '',
        change: `${blogsTrend >= 0 ? '+' : ''}${blogsTrend}%`,
        positive: blogsTrend >= 0,
        icon: FileText,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-500/20',
        description: 'from last month',
      },
      {
        label: 'SaaS Products',
        rawValue: saasProducts,
        prefix: '',
        change: inactiveProducts > 0 ? `~${inactiveProducts} inactive` : 'all active',
        positive: inactiveProducts === 0,
        icon: ShoppingBag,
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-100 dark:bg-orange-500/20',
        description: `${inactiveProducts} need attention`,
      },
    ];
  }, [stats, period]);

  const waterfallData = useMemo(() => {
    if (data?.waterfall) {
      const { newMrr, expansion, contraction, churn, netChange } = data.waterfall;
      return [
        { name: 'New MRR', value: newMrr, fill: '#10b981' },
        { name: 'Expansion', value: expansion, fill: '#3b82f6' },
        { name: 'Contraction', value: contraction, fill: '#f59e0b' },
        { name: 'Churn', value: churn, fill: '#ef4444' },
        { name: 'Net Change', value: netChange, fill: netChange >= 0 ? '#8b5cf6' : '#6b7280' },
      ];
    }

    const base = stats?.monthlyRevenue || 125000;
    const newMrr = Math.round(base * 0.18);
    const expansion = Math.round(base * 0.08);
    const contraction = Math.round(base * -0.04);
    const churn = Math.round(base * -0.06);
    const netChange = newMrr + expansion + contraction + churn;

    return [
      { name: 'New MRR', value: newMrr, fill: '#10b981' },
      { name: 'Expansion', value: expansion, fill: '#3b82f6' },
      { name: 'Contraction', value: contraction, fill: '#f59e0b' },
      { name: 'Churn', value: churn, fill: '#ef4444' },
      { name: 'Net Change', value: netChange, fill: netChange >= 0 ? '#8b5cf6' : '#6b7280' },
    ];
  }, [data, stats]);

  if (error) {
    return <ErrorState error={error} />;
  }

  const handleExportDashboard = async (format: "csv" | "pdf" | "json") => {
    if (!data) {
      toast.error("Dashboard data not loaded");
      return;
    }

    if (format === "csv") {
      const growthRows = (data.userGrowth || []).map((row) => ({
        period: row.month,
        users: row.users,
        revenueInr: row.revenue,
      }));
      exportToCSV(growthRows, `dashboard_growth_${period}`, [
        { key: "period", header: "Period / Month" },
        { key: "users", header: "Total Users" },
        { key: "revenueInr", header: "Revenue (INR)" },
      ]);
      toast.success("Exported dashboard metrics to CSV");
    } else if (format === "pdf") {
      const rows = [
        { metric: "Total Users", value: String(stats?.totalUsers ?? 0), trend: `${stats?.usersTrend ?? 0}%` },
        { metric: "Monthly Revenue", value: `Rs. ${(stats?.monthlyRevenue ?? 0).toLocaleString("en-IN")}`, trend: `${stats?.revenueTrend ?? 0}%` },
        { metric: "Published Blogs", value: String(stats?.publishedBlogs ?? 0), trend: `${stats?.blogsTrend ?? 0}%` },
        { metric: "Active SaaS Products", value: String(stats?.saasProducts ?? 0), trend: "—" },
        ...(data.userGrowth || []).map((g) => ({
          metric: `Month: ${g.month}`,
          value: `Users: ${g.users}`,
          trend: `Rs. ${g.revenue.toLocaleString("en-IN")}`,
        })),
      ];
      await exportToPDF(
        rows,
        `dashboard_summary_${period}`,
        [
          { key: "metric", header: "Metric / Period" },
          { key: "value", header: "Value" },
          { key: "trend", header: "Growth / Revenue" },
        ],
        {
          title: "CodeSwayam Dashboard Report",
          subtitle: `Period: ${period.toUpperCase()} • Exported on ${new Date().toLocaleDateString()}`,
        }
      );
      toast.success("Exported dashboard summary to PDF");
    } else if (format === "json") {
      exportToJSON(data, `dashboard_snapshot_${period}`);
      toast.success("Exported dashboard snapshot to JSON");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={period} onValueChange={(val) => { setPeriod(val); }}>
            <SelectTrigger className="w-[180px] bg-background">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground mr-1.5 shrink-0" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time (Live)</SelectItem>
              <SelectItem value="current">Current Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="12m">Last 12 Months</SelectItem>
              {data?.availableMonths?.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboard(period)}
            title="Refresh dashboard"
            className="h-9 px-2.5"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </Button>

          <ExportButton
            onExportCSV={() => handleExportDashboard("csv")}
            onExportPDF={() => handleExportDashboard("pdf")}
            onExportJSON={() => handleExportDashboard("json")}
            label="Export"
            className="h-9"
          />

          {lastUpdated && (
            <span className="text-xs text-muted-foreground hidden md:inline">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Badge
            variant="secondary"
            className={`px-3 py-1 text-xs gap-1.5 transition-colors ${
              sseConnected ? 'border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : ''
            }`}
          >
            {sseConnected ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 animate-pulse" />
            )}
            {sseConnected ? 'Live' : 'Connecting...'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          // Skeleton loading state — 4 cards
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          statCards.map((stat) => (
            <Card key={stat.label} className="relative overflow-hidden transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                    <stat.icon size={20} className={stat.color} />
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-semibold ${stat.positive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {stat.positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {stat.change}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold tabular-nums">
                    <AnimatedNumber value={stat.rawValue} prefix={stat.prefix} />
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} className="text-violet-600" />
          <h2 className="text-sm font-bold text-foreground">Quick Actions</h2>
          <span className="text-xs text-muted-foreground ml-auto">Common tasks</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/blogs/new", icon: PlusCircle, label: "New Blog Post", desc: "Write & publish", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border-blue-100 dark:border-blue-500/20" },
            { href: "/users", icon: UserPlus, label: "Invite User", desc: "Add team member", color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 border-violet-100 dark:border-violet-500/20" },
            { href: "/notifications", icon: Bell, label: "Send Notification", desc: "Push campaign", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 border-amber-100 dark:border-amber-500/20" },
            { href: "/health", icon: HeartPulse, label: "System Health", desc: "Check status", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border-emerald-100 dark:border-emerald-500/20" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-150 group ${action.bg}`}
            >
              <div className="p-2 rounded-lg bg-white dark:bg-black/20 shadow-sm">
                <action.icon size={18} className={action.color} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>User Growth & Revenue</CardTitle>
            <CardDescription>Monthly users and revenue over the last 8 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data?.userGrowth ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(220 13% 91%)", fontSize: "12px" }} />
                <Area type="monotone" dataKey="users" stroke="#8b5cf6" fill="url(#colorUsers)" strokeWidth={2} name="Users" />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#colorRevenue)" strokeWidth={2} name="Revenue (₹)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Product</CardTitle>
            <CardDescription>Monthly MRR breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data?.revenueByProduct ?? []} layout="vertical" margin={{ top: 0, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(220 13% 91%)", fontSize: "12px" }}
                  formatter={(v) => [`₹${Number(v).toLocaleString()}`, "Revenue"]}
                />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* MRR Waterfall Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle>MRR Waterfall & Movements</CardTitle>
              <CardDescription>Monthly recurring revenue changes breakdown for this billing period</CardDescription>
            </div>
            {stats && (
              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 w-fit">
                {(() => {
                  const net = waterfallData[4].value;
                  const base = Math.max(1, (stats.monthlyRevenue ?? 0) - net);
                  const pct = Math.min(100, Math.max(-100, (net / base) * 100)).toFixed(1);
                  const sign = net >= 0 ? '+' : '';
                  return `Net growth: ${sign}${pct}%`;
                })()}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* Chart */}
            <div className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={waterfallData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: any) => `₹${Number(v).toLocaleString()}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(220 13% 91%)", fontSize: "12px" }}
                    formatter={(v) => [`₹${Number(v).toLocaleString()}`, "Amount"]}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {waterfallData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Insight Stats */}
            <div className="space-y-4">
              <div className="rounded-xl border p-4 bg-muted/10 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Waterfall breakdown</h3>
                <div className="space-y-2">
                  {waterfallData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                        {item.name}
                      </span>
                      <span className={cn(
                        "font-bold",
                        item.value > 0 ? "text-emerald-600" : item.value < 0 ? "text-red-500" : "text-foreground"
                      )}>
                        {item.value >= 0 ? '+' : ''}₹{item.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl border bg-card text-xs leading-relaxed text-muted-foreground">
                <span className="font-bold text-foreground block mb-1">💡 Quick Insights:</span>
                Your MRR is expanding due to strong <span className="text-emerald-600 font-semibold">New MRR</span> and expansion sales, offsetting churn which is currently well within safe bounds.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(data?.recentActivity ?? []).map((item, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div
                  className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                    item.type === "user"
                      ? "bg-violet-100 text-violet-600"
                      : item.type === "blog"
                        ? "bg-blue-100 text-blue-600"
                        : item.type === "sale"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-amber-100 text-amber-600"
                  }`}
                >
                  {item.type === "user" ? (
                    <Users size={14} />
                  ) : item.type === "blog" ? (
                    <FileText size={14} />
                  ) : item.type === "sale" ? (
                    <DollarSign size={14} />
                  ) : (
                    <Eye size={14} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.action}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.user}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Blogs</CardTitle>
              <CardDescription>Highest performing blog posts</CardDescription>
            </div>
            <a href="/blogs" className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
              View all <ArrowUpRight size={14} />
            </a>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.topBlogs ?? []).map((blog, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground font-medium w-5">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium leading-tight">{blog.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Eye size={12} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{blog.views.toLocaleString()} views</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={blog.status === "published" ? "success" : "warning"} className="capitalize">
                    {blog.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
