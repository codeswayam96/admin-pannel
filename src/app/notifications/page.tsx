"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Bell, Send, Users, Zap, Globe, Layers, Trash2,
    Loader2, CheckCircle2, XCircle, Clock, BarChart3,
    AlertCircle, RefreshCw, ChevronDown, ChevronUp, Search, Filter, UserX, Smartphone, Chrome,
    Download, Calendar, Copy, Edit, Pause, Play, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
    sendNotificationCampaign,
    fetchNotificationCampaigns,
    fetchNotificationStats,
    deleteNotificationCampaign,
    fetchProducts,
    fetchNotificationSubscribers,
    revokeNotificationSubscription,
    type NotificationCampaign,
    type NotificationStats,
    type NotificationAudience,
} from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
    return new Date(d).toLocaleString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

/** Security helper: Prevents javascript: and other malicious URI schemes */
function sanitizeUrl(url: string): string {
    if (!url) return "";
    const trimmed = url.trim();
    if (trimmed.toLowerCase().startsWith("javascript:")) return "about:blank";
    if (trimmed.toLowerCase().startsWith("data:")) return "about:blank";
    return trimmed;
}

/** Helper to parse User Agent into a more readable format */
function parseUA(ua: string | null) {
    if (!ua) return { browser: "Unknown", os: "Unknown" };
    
    let browser = "Other";
    if (ua.includes("Firefox/")) browser = "Firefox";
    else if (ua.includes("Edg/")) browser = "Edge";
    else if (ua.includes("Chrome/")) browser = "Chrome";
    else if (ua.includes("Safari/")) browser = "Safari";

    let os = "Desktop";
    if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    else if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Macintosh")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";

    return { browser, os };
}

const STATUS_CFG: Record<string, { label: string; cls: string; Icon: any }> = {
    sent:      { label: "Sent",      cls: "bg-green-50 text-green-700 border-green-200",  Icon: CheckCircle2 },
    sending:   { label: "Sending",   cls: "bg-blue-50 text-blue-700 border-blue-200",     Icon: Loader2 },
    pending:   { label: "Pending",   cls: "bg-amber-50 text-amber-700 border-amber-200",  Icon: Clock },
    scheduled: { label: "Scheduled", cls: "bg-violet-50 text-violet-700 border-violet-200", Icon: Clock },
    failed:    { label: "Failed",    cls: "bg-red-50 text-red-700 border-red-200",        Icon: XCircle },
};

const AUDIENCE_OPTIONS: { value: NotificationAudience; label: string; desc: string; Icon: any }[] = [
    { value: "all",         label: "All Users",        desc: "Every registered user",                Icon: Globe },
    { value: "subscribers", label: "Subscribers Only", desc: "Users with an active subscription",   Icon: Zap },
    { value: "saas",        label: "Specific Product",  desc: "Users subscribed to one SaaS product", Icon: Layers },
    { value: "segment",     label: "User IDs",          desc: "Comma-separated list of user IDs",    Icon: Users },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: {
    label: string; value: string | number; icon: any; color: string;
}) {
    return (
        <div className="rounded-xl border bg-card p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={18} />
            </div>
            <div>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <p className="text-2xl font-extrabold text-foreground leading-tight">{value}</p>
            </div>
        </div>
    );
}

// ─── Campaign Row ─────────────────────────────────────────────────────────────

