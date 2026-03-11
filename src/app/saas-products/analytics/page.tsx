"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Users, ArrowDownRight, BarChart2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const mrrGrowth = [
  { month: "Sep", analytics: 28000, crm: 18000, devtools: 6000, marketing: 14000, support: 8000 },
  { month: "Oct", analytics: 35000, crm: 22000, devtools: 8000, marketing: 15000, support: 10000 },
  { month: "Nov", analytics: 48000, crm: 28000, devtools: 11000, marketing: 16000, support: 13000 },
  { month: "Dec", analytics: 62000, crm: 34000, devtools: 14000, marketing: 17500, support: 16000 },
  { month: "Jan", analytics: 78000, crm: 42000, devtools: 18000, marketing: 19000, support: 19000 },
  { month: "Feb", analytics: 96000, crm: 52000, devtools: 23000, marketing: 21000, support: 22000 },
  { month: "Mar", analytics: 118000, crm: 64000, devtools: 29000, marketing: 23000, support: 25000 },
];

const churnData = [
  { month: "Sep", rate: 3.2 }, { month: "Oct", rate: 2.8 }, { month: "Nov", rate: 2.4 },
  { month: "Dec", rate: 2.9 }, { month: "Jan", rate: 2.1 }, { month: "Feb", rate: 1.7 }, { month: "Mar", rate: 1.4 },
];

const subscriberData = [
  { month: "Sep", subscribers: 140 }, { month: "Oct", subscribers: 178 }, { month: "Nov", subscribers: 216 },
  { month: "Dec", subscribers: 248 }, { month: "Jan", subscribers: 302 }, { month: "Feb", subscribers: 374 }, { month: "Mar", subscribers: 441 },
];

const productShare = [
  { name: "Analytics Pro", value: 37, color: "#8b5cf6" },
  { name: "CRM Suite", value: 25, color: "#3b82f6" },
  { name: "Dev Tools", value: 14, color: "#10b981" },
  { name: "Marketing Hub", value: 13, color: "#f59e0b" },
  { name: "Support Desk", value: 11, color: "#ef4444" },
];

const products = [
  { name: "Analytics Pro", mrr: 118000, subscribers: 284, churn: 0.8, growth: 12.2, arpu: 2999 },
  { name: "CRM Suite", mrr: 64000, subscribers: 192, churn: 1.2, growth: 8.4, arpu: 1999 },
  { name: "Dev Tools", mrr: 29000, subscribers: 98, churn: 0.5, growth: 24.1, arpu: 999 },
  { name: "Marketing Hub", mrr: 23000, subscribers: 156, churn: 2.1, growth: -3.2, arpu: 1499 },
  { name: "Support Desk", mrr: 25000, subscribers: 211, churn: 1.0, growth: 0.9, arpu: 799 },
];

export default function SaasAnalyticsPage() {
  const [period] = useState("7mo");
  const totalMrr = products.reduce((s, p) => s + p.mrr, 0);
  const totalSubs = products.reduce((s, p) => s + p.subscribers, 0);
  const avgChurn = (products.reduce((s, p) => s + p.churn, 0) / products.length).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link href="/saas-products"><ArrowLeft size={18} /></Link></Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Product Analytics</h1>
            <p className="text-muted-foreground mt-1">MRR, churn, and subscriber metrics</p>
          </div>
        </div>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1"><BarChart2 size={13} /> Last 7 months</Badge>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total MRR", value: `₹${(totalMrr / 1000).toFixed(0)}K`, change: "+12.5%", positive: true, icon: DollarSign, bg: "bg-violet-100", ic: "text-violet-600" },
          { label: "Total ARR", value: `₹${(totalMrr * 12 / 100000).toFixed(1)}L`, change: "+12.5%", positive: true, icon: TrendingUp, bg: "bg-emerald-100", ic: "text-emerald-600" },
          { label: "Total Subscribers", value: totalSubs.toString(), change: "+18.2%", positive: true, icon: Users, bg: "bg-blue-100", ic: "text-blue-600" },
          { label: "Avg. Churn Rate", value: `${avgChurn}%`, change: "-0.5%", positive: true, icon: ArrowDownRight, bg: "bg-amber-100", ic: "text-amber-600" },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${m.bg}`}><m.icon size={18} className={m.ic} /></div>
                <span className={`flex items-center gap-1 text-xs font-semibold ${m.positive ? "text-emerald-600" : "text-red-500"}`}>
                  {m.positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {m.change}
                </span>
              </div>
              <p className="text-2xl font-bold">{m.value}</p>
              <p className="text-sm text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="mrr">
        <TabsList>
          <TabsTrigger value="mrr">MRR by Product</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="churn">Churn Rate</TabsTrigger>
        </TabsList>

        <TabsContent value="mrr" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Recurring Revenue</CardTitle>
              <CardDescription>Revenue breakdown by product over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={mrrGrowth} margin={{ top: 0, right: 5, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}K`} />
                  <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, ""]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                  <Legend />
                  <Bar dataKey="analytics" name="Analytics Pro" fill="#8b5cf6" radius={[2, 2, 0, 0]} stackId="a" />
                  <Bar dataKey="crm" name="CRM Suite" fill="#3b82f6" stackId="a" />
                  <Bar dataKey="devtools" name="Dev Tools" fill="#10b981" stackId="a" />
                  <Bar dataKey="marketing" name="Marketing Hub" fill="#f59e0b" stackId="a" />
                  <Bar dataKey="support" name="Support Desk" fill="#ef4444" radius={[2, 2, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscribers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Subscriber Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={subscriberData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                  <Line type="monotone" dataKey="subscribers" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4 }} name="Subscribers" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="churn" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Churn Rate (%)</CardTitle>
              <CardDescription>Lower is better — target: below 2%</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={churnData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 4]} />
                  <Tooltip formatter={(v) => [`${v}%`, "Churn Rate"]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                  <Line type="monotone" dataKey="rate" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} name="Churn %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Products breakdown + Revenue share */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue share */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Share</CardTitle>
            <CardDescription>MRR distribution by product</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={productShare} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                  {productShare.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, ""]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {productShare.map(p => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                    <span className="text-muted-foreground text-xs">{p.name}</span>
                  </div>
                  <span className="font-semibold text-xs">{p.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Per-product breakdown table */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Per-Product Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {products.map((p) => (
              <div key={p.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{p.name}</span>
                    <Badge variant={p.growth > 0 ? "success" : "warning"} className="text-xs gap-1">
                      {p.growth > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {Math.abs(p.growth)}%
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold">₹{(p.mrr / 1000).toFixed(0)}K MRR</span>
                    <span className="text-xs text-muted-foreground ml-2">·  {p.subscribers} subs</span>
                  </div>
                </div>
                <Progress value={(p.mrr / totalMrr) * 100} className="h-1.5" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>ARPU ₹{p.arpu.toLocaleString()}</span>
                  <span>Churn {p.churn}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
