"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area, LineChart, Line,
} from "recharts";
import {
  TrendingUp, Eye, Users, MousePointerClick, Timer, ArrowUpRight,
  Loader2, DollarSign, BarChart3, Zap, CreditCard, TrendingDown,
  RefreshCw, ArrowDownRight, Package,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorState } from "@/components/ErrorState";
import { fetchAnalytics, fetchRevenue } from "@/lib/api";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  metrics: { pageviews: number; uniqueUsers: number; avgClickRate: number; avgSessionTime: string };
  trafficOverview: { date: string; sessions: number; pageviews: number; users: number }[];
  trafficSources: { source: string; percentage: number }[];
  topPages: { page: string; views: number; bounceRate: number; avgTime: string }[];
  mrrData: { month: string; revenue: number }[];
}

interface RevenueData {
  mrr: number;
  arr: number;
  totalSubRevenuePaise: number;
  totalInvoices: number;
  creditPurchaseTxCount: number;
  activeSubs: number;
  monthlySubs: number;
  yearlySubs: number;
  mrrChartData: { month: string; revenue: number }[];
  revenueByProduct: { name: string; total: number }[];
  range: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatInr(paise: number) {
  const inr = paise / 100;
  if (inr >= 10_000_000) return `₹${(inr / 10_000_000).toFixed(2)}Cr`;
  if (inr >= 100_000) return `₹${(inr / 100_000).toFixed(2)}L`;
  if (inr >= 1_000) return `₹${(inr / 1_000).toFixed(1)}K`;
  return `₹${inr.toLocaleString('en-IN')}`;
}

const SOURCE_COLORS: Record<string, string> = {
  Organic: "#8b5cf6", Direct: "#3b82f6", Social: "#10b981", Referral: "#f59e0b", Email: "#ef4444",
};

const PRODUCT_PALETTE = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"];

export default function AnalyticsPage() {
  const [tab, setTab] = useState<"traffic" | "revenue">("traffic");
  const [range, setRange] = useState("30d");
  const [revenueRange, setRevenueRange] = useState("12m");

  const [trafficData, setTrafficData] = useState<AnalyticsData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [trafficLoading, setTrafficLoading] = useState(true);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [trafficError, setTrafficError] = useState<string | null>(null);
  const [revenueError, setRevenueError] = useState<string | null>(null);

  // Load traffic
  useEffect(() => {
    setTrafficLoading(true);
    setTrafficError(null);
    fetchAnalytics(range)
      .then(setTrafficData)
      .catch((e) => setTrafficError(e.message || "Failed to load analytics"))
      .finally(() => setTrafficLoading(false));
  }, [range]);

  // Load revenue when tab opens or range changes
  const loadRevenue = useCallback(() => {
    setRevenueLoading(true);
    setRevenueError(null);
    fetchRevenue(revenueRange)
      .then(setRevenueData)
      .catch((e) => setRevenueError(e.message || "Failed to load revenue"))
      .finally(() => setRevenueLoading(false));
  }, [revenueRange]);

  useEffect(() => {
    if (tab === "revenue") loadRevenue();
  }, [tab, loadRevenue]);

  // ── Tab Bar ──────────────────────────────────────────────────────────────────

  const TABS = [
    { id: "traffic" as const, label: "Traffic", icon: <BarChart3 size={14} /> },
    { id: "revenue" as const, label: "Revenue", icon: <DollarSign size={14} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Track traffic, revenue, and performance</p>
        </div>
        <div className="flex gap-2">
          {tab === "traffic" && (
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          )}
          {tab === "revenue" && (
            <>
              <Select value={revenueRange} onValueChange={setRevenueRange}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3m">Last 3 months</SelectItem>
                  <SelectItem value="6m">Last 6 months</SelectItem>
                  <SelectItem value="12m">Last 12 months</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={loadRevenue}>
                <RefreshCw size={14} />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors"
            style={{
              marginBottom: "-1px",
              color: tab === t.id ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
              background: "transparent",
              border: "none",
              borderBottomWidth: "2px",
              borderBottomStyle: "solid",
              borderBottomColor: tab === t.id ? "hsl(var(--primary))" : "transparent",
              cursor: "pointer",
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ══ TRAFFIC TAB ══ */}
      {tab === "traffic" && (
        <>
          {trafficLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : trafficError ? (
            <ErrorState error={trafficError} />
          ) : !trafficData ? (
            <ErrorState error="Unable to load analytics data." />
          ) : (
            <>
              {/* Metrics */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  { label: "Total Pageviews", value: trafficData.metrics.pageviews >= 1000 ? `${(trafficData.metrics.pageviews / 1000).toFixed(1)}K` : String(trafficData.metrics.pageviews), icon: Eye },
                  { label: "Unique Users", value: trafficData.metrics.uniqueUsers >= 1000 ? `${(trafficData.metrics.uniqueUsers / 1000).toFixed(1)}K` : String(trafficData.metrics.uniqueUsers), icon: Users },
                  { label: "Avg. Click Rate", value: `${trafficData.metrics.avgClickRate}%`, icon: MousePointerClick },
                  { label: "Avg. Session Time", value: trafficData.metrics.avgSessionTime, icon: Timer },
                ].map((m) => (
                  <Card key={m.label}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-violet-100"><m.icon size={18} className="text-violet-600" /></div>
                      </div>
                      <p className="text-2xl font-bold">{m.value}</p>
                      <p className="text-sm text-muted-foreground">{m.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Traffic Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Traffic Overview</CardTitle>
                  <CardDescription>Sessions, pageviews and unique users over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trafficData.trafficOverview} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="gSessions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gPageviews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                      <Legend />
                      <Area type="monotone" dataKey="sessions" stroke="#8b5cf6" fill="url(#gSessions)" strokeWidth={2} name="Sessions" />
                      <Area type="monotone" dataKey="pageviews" stroke="#3b82f6" fill="url(#gPageviews)" strokeWidth={2} name="Pageviews" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sources + Top Pages */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Traffic Sources</CardTitle>
                    <CardDescription>Where your visitors come from</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const sourcesWithColors = trafficData.trafficSources.map(s => ({
                        ...s, name: s.source, value: s.percentage,
                        color: SOURCE_COLORS[s.source] || "#6b7280",
                      }));
                      return (
                        <>
                          <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                              <Pie data={sourcesWithColors} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                                {sourcesWithColors.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                              </Pie>
                              <Tooltip formatter={(v) => [`${v}%`, ""]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="space-y-2 mt-2">
                            {sourcesWithColors.map(s => (
                              <div key={s.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                                  <span className="text-muted-foreground">{s.name}</span>
                                </div>
                                <span className="font-semibold">{s.value}%</span>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>

                <Card className="xl:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Top Pages</CardTitle>
                      <CardDescription>Most visited pages this period</CardDescription>
                    </div>
                    <Badge variant="secondary" className="gap-1"><ArrowUpRight size={12} /> By views</Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Page</TableHead>
                          <TableHead>Views</TableHead>
                          <TableHead>Bounce</TableHead>
                          <TableHead>Avg. Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trafficData.topPages.map((page) => (
                          <TableRow key={page.page}>
                            <TableCell className="font-mono text-xs text-violet-600">{page.page}</TableCell>
                            <TableCell className="font-semibold">{page.views.toLocaleString()}</TableCell>
                            <TableCell>
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${page.bounceRate > 50 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                {page.bounceRate}%
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{page.avgTime}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </>
      )}

      {/* ══ REVENUE TAB ══ */}
      {tab === "revenue" && (
        <>
          {revenueLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : revenueError ? (
            <ErrorState error={revenueError} onRetry={loadRevenue} />
          ) : !revenueData ? null : (
            <>
              {/* KPI Row */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  { label: "MRR (Monthly Recurring)",  value: formatInr(revenueData.mrr),                icon: TrendingUp,       bg: "bg-violet-100", color: "text-violet-600" },
                  { label: "ARR Projection",            value: formatInr(revenueData.arr),                icon: BarChart3,        bg: "bg-blue-100",   color: "text-blue-600" },
                  { label: "Revenue (Period)",          value: formatInr(revenueData.totalSubRevenuePaise), icon: DollarSign,     bg: "bg-green-100",  color: "text-green-600" },
                  { label: "Active Subscriptions",      value: revenueData.activeSubs,                    icon: CreditCard,       bg: "bg-amber-100",  color: "text-amber-600" },
                ].map(m => (
                  <Card key={m.label}>
                    <CardContent className="p-5">
                      <div className={`p-2.5 rounded-lg ${m.bg} w-fit mb-3`}>
                        <m.icon size={18} className={m.color} />
                      </div>
                      <p className="text-2xl font-bold">{typeof m.value === "number" ? m.value.toLocaleString() : m.value}</p>
                      <p className="text-sm text-muted-foreground">{m.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Secondary stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Invoices",     value: revenueData.totalInvoices,         icon: "📄" },
                  { label: "Credit Purchases",   value: revenueData.creditPurchaseTxCount, icon: "⚡" },
                  { label: "Monthly Plans",      value: revenueData.monthlySubs,           icon: "📅" },
                  { label: "Yearly Plans",       value: revenueData.yearlySubs,            icon: "🗓️" },
                ].map(m => (
                  <Card key={m.label}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <span className="text-2xl">{m.icon}</span>
                      <div>
                        <p className="text-xl font-bold">{m.value.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{m.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* MRR Growth Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue over Time</CardTitle>
                  <CardDescription>Monthly invoice revenue from subscriptions</CardDescription>
                </CardHeader>
                <CardContent>
                  {revenueData.mrrChartData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                      <BarChart3 size={32} className="mb-2 opacity-30" />
                      <p className="text-sm">No revenue data yet for this period.</p>
                      <p className="text-xs mt-1">Revenue will appear here after users make payments.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={revenueData.mrrChartData} margin={{ top: 0, right: 5, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatInr(v)} />
                        <Tooltip
                          formatter={(v) => [formatInr(Number(v)), "Revenue"]}
                          contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                        />
                        <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Revenue by Product */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Product</CardTitle>
                    <CardDescription>Which products are generating the most revenue</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {revenueData.revenueByProduct.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                        <Package size={28} className="mb-2 opacity-30" />
                        <p className="text-sm">No product revenue data yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {revenueData.revenueByProduct.map((p, i) => {
                          const pct = revenueData.totalSubRevenuePaise > 0 
                            ? Math.round((p.total / revenueData.totalSubRevenuePaise) * 100) 
                            : 0;
                          return (
                            <div key={p.name}>
                              <div className="flex justify-between text-sm mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium truncate max-w-[150px]">{p.name}</span>
                                  <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted">{pct}%</span>
                                </div>
                                <span className="font-bold text-muted-foreground">{formatInr(p.total)}</span>
                              </div>
                              <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%`, backgroundColor: PRODUCT_PALETTE[i % PRODUCT_PALETTE.length] }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Billing Cycle Split</CardTitle>
                    <CardDescription>Monthly vs yearly subscription distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {revenueData.activeSubs === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                        <CreditCard size={28} className="mb-2 opacity-30" />
                        <p className="text-sm">No active subscriptions.</p>
                      </div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: "Monthly", value: revenueData.monthlySubs },
                                { name: "Yearly",  value: revenueData.yearlySubs },
                              ]}
                              cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value"
                            >
                              <Cell fill="#8b5cf6" />
                              <Cell fill="#10b981" />
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-6 mt-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-violet-500" />
                            <span className="text-muted-foreground">Monthly</span>
                            <span className="font-bold">{revenueData.monthlySubs}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span className="text-muted-foreground">Yearly</span>
                            <span className="font-bold">{revenueData.yearlySubs}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
