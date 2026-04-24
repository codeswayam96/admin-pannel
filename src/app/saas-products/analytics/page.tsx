"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Users, ArrowDownRight, BarChart2, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { fetchProductAnalytics } from "@/lib/api";
import { ErrorState } from "@/components/ErrorState";

interface ProductAnalyticsData {
  totalMrr: number;
  totalSubs: number;
  mrrByProduct: Record<string, any>[];
  subscriberGrowth: { month: string; subscribers: number }[];
  churnData: { month: string; rate: number }[];
  productShare: { name: string; value: number; color: string }[];
  perProduct: { id: number; name: string; saasId: string; mrr: number; subscribers: number; churn: number; growth: number; arpu: number; color: string }[];
  productKeys: { key: string; name: string }[];
}

function formatInr(paise: number) {
  const inr = paise / 100;
  if (inr >= 10_000_000) return `₹${(inr / 10_000_000).toFixed(2)}Cr`;
  if (inr >= 100_000) return `₹${(inr / 100_000).toFixed(2)}L`;
  if (inr >= 1_000) return `₹${(inr / 1_000).toFixed(1)}K`;
  return `₹${inr.toLocaleString('en-IN')}`;
}

export default function SaasAnalyticsPage() {
  const [data, setData] = useState<ProductAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchProductAnalytics()
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load analytics"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!data) return <ErrorState error="Unable to load product analytics." onRetry={load} />;

  const totalMrr = data.totalMrr;
  const totalSubs = data.totalSubs;
  const avgChurn = data.perProduct.length > 0
    ? (data.perProduct.reduce((s, p) => s + p.churn, 0) / data.perProduct.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/saas-products"><ArrowLeft size={18} /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Product Analytics</h1>
            <p className="text-muted-foreground mt-1">MRR, churn, and subscriber metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1"><BarChart2 size={13} /> Live Data</Badge>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw size={14} /></Button>
        </div>
      </div>

      {data.perProduct.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
          <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No products yet</p>
          <p className="text-sm mt-1">Add SaaS products to see analytics here</p>
          <Button className="mt-4" asChild><Link href="/saas-products">Go to Products</Link></Button>
        </div>
      ) : (
        <>
          {/* Top metrics */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "Total MRR", value: formatInr(totalMrr), change: "Live", positive: true, icon: DollarSign, bg: "bg-violet-100", ic: "text-violet-600" },
              { label: "Total ARR", value: formatInr(totalMrr * 12), change: "Live", positive: true, icon: TrendingUp, bg: "bg-emerald-100", ic: "text-emerald-600" },
              { label: "Total Subscribers", value: totalSubs.toLocaleString(), change: "Live", positive: true, icon: Users, bg: "bg-blue-100", ic: "text-blue-600" },
              { label: "Avg. Churn Rate", value: `${avgChurn}%`, change: "Estimated", positive: true, icon: ArrowDownRight, bg: "bg-amber-100", ic: "text-amber-600" },
            ].map((m) => (
              <Card key={m.label}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${m.bg}`}><m.icon size={18} className={m.ic} /></div>
                    <span className="text-xs font-medium text-muted-foreground">{m.change}</span>
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
                    <BarChart data={data.mrrByProduct} margin={{ top: 0, right: 5, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatInr(v)} />
                      <Tooltip formatter={(v) => [formatInr(Number(v)), ""]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                      <Legend />
                      {data.productKeys.map((pk, i) => {
                        const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
                        return <Bar key={pk.key} dataKey={pk.key} name={pk.name} fill={colors[i % colors.length]} stackId="a" radius={i === data.productKeys.length - 1 ? [2, 2, 0, 0] : undefined} />;
                      })}
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscribers" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Total Subscriber Growth</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={data.subscriberGrowth} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
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
                    <LineChart data={data.churnData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={[0, 5]} />
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
            <Card>
              <CardHeader>
                <CardTitle>Revenue Share</CardTitle>
                <CardDescription>MRR distribution by product</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={data.productShare} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                      {data.productShare.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v}%`, ""]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {data.productShare.map(p => (
                    <div key={p.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                        <span className="text-muted-foreground text-xs truncate max-w-[110px]">{p.name}</span>
                      </div>
                      <span className="font-semibold text-xs">{p.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader><CardTitle>Per-Product Metrics</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {data.perProduct.map((p) => (
                  <div key={p.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{p.name}</span>
                        <Badge variant={p.growth > 0 ? "success" : "warning"} className="text-xs gap-1">
                          {p.growth > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {Math.abs(p.growth)}%
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold">{formatInr(p.mrr)} MRR</span>
                        <span className="text-xs text-muted-foreground ml-2">· {p.subscribers} subs</span>
                      </div>
                    </div>
                    <Progress value={totalMrr > 0 ? (p.mrr / totalMrr) * 100 : 0} className="h-1.5" style={{ "--progress-color": p.color } as any} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>ARPU {formatInr(p.arpu * 100)}</span>
                      <span>Churn {p.churn}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
