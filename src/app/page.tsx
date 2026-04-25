"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Users,
  FileText,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Eye,
  DollarSign,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { fetchDashboard } from "@/lib/api";
import { ErrorState } from "@/components/ErrorState";

type DashboardResponse = {
  stats: {
    totalUsers: number;
    usersTrend: number;
    monthlyRevenue: number;
    revenueTrend: number;
    publishedBlogs: number;
    blogsTrend: number;
    saasProducts: number;
    inactiveProducts: number;
  };
  userGrowth: { month: string; users: number; revenue: number }[];
  revenueByProduct: { name: string; revenue: number }[];
  recentActivity: { action: string; user: string; time: string; type: "user" | "blog" | "sale" | "comment" }[];
  topBlogs: { title: string; views: number; status: string }[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch((err) => {
        setError(err.message || "Failed to load dashboard");
      })
      .finally(() => setLoading(false));
  }, []);

  const statCards = useMemo(() => {
    if (!data) return [];

    return [
      {
        label: "Total Users",
        value: data.stats.totalUsers.toLocaleString(),
        change: `${data.stats.usersTrend >= 0 ? "+" : ""}${data.stats.usersTrend}%`,
        positive: data.stats.usersTrend >= 0,
        icon: Users,
        color: "text-violet-600 dark:text-violet-400",
        bg: "bg-violet-100 dark:bg-violet-500/20",
        description: "from last month",
      },
      {
        label: "Monthly Revenue",
        value: `₹${data.stats.monthlyRevenue.toLocaleString()}`,
        change: `${data.stats.revenueTrend >= 0 ? "+" : ""}${data.stats.revenueTrend}%`,
        positive: data.stats.revenueTrend >= 0,
        icon: DollarSign,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-100 dark:bg-emerald-500/20",
        description: "from last month",
      },
      {
        label: "Published Blogs",
        value: data.stats.publishedBlogs.toLocaleString(),
        change: `${data.stats.blogsTrend >= 0 ? "+" : ""}${data.stats.blogsTrend}%`,
        positive: data.stats.blogsTrend >= 0,
        icon: FileText,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-100 dark:bg-blue-500/20",
        description: "from last month",
      },
      {
        label: "SaaS Products",
        value: data.stats.saasProducts.toLocaleString(),
        change: data.stats.inactiveProducts > 0 ? `~${data.stats.inactiveProducts} inactive` : "all active",
        positive: data.stats.inactiveProducts === 0,
        icon: ShoppingBag,
        color: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-100 dark:bg-orange-500/20",
        description: `${data.stats.inactiveProducts} need attention`,
      },
    ];
  }, [data]);

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
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Unable to load dashboard data from API.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1 text-sm gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          Live Data
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                  <stat.icon size={20} className={stat.color} />
                </div>
                <span className={`flex items-center gap-1 text-xs font-semibold ${stat.positive ? "text-emerald-600" : "text-red-500"}`}>
                  {stat.positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {stat.change}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>User Growth & Revenue</CardTitle>
            <CardDescription>Monthly users and revenue over the last 8 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.userGrowth} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
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
              <BarChart data={data.revenueByProduct} layout="vertical" margin={{ top: 0, right: 5, left: -10, bottom: 0 }}>
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recentActivity.map((item, i) => (
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
              {data.topBlogs.map((blog, i) => (
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
