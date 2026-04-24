"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw, Users, FileText, ShoppingBag, CreditCard, Activity, Filter, Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchActivity } from "@/lib/api";
import { ErrorState } from "@/components/ErrorState";

type ActivityType = "user" | "blog" | "product" | "subscription" | "credit";

interface ActivityItem {
  id: string;
  type: ActivityType;
  action: string;
  detail: string;
  timeAgo: string;
  timestamp: string | null;
}

const typeConfig: Record<ActivityType, { icon: any; bg: string; iconColor: string; badgeVariant: "default" | "secondary" | "outline" }> = {
  user:         { icon: Users,       bg: "bg-violet-100 dark:bg-violet-500/20",  iconColor: "text-violet-600 dark:text-violet-400",  badgeVariant: "secondary" },
  blog:         { icon: FileText,    bg: "bg-blue-100 dark:bg-blue-500/20",      iconColor: "text-blue-600 dark:text-blue-400",      badgeVariant: "secondary" },
  product:      { icon: ShoppingBag, bg: "bg-amber-100 dark:bg-amber-500/20",    iconColor: "text-amber-600 dark:text-amber-400",    badgeVariant: "secondary" },
  subscription: { icon: CreditCard,  bg: "bg-emerald-100 dark:bg-emerald-500/20", iconColor: "text-emerald-600 dark:text-emerald-400", badgeVariant: "secondary" },
  credit:       { icon: Coins,       bg: "bg-purple-100 dark:bg-purple-500/20",  iconColor: "text-purple-600 dark:text-purple-400",  badgeVariant: "secondary" },
};

const typeLabels: Record<ActivityType, string> = {
  user: "User", blog: "Blog", product: "Product", subscription: "Subscription", credit: "Credit",
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [limit, setLimit] = useState(50);

  const load = (l = limit) => {
    setLoading(true);
    setError(null);
    fetchActivity(l)
      .then(setActivities)
      .catch((err) => setError(err.message || "Failed to load activity"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = activities.filter(a => typeFilter === "all" || a.type === typeFilter);

  const counts: Record<string, number> = {
    all: activities.length,
    user: activities.filter(a => a.type === "user").length,
    blog: activities.filter(a => a.type === "blog").length,
    product: activities.filter(a => a.type === "product").length,
    subscription: activities.filter(a => a.type === "subscription").length,
    credit: activities.filter(a => a.type === "credit").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground mt-1">Real-time history of all platform events</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); load(Number(v)); }}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">Last 25</SelectItem>
              <SelectItem value="50">Last 50</SelectItem>
              <SelectItem value="100">Last 100</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => load()}>
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {(["user", "blog", "product", "subscription", "credit"] as ActivityType[]).map((type) => {
          const config = typeConfig[type];
          return (
            <Card key={type} className={`cursor-pointer transition-all hover:shadow-md ${typeFilter === type ? "ring-2 ring-primary" : ""}`} onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.bg}`}>
                  <config.icon size={16} className={config.iconColor} />
                </div>
                <div>
                  <p className="text-xl font-bold">{counts[type]}</p>
                  <p className="text-xs text-muted-foreground">{typeLabels[type]} events</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-muted-foreground" />
        {(["all", "user", "blog", "product", "subscription", "credit"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${typeFilter === t ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}
          >
            {t === "all" ? "All" : typeLabels[t as ActivityType]} ({counts[t] ?? 0})
          </button>
        ))}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
          <Activity size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No activity yet</p>
          <p className="text-sm mt-1">Platform events will appear here as users register, blogs are published, and subscriptions are created</p>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Event Timeline</CardTitle>
            <CardDescription>Showing {filtered.length} of {activities.length} events</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-0">
                {filtered.map((item, index) => {
                  const config = typeConfig[item.type];
                  return (
                    <div key={item.id} className={`flex gap-6 px-6 py-4 hover:bg-muted/30 transition-colors relative ${index !== filtered.length - 1 ? "border-b border-border/50" : ""}`}>
                      {/* Icon bubble on the timeline */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${config.bg} border-2 border-background`}>
                        <config.icon size={14} className={config.iconColor} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium">{item.action}</p>
                              <Badge variant="outline" className="text-xs capitalize">{typeLabels[item.type]}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.detail}</p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">{item.timeAgo}</span>
                        </div>
                        {item.timestamp && (
                          <p className="text-[10px] text-muted-foreground/60 mt-1">
                            {new Date(item.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
