"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";
import {
  Users, FileText, ShoppingBag, TrendingUp, TrendingDown, Eye, DollarSign, ArrowUpRight
} from "lucide-react";

const userGrowthData = [
  { month: "Aug", users: 240, revenue: 4200 },
  { month: "Sep", users: 310, revenue: 5600 },
  { month: "Oct", users: 480, revenue: 7100 },
  { month: "Nov", users: 620, revenue: 9300 },
  { month: "Dec", users: 780, revenue: 11200 },
  { month: "Jan", users: 950, revenue: 13800 },
  { month: "Feb", users: 1120, revenue: 16500 },
  { month: "Mar", users: 1340, revenue: 19200 },
];

const revenueByProduct = [
  { name: "Analytics Pro", revenue: 8400 },
  { name: "CRM Suite", revenue: 5200 },
  { name: "Dev Tools", revenue: 3100 },
  { name: "Marketing Hub", revenue: 2700 },
  { name: "Support Desk", revenue: 1800 },
];

const recentActivity = [
  { action: "New user registered", user: "priya.sharma@email.com", time: "2 min ago", type: "user" },
  { action: "Blog published", user: "Top 10 SaaS Tools in 2026", time: "18 min ago", type: "blog" },
  { action: "New subscription", user: "Analytics Pro — ₹2,999/mo", time: "41 min ago", type: "sale" },
  { action: "Comment approved", user: "Great article on React hooks!", time: "1h ago", type: "comment" },
  { action: "New user registered", user: "arjun.mehta@email.com", time: "2h ago", type: "user" },
  { action: "Blog draft saved", user: "Understanding SaaS Metrics", time: "3h ago", type: "blog" },
];

const topBlogs = [
  { title: "Top 10 SaaS Tools in 2026", views: 12400, status: "published" },
  { title: "Getting Started with React 19", views: 9870, status: "published" },
  { title: "Mastering TypeScript Generics", views: 7230, status: "published" },
  { title: "Building Scalable APIs with Next.js", views: 5640, status: "published" },
  { title: "Database Design for SaaS Apps", views: 4110, status: "draft" },
];

const statCards = [
  {
    label: "Total Users",
    value: "12,847",
    change: "+18.2%",
    positive: true,
    icon: Users,
    color: "text-violet-600",
    bg: "bg-violet-100",
    description: "from last month",
  },
  {
    label: "Monthly Revenue",
    value: "₹1,92,000",
    change: "+12.5%",
    positive: true,
    icon: DollarSign,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    description: "from last month",
  },
  {
    label: "Published Blogs",
    value: "148",
    change: "+6.3%",
    positive: true,
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-100",
    description: "from last month",
  },
  {
    label: "SaaS Products",
    value: "12",
    change: "-2 inactive",
    positive: false,
    icon: ShoppingBag,
    color: "text-orange-600",
    bg: "bg-orange-100",
    description: "2 need attention",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1 text-sm gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          Live Data
        </Badge>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* User & Revenue Growth */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>User Growth & Revenue</CardTitle>
            <CardDescription>Monthly users and revenue over the last 8 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={userGrowthData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
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
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(220 13% 91%)", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="users" stroke="#8b5cf6" fill="url(#colorUsers)" strokeWidth={2} name="Users" />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#colorRevenue)" strokeWidth={2} name="Revenue (₹)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Product */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Product</CardTitle>
            <CardDescription>Monthly MRR breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByProduct} layout="vertical" margin={{ top: 0, right: 5, left: -10, bottom: 0 }}>
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

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                  item.type === "user" ? "bg-violet-100 text-violet-600" :
                  item.type === "blog" ? "bg-blue-100 text-blue-600" :
                  item.type === "sale" ? "bg-emerald-100 text-emerald-600" :
                  "bg-amber-100 text-amber-600"
                }`}>
                  {item.type === "user" ? <Users size={14} /> :
                   item.type === "blog" ? <FileText size={14} /> :
                   item.type === "sale" ? <DollarSign size={14} /> :
                   <Eye size={14} />}
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

        {/* Top Blogs */}
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
              {topBlogs.map((blog, i) => (
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
