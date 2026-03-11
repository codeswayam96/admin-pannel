"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from "recharts";
import { TrendingUp, TrendingDown, Eye, Users, MousePointerClick, Timer, ArrowUpRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const trafficData = [
  { date: "Mar 1", sessions: 2100, pageviews: 5800, users: 1800 },
  { date: "Mar 2", sessions: 2400, pageviews: 6200, users: 2100 },
  { date: "Mar 3", sessions: 1900, pageviews: 5100, users: 1700 },
  { date: "Mar 4", sessions: 2800, pageviews: 7400, users: 2400 },
  { date: "Mar 5", sessions: 3200, pageviews: 8900, users: 2900 },
  { date: "Mar 6", sessions: 2600, pageviews: 6800, users: 2300 },
  { date: "Mar 7", sessions: 3800, pageviews: 9600, users: 3200 },
  { date: "Mar 8", sessions: 4200, pageviews: 11200, users: 3700 },
  { date: "Mar 9", sessions: 3600, pageviews: 9400, users: 3100 },
  { date: "Mar 10", sessions: 4800, pageviews: 12100, users: 4200 },
  { date: "Mar 11", sessions: 5100, pageviews: 13400, users: 4600 },
];

const revenueData = [
  { month: "Sep", mrr: 48000, arr: 576000, churn: 2.1 },
  { month: "Oct", mrr: 62000, arr: 744000, churn: 1.8 },
  { month: "Nov", mrr: 78000, arr: 936000, churn: 1.5 },
  { month: "Dec", mrr: 94000, arr: 1128000, churn: 1.9 },
  { month: "Jan", mrr: 118000, arr: 1416000, churn: 1.2 },
  { month: "Feb", mrr: 148000, arr: 1776000, churn: 1.0 },
  { month: "Mar", mrr: 183000, arr: 2196000, churn: 0.9 },
];

const sourcesData = [
  { name: "Organic Search", value: 42, color: "#8b5cf6" },
  { name: "Direct", value: 28, color: "#3b82f6" },
  { name: "Social Media", value: 18, color: "#10b981" },
  { name: "Referral", value: 8, color: "#f59e0b" },
  { name: "Email", value: 4, color: "#ef4444" },
];

const topPages = [
  { page: "/blog/top-10-saas-tools-2026", views: 12400, bounceRate: "32%", avgTime: "4:12" },
  { page: "/blog/react-19-guide", views: 9870, bounceRate: "28%", avgTime: "5:34" },
  { page: "/saas-products/analytics-pro", views: 7230, bounceRate: "41%", avgTime: "2:58" },
  { page: "/blog/typescript-generics", views: 6540, bounceRate: "24%", avgTime: "6:20" },
  { page: "/pricing", views: 5800, bounceRate: "65%", avgTime: "1:45" },
  { page: "/", views: 5400, bounceRate: "55%", avgTime: "2:10" },
];

const metrics = [
  { label: "Total Pageviews", value: "89.4K", change: "+22.3%", positive: true, icon: Eye },
  { label: "Unique Users", value: "34.2K", change: "+18.7%", positive: true, icon: Users },
  { label: "Avg. Click Rate", value: "3.8%", change: "+0.4%", positive: true, icon: MousePointerClick },
  { label: "Avg. Session Time", value: "3m 24s", change: "-0:12", positive: false, icon: Timer },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState("7d");

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
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-violet-100">
                  <m.icon size={18} className="text-violet-600" />
                </div>
                <span className={`flex items-center gap-1 text-xs font-semibold ${m.positive ? "text-emerald-600" : "text-red-500"}`}>
                  {m.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {m.change}
                </span>
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
            <AreaChart data={trafficData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
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
            <CardDescription>MRR growth over the past 7 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueData} margin={{ top: 0, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, "MRR"]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="mrr" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="MRR" />
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
                <Pie data={sourcesData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {sourcesData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, ""]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {sourcesData.map((s) => (
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
              {topPages.map((page) => (
                <TableRow key={page.page}>
                  <TableCell className="font-mono text-xs text-violet-600">{page.page}</TableCell>
                  <TableCell className="font-semibold">{page.views.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={parseFloat(page.bounceRate) > 50 ? "warning" : "success"}>{page.bounceRate}</Badge>
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
