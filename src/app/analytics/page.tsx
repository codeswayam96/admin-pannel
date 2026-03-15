"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from "recharts";
import { TrendingUp, Eye, Users, MousePointerClick, Timer, ArrowUpRight, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorState } from "@/components/ErrorState";
import { fetchAnalytics } from "@/lib/api";

const sourceColors: Record<string, string> = {
  Organic: "#8b5cf6",
  Direct: "#3b82f6",
  Social: "#10b981",
  Referral: "#f59e0b",
  Email: "#ef4444",
};

interface AnalyticsData {
  metrics: { pageviews: number; uniqueUsers: number; avgClickRate: number; avgSessionTime: string };
  trafficOverview: { date: string; sessions: number; pageviews: number; users: number }[];
  trafficSources: { source: string; percentage: number }[];
  topPages: { page: string; views: number; bounceRate: number; avgTime: string }[];
  mrrData: { month: string; revenue: number }[];
}

export default function AnalyticsPage() {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchAnalytics(range)
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [range]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!data) {
    return <ErrorState error="Unable to load analytics data from API." />;
  }

  const metricCards = [
    { label: "Total Pageviews", value: data.metrics.pageviews >= 1000 ? `${(data.metrics.pageviews / 1000).toFixed(1)}K` : String(data.metrics.pageviews), icon: Eye },
    { label: "Unique Users", value: data.metrics.uniqueUsers >= 1000 ? `${(data.metrics.uniqueUsers / 1000).toFixed(1)}K` : String(data.metrics.uniqueUsers), icon: Users },
    { label: "Avg. Click Rate", value: `${data.metrics.avgClickRate}%`, icon: MousePointerClick },
    { label: "Avg. Session Time", value: data.metrics.avgSessionTime, icon: Timer },
  ];

  const sourcesWithColors = data.trafficSources.map(s => ({
    ...s,
    name: s.source,
    value: s.percentage,
    color: sourceColors[s.source] || `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Track traffic, revenue, and performance</p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {metricCards.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-violet-100">
                  <m.icon size={18} className="text-violet-600" />
                </div>
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
            <AreaChart data={data.trafficOverview} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
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

      {/* Revenue & Sources */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Recurring Revenue</CardTitle>
            <CardDescription>MRR growth over the past months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.mrrData} margin={{ top: 0, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, "MRR"]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="MRR" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Where your visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={sourcesWithColors} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {sourcesWithColors.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, ""]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {sourcesWithColors.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="text-muted-foreground">{s.name}</span>
                  </div>
                  <span className="font-semibold">{s.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages */}
      <Card>
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
                <TableHead>Bounce Rate</TableHead>
                <TableHead>Avg. Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topPages.map((page) => (
                <TableRow key={page.page}>
                  <TableCell className="font-mono text-xs text-violet-600">{page.page}</TableCell>
                  <TableCell className="font-semibold">{page.views.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${page.bounceRate > 50 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
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
  );
}