function CampaignRow({ campaign, onDelete }: {
    campaign: NotificationCampaign;
    onDelete: (id: number) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const cfg = STATUS_CFG[campaign.status] ?? STATUS_CFG.pending;

    return (
        <div className="border rounded-xl overflow-hidden bg-card">
            <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpanded((v) => !v)}
            >
                {/* Status */}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border shrink-0 ${cfg.cls}`}>
                    <cfg.Icon size={10} className={campaign.status === "sending" ? "animate-spin" : ""} />
                    {cfg.label}
                </span>

                {/* Title + audience */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{campaign.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{campaign.body}</p>
                </div>

                {/* Meta */}
                <div className="hidden sm:flex items-center gap-6 shrink-0 text-xs text-muted-foreground">
                    <span className="capitalize">{campaign.audience}{campaign.saasId ? ` · ${campaign.saasId}` : ""}</span>
                    {campaign.sentAt && <span>{fmtDate(campaign.sentAt)}</span>}
                    <span className="text-green-600 font-semibold">{campaign.sentCount} sent</span>
                    {campaign.failedCount > 0 && (
                        <span className="text-red-500 font-semibold">{campaign.failedCount} failed</span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(campaign.id); }}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete campaign"
                    >
                        <Trash2 size={14} />
                    </button>
                    {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                </div>
            </div>

            {expanded && (
                <div className="border-t px-5 py-4 bg-muted/20 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Audience</p>
                        <p className="font-medium capitalize">{campaign.audience}</p>
                    </div>
                    {campaign.saasId && (
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">SaaS ID</p>
                            <p className="font-medium">{campaign.saasId}</p>
                        </div>
                    )}
                    {campaign.url && (
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">URL</p>
                            <a 
                                href={sanitizeUrl(campaign.url)} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-violet-600 hover:underline truncate block"
                            >
                                {campaign.url}
                            </a>
                        </div>
                    )}
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Created</p>
                        <p className="font-medium">{fmtDate(campaign.createdAt)}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Delivered</p>
                        <p className="font-bold text-green-600">{campaign.sentCount}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Failed</p>
                        <p className={`font-bold ${campaign.failedCount > 0 ? "text-red-500" : "text-muted-foreground"}`}>{campaign.failedCount}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Compose Form ─────────────────────────────────────────────────────────────

interface FormState {
    title: string;
    body: string;
    url: string;
    icon: string;
    audience: NotificationAudience;
    saasId: string;
    userIds: string;
    scheduledAt: string;
}

const EMPTY_FORM: FormState = {
    title: "", body: "", url: "", icon: "",
    audience: "all", saasId: "", userIds: "", scheduledAt: "",
};

function ComposeForm({ products, onSent }: {
    products: { saasId: string; name: string }[];
    onSent: () => void;
}) {
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [sending, setSending] = useState(false);

    const set = (k: keyof FormState, v: string) =>
        setForm((f) => ({ ...f, [k]: v }));

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim() || !form.body.trim()) {
            toast.error("Title and body are required.");
            return;
        }
        if (form.audience === "saas" && !form.saasId) {
            toast.error("Select a SaaS product for this audience.");
            return;
        }
        if (form.audience === "segment" && !form.userIds.trim()) {
            toast.error("Enter at least one user ID.");
            return;
        }

        setSending(true);
        try {
            const payload: any = {
                title: form.title.trim(),
                body: form.body.trim(),
                audience: form.audience,
                ...(form.url && { url: sanitizeUrl(form.url) }),
                ...(form.icon && { icon: sanitizeUrl(form.icon) }),
                ...(form.audience === "saas" && { saasId: form.saasId }),
                ...(form.audience === "segment" && {
                    userIds: form.userIds.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n)),
                }),
                ...(form.scheduledAt && { scheduledAt: new Date(form.scheduledAt).toISOString() }),
            };

            const res = await sendNotificationCampaign(payload);
            toast.success(`Campaign queued — ${res.queued} subscribers targeted.`);
            setForm(EMPTY_FORM);
            onSent();
        } catch (err: any) {
            toast.error(err.message || "Failed to send notification.");
        } finally {
            setSending(false);
        }
    };

    const selectedAudience = AUDIENCE_OPTIONS.find((a) => a.value === form.audience)!;

    return (
        <form onSubmit={handleSend} className="space-y-5">
            {/* Audience selector */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Target Audience
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {AUDIENCE_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => set("audience", opt.value)}
                            className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
                                form.audience === opt.value
                                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                                    : "border-border hover:border-violet-300 bg-card"
                            }`}
                        >
                            <opt.Icon size={15} className={form.audience === opt.value ? "text-violet-600" : "text-muted-foreground"} />
                            <span className={`text-xs font-bold ${form.audience === opt.value ? "text-violet-700" : "text-foreground"}`}>
                                {opt.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Conditional audience fields */}
            {form.audience === "saas" && (
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                        SaaS Product
                    </label>
                    <select
                        value={form.saasId}
                        onChange={(e) => set("saasId", e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                        required
                    >
                        <option value="">Select a product…</option>
                        {products.map((p) => (
                            <option key={p.saasId} value={p.saasId}>{p.name} ({p.saasId})</option>
                        ))}
                    </select>
                </div>
            )}

            {form.audience === "segment" && (
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                        User IDs <span className="normal-case font-normal">(comma-separated)</span>
                    </label>
                    <input
                        type="text"
                        value={form.userIds}
                        onChange={(e) => set("userIds", e.target.value)}
                        placeholder="1, 42, 108, 256"
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                        required
                    />
                </div>
            )}

            {/* Title */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Title <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="e.g. New feature available 🚀"
                    maxLength={80}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                    required
                />
                <p className="text-[10px] text-muted-foreground mt-1 text-right">{form.title.length}/80</p>
            </div>

            {/* Body */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Message Body <span className="text-red-500">*</span>
                </label>
                <textarea
                    value={form.body}
                    onChange={(e) => set("body", e.target.value)}
                    placeholder="Short, punchy message. Keep it under 120 characters."
                    maxLength={200}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
                    required
                />
                <p className="text-[10px] text-muted-foreground mt-1 text-right">{form.body.length}/200</p>
            </div>

            {/* URL + Icon row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Click URL <span className="normal-case font-normal text-muted-foreground">(optional)</span>
                    </label>
                    <input
                        type="url"
                        value={form.url}
                        onChange={(e) => set("url", e.target.value)}
                        placeholder="https://app.codeswayam.com/dashboard"
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Icon URL <span className="normal-case font-normal text-muted-foreground">(optional)</span>
                    </label>
                    <input
                        type="url"
                        value={form.icon}
                        onChange={(e) => set("icon", e.target.value)}
                        placeholder="https://cdn.codeswayam.com/icon.png"
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                </div>
            </div>

            {/* Schedule */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Schedule <span className="normal-case font-normal text-muted-foreground">(leave blank to send immediately)</span>
                </label>
                <input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) => set("scheduledAt", e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
            </div>

            {/* Preview */}
            {(form.title || form.body) && (
                <div className="rounded-xl border border-dashed border-violet-300 bg-violet-50/40 dark:bg-violet-950/20 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600 mb-2">Preview</p>
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
                            <Bell size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">{form.title || "Notification Title"}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{form.body || "Notification body text…"}</p>
                            {form.url && <p className="text-[10px] text-violet-600 mt-1 truncate">{form.url}</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Submit */}
            <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {sending ? (
                    <><Loader2 size={15} className="animate-spin" /> Sending…</>
                ) : (
                    <><Send size={15} /> {form.scheduledAt ? "Schedule Campaign" : "Send Now"}</>
                )}
            </button>
        </form>
    );
}

// ─── Subscribers Tab ──────────────────────────────────────────────────────────

interface Subscriber {
    id: number;
    userId: number;
    userName: string | null;
    userEmail: string | null;
    saasId: string | null;
    endpoint: string;
    userAgent: string | null;
    createdAt: string;
}

function SubscribersTab({ products }: { products: { saasId: string; name: string }[] }) {
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [saasFilter, setSaasFilter] = useState("all");
    const [deviceFilter, setDeviceFilter] = useState("all");
    const [revoking, setRevoking] = useState<number[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [confirmRevoke, setConfirmRevoke] = useState<number[] | null>(null);

    const loadSubscribers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchNotificationSubscribers();
            setSubscribers(Array.isArray(data) ? data : []);
        } catch (err: any) {
            toast.error(err.message || "Failed to load subscribers");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadSubscribers(); }, [loadSubscribers]);

    const handleRevoke = async (ids: number[]) => {
        setRevoking(prev => [...prev, ...ids]);
        try {
            await Promise.all(ids.map(id => revokeNotificationSubscription(id)));
            setSubscribers(prev => prev.filter(s => !ids.includes(s.id)));
            setSelected(prev => prev.filter(id => !ids.includes(id)));
            toast.success(ids.length > 1 ? `${ids.length} subscriptions revoked` : "Subscription revoked");
        } catch (err: any) {
            toast.error(err.message || "Failed to revoke one or more subscriptions");
            loadSubscribers();
        } finally {
            setRevoking(prev => prev.filter(id => !ids.includes(id)));
        }
    };

    const requestRevoke = (ids: number[]) => setConfirmRevoke(ids);

    const toggleSelect = (id: number) => {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        if (selected.length === filtered.length) setSelected([]);
        else setSelected(filtered.map(s => s.id));
    };

    const exportToCSV = () => {
        const headers = ["User ID", "Name", "Email", "Product", "Device", "Browser", "Registration Date"];
        const rows = filtered.map(s => {
            const { browser, os } = parseUA(s.userAgent);
            const prod = products.find(p => p.saasId === s.saasId);
            return [
                s.userId,
                s.userName || "Anonymous",
                s.userEmail || "N/A",
                prod?.name || s.saasId || "Direct",
                os,
                browser,
                new Date(s.createdAt).toLocaleString("en-IN")
            ];
        });
        const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${filtered.length} subscribers`);
    };

    const filtered = subscribers.filter(s => {
        const matchSearch = (s.userName || "").toLowerCase().includes(search.toLowerCase()) ||
            (s.userEmail || "").toLowerCase().includes(search.toLowerCase());
        const matchSaas = saasFilter === "all" || s.saasId === saasFilter;
        const { os } = parseUA(s.userAgent);
        const matchDevice = deviceFilter === "all" || 
            (deviceFilter === "mobile" && (os === "Android" || os === "iOS")) ||
            (deviceFilter === "desktop" && (os === "Windows" || os === "macOS" || os === "Linux"));
        return matchSearch && matchSaas && matchDevice;
    });

    const byProduct = subscribers.reduce<Record<string, number>>((acc, s) => {
        const key = s.saasId || "unknown";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {/* Stats by product */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(byProduct).slice(0, 4).map(([saasId, count]) => {
                    const prod = products.find(p => p.saasId === saasId);
                    return (
                        <div key={saasId} className="rounded-xl border bg-card p-4 shadow-sm">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 truncate">{prod?.name || saasId}</p>
                            <p className="text-2xl font-black">{count.toLocaleString()}</p>
                        </div>
                    );
                })}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 max-w-sm">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email..."
                            className="pl-9 h-9"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={saasFilter} onValueChange={setSaasFilter}>
                        <SelectTrigger className="w-[160px] h-9">
                            <Filter size={14} className="mr-2 text-muted-foreground" />
                            <SelectValue placeholder="All Products" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Products</SelectItem>
                            {products.map(p => (
                                <SelectItem key={p.saasId} value={p.saasId}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={deviceFilter} onValueChange={setDeviceFilter}>
                        <SelectTrigger className="w-[140px] h-9">
                            <Smartphone size={14} className="mr-2 text-muted-foreground" />
                            <SelectValue placeholder="All Devices" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Devices</SelectItem>
                            <SelectItem value="mobile">Mobile</SelectItem>
                            <SelectItem value="desktop">Desktop</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 gap-2"
                        onClick={exportToCSV}
                        disabled={filtered.length === 0}
                    >
                        <Download size={14} /> Export
                    </Button>
                    {selected.length > 0 && (
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            className="h-9 gap-2"
                            onClick={() => requestRevoke(selected)}
                        >
                            <UserX size={14} /> Revoke ({selected.length})
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={loadSubscribers} className="h-9 w-9 p-0">
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </Button>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 size={32} className="animate-spin text-violet-600" />
                    <p className="text-sm text-muted-foreground font-medium">Fetching subscribers...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border-2 border-dashed rounded-2xl bg-muted/20">
                    <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center shadow-inner">
                        <Users size={32} className="text-muted-foreground/30" />
                    </div>
                    <div>
                        <p className="text-base font-bold text-foreground">No subscribers found</p>
                        <p className="text-xs text-muted-foreground max-w-[250px] mx-auto mt-1">
                            {search || saasFilter !== "all" ? "Try adjusting your search or filters to see more results." : "Users will appear here after they opt-in for push notifications in your SaaS products."}
                        </p>
                    </div>
                    {(search || saasFilter !== "all" || deviceFilter !== "all") && (
                        <Button variant="outline" size="sm" onClick={() => { setSearch(""); setSaasFilter("all"); setDeviceFilter("all"); }}>
                            Clear all filters
                        </Button>
                    )}
                </div>
            ) : (
                <div className="border rounded-2xl overflow-hidden bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[800px]">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left w-10">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-input accent-violet-600" 
                                            checked={selected.length === filtered.length && filtered.length > 0}
                                            onChange={toggleAll}
                                        />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">User Details</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Source Product</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Device / Browser</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Registration Date</th>
                                    <th className="text-right px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filtered.map((sub) => {
                                    const prod = products.find(p => p.saasId === sub.saasId);
                                    const { browser, os } = parseUA(sub.userAgent);
                                    const isRevoking = revoking.includes(sub.id);
                                    const isSelected = selected.includes(sub.id);

                                    return (
                                        <tr key={sub.id} className={`hover:bg-muted/20 transition-colors ${isSelected ? "bg-violet-50/30" : ""}`}>
                                            <td className="px-4 py-3">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded border-input accent-violet-600" 
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(sub.id)}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs">
                                                        {(sub.userName || "U").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground leading-none">{sub.userName || "Anonymous User"}</p>
                                                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
                                                            {sub.userEmail || "no-email@provided.com"}
                                                            <span className="text-[10px] text-muted-foreground/30">•</span>
                                                            <span className="font-mono text-[9px] uppercase tracking-tighter bg-muted px-1 rounded">ID: {sub.userId}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className="bg-background font-medium text-[11px] py-0 h-5 px-2 border-violet-200 text-violet-700">
                                                    {prod?.name || sub.saasId || "Direct"}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-foreground font-medium">
                                                        {browser === "Chrome" && <Chrome size={12} className="text-blue-500" />}
                                                        {browser === "Firefox" && <Globe size={12} className="text-orange-500" />}
                                                        {browser === "Safari" && <Globe size={12} className="text-blue-400" />}
                                                        {browser === "Edge" && <Chrome size={12} className="text-cyan-600" />}
                                                        <span className="text-xs">{browser}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                        <Smartphone size={10} />
                                                        <span>{os}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium text-foreground">
                                                        {new Date(sub.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Date(sub.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => requestRevoke([sub.id])}
                                                    disabled={isRevoking}
                                                    title="Revoke subscription"
                                                >
                                                    {isRevoking ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <UserX size={14} />
                                                    )}
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="border-t px-4 py-3 bg-muted/10 flex items-center justify-between">
                        <p className="text-[11px] text-muted-foreground font-medium">
                            Showing <span className="text-foreground">{filtered.length}</span> of <span className="text-foreground">{subscribers.length}</span> total subscribers
                        </p>
                        {selected.length > 0 && (
                            <p className="text-[11px] text-violet-700 font-bold">
                                {selected.length} row{selected.length > 1 ? "s" : ""} selected
                            </p>
                        )}
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={confirmRevoke !== null}
                onOpenChange={(open) => !open && setConfirmRevoke(null)}
                title={confirmRevoke && confirmRevoke.length > 1 ? `Revoke ${confirmRevoke.length} subscriptions?` : "Revoke subscription?"}
                description="Users will stop receiving push notifications. This cannot be undone."
                confirmLabel="Revoke"
                variant="destructive"
                onConfirm={() => {
                    if (confirmRevoke) handleRevoke(confirmRevoke);
                    setConfirmRevoke(null);
                }}
            />
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
    const [stats, setStats] = useState<NotificationStats | null>(null);
    const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
    const [products, setProducts] = useState<{ saasId: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [campaignSearch, setCampaignSearch] = useState("");
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [statsData, campaignsData, productsData] = await Promise.all([
                fetchNotificationStats().catch(() => null),
                fetchNotificationCampaigns().catch(() => []),
                fetchProducts().catch(() => []),
            ]);
            setStats(statsData);
            setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
            setProducts(
                (Array.isArray(productsData) ? productsData : []).map((p: any) => ({
                    saasId: p.saasId || p.id,
                    name: p.name,
                }))
            );
        } catch (err: any) {
            setError(err.message || "Failed to load notification data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (id: number) => {
        try {
            await deleteNotificationCampaign(id);
            setCampaigns((prev) => prev.filter((c) => c.id !== id));
            toast.success("Campaign deleted.");
        } catch (err: any) {
            toast.error(err.message || "Failed to delete.");
        }
    };

    const requestDelete = (id: number) => setConfirmDelete(id);

    const filteredCampaigns = campaigns.filter(c => {
        const matchStatus = statusFilter === "all" || c.status === statusFilter;
        const matchSearch = c.title.toLowerCase().includes(campaignSearch.toLowerCase()) ||
            c.body.toLowerCase().includes(campaignSearch.toLowerCase());
        return matchStatus && matchSearch;
    });

    const exportCampaigns = () => {
        const headers = ["ID", "Title", "Body", "Audience", "Status", "Sent", "Failed", "Created", "Sent At"];
        const rows = filteredCampaigns.map(c => [
            c.id,
            c.title,
            c.body,
            c.audience + (c.saasId ? ` (${c.saasId})` : ""),
            c.status,
            c.sentCount,
            c.failedCount,
            fmtDate(c.createdAt),
            c.sentAt ? fmtDate(c.sentAt) : "N/A"
        ]);
        const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `campaigns-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${filteredCampaigns.length} campaigns`);
    };

    return (
        <div className="p-6 space-y-8 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
                        <Bell size={22} className="text-violet-600" /> Push Notifications
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Broadcast push notifications to all users, subscribers, or specific SaaS products.
                    </p>
                </div>
                <button
                    onClick={load}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    <AlertCircle size={15} className="shrink-0" /> {error}
                </div>
            )}

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatCard
                        label="Total Subscribers"
                        value={stats.totalSubscribers.toLocaleString()}
                        icon={Users}
                        color="bg-violet-100 text-violet-600"
                    />
                    <StatCard
                        label="Total Sent"
                        value={stats.totalSent.toLocaleString()}
                        icon={Send}
                        color="bg-green-100 text-green-600"
                    />
                    <StatCard
                        label="Total Failed"
                        value={stats.totalFailed.toLocaleString()}
                        icon={XCircle}
                        color="bg-red-100 text-red-600"
                    />
                </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="campaigns" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="campaigns" className="gap-2">
                        <Send size={14} /> Campaigns
                    </TabsTrigger>
                    <TabsTrigger value="subscribers" className="gap-2">
                        <Users size={14} /> Subscribers
                        {stats && <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{stats.totalSubscribers}</Badge>}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="campaigns" className="space-y-6">
                    {/* Campaign filters */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search campaigns..."
                                className="pl-9 h-9"
                                value={campaignSearch}
                                onChange={e => setCampaignSearch(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[160px] h-9">
                                <Filter size={14} className="mr-2 text-muted-foreground" />
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="sent">Sent</SelectItem>
                                <SelectItem value="sending">Sending</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 gap-2"
                            onClick={exportCampaigns}
                            disabled={filteredCampaigns.length === 0}
                        >
                            <Download size={14} /> Export
                        </Button>
                    </div>

                    {/* Two-column layout: compose + history */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                        {/* Compose */}
                        <div className="rounded-2xl border bg-card p-6 shadow-sm">
                            <h2 className="text-base font-extrabold mb-5 flex items-center gap-2">
                                <Send size={16} className="text-violet-600" /> Compose Campaign
                            </h2>
                            <ComposeForm products={products} onSent={load} />
                        </div>

                        {/* Campaign History */}
                        <div className="rounded-2xl border bg-card p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-base font-extrabold flex items-center gap-2">
                                    <BarChart3 size={16} className="text-violet-600" /> Campaign History
                                </h2>
                                <span className="text-xs text-muted-foreground">
                                    {filteredCampaigns.length} {campaignSearch || statusFilter !== "all" ? `of ${campaigns.length}` : "total"}
                                </span>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 size={24} className="animate-spin text-muted-foreground" />
                                </div>
                            ) : filteredCampaigns.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                                        <Bell size={24} className="text-muted-foreground/40" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {campaigns.length === 0 ? "No campaigns yet" : "No matching campaigns"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {campaigns.length === 0 ? "Send your first notification using the form." : "Try adjusting your filters."}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                    {filteredCampaigns.map((c) => (
                                        <CampaignRow key={c.id} campaign={c} onDelete={handleDelete} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="subscribers">
                    <SubscribersTab products={products} />
                </TabsContent>
            </Tabs>

            {/* Integration guide */}
            <div className="rounded-2xl border border-violet-200 bg-violet-50/40 dark:bg-violet-950/10 p-6">
                <h3 className="text-sm font-extrabold text-violet-700 mb-3 flex items-center gap-2">
                    <Zap size={14} /> Integration Guide
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
                    <div className="space-y-1">
                        <p className="font-bold text-foreground">1. Add sw.js to your app</p>
                        <p>Copy <code className="bg-muted px-1 rounded">public/sw.js</code> from <code className="bg-muted px-1 rounded">codeswayam-auth</code> into your app's <code className="bg-muted px-1 rounded">public/</code> folder.</p>
                    </div>
                    <div className="space-y-1">
                        <p className="font-bold text-foreground">2. Use the hook</p>
                        <p>Import <code className="bg-muted px-1 rounded">useCSWNotifications</code> from <code className="bg-muted px-1 rounded">@codeswayam/auth</code> and call <code className="bg-muted px-1 rounded">subscribe()</code> with your <code className="bg-muted px-1 rounded">saasId</code>.</p>
                    </div>
                    <div className="space-y-1">
                        <p className="font-bold text-foreground">3. Target by product</p>
                        <p>Use <strong>Specific Product</strong> audience above and select the saasId to reach only users of that product.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
