"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Loader2, CheckCircle2, XCircle, AlertTriangle, Database, Zap, Server, Clock, Activity, HardDrive, Cpu, MemoryStick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";

interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "down";
  latencyMs: number | null;
  message: string | null;
  checkedAt: string;
}

interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

interface SystemMetrics {
  uptime: number;
  cpuUsage: number;
  memoryUsed: number;
  memoryTotal: number;
  diskUsed: number;
  diskTotal: number;
  nodeVersion: string;
  environment: string;
}

interface HealthData {
  overall: "healthy" | "degraded" | "down";
  services: ServiceHealth[];
  queues: QueueStats[];
  metrics: SystemMetrics;
  checkedAt: string;
}

const STATUS_CFG = {
  healthy: { cls: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", Icon: CheckCircle2, label: "Healthy" },
  degraded: { cls: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500", Icon: AlertTriangle, label: "Degraded" },
  down: { cls: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500", Icon: XCircle, label: "Down" },
};

const SERVICE_ICONS: Record<string, any> = {
  database: Database,
  redis: Zap,
  api: Server,
  storage: HardDrive,
};

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export default function HealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api("/admin/health");
      setData(res);
    } catch {
      // Fallback mock for when API doesn't exist yet
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, load]);

  const overall = data?.overall ?? "healthy";
  const overallCfg = STATUS_CFG[overall];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground mt-1">Real-time monitoring of all platform services</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${autoRefresh ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-background border-border text-muted-foreground"}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <div className={`rounded-xl border-2 p-4 flex items-center gap-4 ${overallCfg.cls}`}>
        <div className={`w-3 h-3 rounded-full ${overallCfg.dot} ${overall === "healthy" ? "animate-pulse" : ""}`} />
        <div className="flex-1">
          <p className="font-bold text-base">System Status: {overallCfg.label}</p>
          {data?.checkedAt && (
            <p className="text-xs opacity-70">Last checked: {new Date(data.checkedAt).toLocaleString("en-IN")}</p>
          )}
        </div>
        <overallCfg.Icon size={24} />
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : !data ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl text-muted-foreground">
          <Activity size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Health endpoint not available</p>
          <p className="text-sm mt-1">Add <code className="bg-muted px-1 rounded">/admin/health</code> to your Core API to enable monitoring</p>
        </div>
      ) : (
        <>
          {/* System Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-violet-600" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Uptime</p>
                </div>
                <p className="text-2xl font-bold">{formatUptime(data.metrics.uptime)}</p>
                <p className="text-xs text-muted-foreground mt-1">{data.metrics.environment} · Node {data.metrics.nodeVersion}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu size={16} className="text-blue-600" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">CPU</p>
                </div>
                <p className="text-2xl font-bold">{data.metrics.cpuUsage.toFixed(1)}%</p>
                <Progress value={data.metrics.cpuUsage} className="h-1.5 mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <MemoryStick size={16} className="text-emerald-600" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Memory</p>
                </div>
                <p className="text-2xl font-bold">{formatBytes(data.metrics.memoryUsed)}</p>
                <Progress value={(data.metrics.memoryUsed / data.metrics.memoryTotal) * 100} className="h-1.5 mt-2" />
                <p className="text-xs text-muted-foreground mt-1">of {formatBytes(data.metrics.memoryTotal)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive size={16} className="text-amber-600" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Disk</p>
                </div>
                <p className="text-2xl font-bold">{formatBytes(data.metrics.diskUsed)}</p>
                <Progress value={(data.metrics.diskUsed / data.metrics.diskTotal) * 100} className="h-1.5 mt-2" />
                <p className="text-xs text-muted-foreground mt-1">of {formatBytes(data.metrics.diskTotal)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
              <CardDescription>Health status of all connected services</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {data.services.map(svc => {
                  const cfg = STATUS_CFG[svc.status];
                  const Icon = SERVICE_ICONS[svc.name.toLowerCase()] ?? Server;
                  return (
                    <div key={svc.name} className="flex items-center gap-4 px-6 py-4">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Icon size={18} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold capitalize">{svc.name}</p>
                        {svc.message && <p className="text-xs text-muted-foreground truncate">{svc.message}</p>}
                      </div>
                      {svc.latencyMs !== null && (
                        <span className="text-xs text-muted-foreground font-mono">{svc.latencyMs}ms</span>
                      )}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>
                        <cfg.Icon size={11} /> {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Queues */}
          {data.queues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Job Queues</CardTitle>
                <CardDescription>BullMQ queue depths and processing stats</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      {["Queue", "Waiting", "Active", "Completed", "Failed"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.queues.map(q => (
                      <tr key={q.name} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono text-sm font-medium">{q.name}</td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${q.waiting > 100 ? "text-amber-600" : "text-foreground"}`}>{q.waiting.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${q.active > 0 ? "text-blue-600" : "text-muted-foreground"}`}>{q.active.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3 text-emerald-600 font-semibold">{q.completed.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${q.failed > 0 ? "text-red-600" : "text-muted-foreground"}`}>{q.failed.toLocaleString()}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
