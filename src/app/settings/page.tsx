"use client";

import { useState, useEffect } from "react";
import {
  Save, ShieldCheck, Key, Mail, Lock, Eye, EyeOff, Send,
  CheckCircle2, Globe, Bell, Palette, Shield, Loader2, FlaskConical, Gift, BarChart2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { fetchSettings, updateSettings, testSmtp, changePassword, fetchReferralSettings, updateReferralSettings, fetchAnalyticsSettings, updateAnalyticsSettings, fetchProducts } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────────
interface Settings {
  // General
  siteName: string; siteUrl: string; siteDescription: string;
  adminEmail: string; tagline: string; language: string; timezone: string;
  // Notifications
  notifyNewUser: boolean; notifyNewComment: boolean; notifyNewSubscription: boolean;
  notifyWeeklyReport: boolean; notifySecurityAlerts: boolean;
  notifyProductUpdates: boolean; notifyMarketingEmails: boolean;
  // Moderation
  autoApproveComments: boolean; requireEmailVerification: boolean;
  enableSpamFilter: boolean; maxLoginAttempts: string;
  // Appearance
  theme: string; accentColor: string; postsPerPage: string;
  showAuthorBio: boolean; enableTableOfContents: boolean; enableSocialShare: boolean;
  // SMTP
  smtpHost: string; smtpPort: string; smtpUser: string;
  smtpPass: string; smtpFromEmail: string; smtpFromName: string;
}

interface AppAnalytics {
  gtmId: string;
  gscVerification: string;
  label: string;
}

interface AnalyticsConfig {
  apps: Record<string, AppAnalytics>;
  ga4IdWeb: string;
  metaPixelId: string;
  hotjarId: string;
  clarityId: string;
}

const defaults: Settings = {
  siteName: "CodeSwayam", siteUrl: "https://codeswayam.com",
  siteDescription: "Empowering developers with SaaS insights and coding tutorials.",
  adminEmail: "admin@codeswayam.com", tagline: "Build. Learn. Grow.",
  language: "en", timezone: "Asia/Kolkata",
  notifyNewUser: true, notifyNewComment: true, notifyNewSubscription: true,
  notifyWeeklyReport: true, notifySecurityAlerts: true,
  notifyProductUpdates: false, notifyMarketingEmails: false,
  autoApproveComments: false, requireEmailVerification: true,
  enableSpamFilter: true, maxLoginAttempts: "5",
  theme: "light", accentColor: "#8b5cf6", postsPerPage: "10",
  showAuthorBio: true, enableTableOfContents: true, enableSocialShare: true,
  smtpHost: "", smtpPort: "587", smtpUser: "", smtpPass: "", smtpFromEmail: "", smtpFromName: "CodeSwayam",
};

// Fixed core apps that are always present (not in saas-products table)
const CORE_APPS = [
  { id: "web", label: "codeswayam-web" },
  { id: "auth", label: "codeswayam-auth" },
];

const defaultAnalytics: AnalyticsConfig = {
  apps: {},
  ga4IdWeb: "",
  metaPixelId: "",
  hotjarId: "",
  clarityId: "",
};

const accentPresets = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#f97316"];

function SectionSave({ onSave, saving, label = "Save Changes" }: { onSave: () => void; saving: boolean; label?: string }) {
  return (
    <div className="flex justify-end pt-2">
      <Button onClick={onSave} disabled={saving} className="min-w-28">
        {saving ? <><Loader2 size={14} className="mr-2 animate-spin" />Saving...</> : <><Save size={14} className="mr-2" />{label}</>}
      </Button>
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export default function SettingsPage() {
  const [s, setS] = useState<Settings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // SMTP
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testingSmtp, setTestingSmtp] = useState(false);

  // Password change
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [changingPw, setChangingPw] = useState(false);

  // Referral Settings
  const [refSettings, setRefSettings] = useState({ referralEnabled: true, referralPointsValue: 50 });
  const [savingRef, setSavingRef] = useState(false);

  // Analytics
  const [analytics, setAnalytics] = useState<AnalyticsConfig>(defaultAnalytics);
  const [savingAnalytics, setSavingAnalytics] = useState(false);
  const [saasProducts, setSaasProducts] = useState<{ saasId: string; name: string }[]>([]);

  useEffect(() => {
    fetchSettings()
      .then((data) => {
        if (data) {
          const safeData: any = { ...data };
          Object.keys(defaults).forEach(k => {
            const key = k as keyof Settings;
            if (safeData[key] === null || safeData[key] === undefined) {
              safeData[key] = defaults[key];
            }
          });
          setS({ ...safeData, smtpPass: "" });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetchReferralSettings().then(data => {
      if (data) setRefSettings(data);
    }).catch(() => {});

    fetchAnalyticsSettings().then(data => {
      if (data) setAnalytics({ ...defaultAnalytics, ...data, apps: data.apps || {} });
    }).catch(() => {});

    fetchProducts().then((products: any[]) => {
      // Deduplicate by productFamily — one GTM entry per app, not per plan.
      // If productFamily is not set, fall back to saasId (single-plan products).
      const seen = new Set<string>();
      const deduped: { saasId: string; name: string }[] = [];
      for (const p of products) {
        const familyKey = p.productFamily || p.saasId;
        if (!seen.has(familyKey)) {
          seen.add(familyKey);
          // Use the tag as the display name for the family (e.g. "Auraflow")
          deduped.push({ saasId: familyKey, name: p.tag || p.name });
        }
      }
      setSaasProducts(deduped);
    }).catch(() => {});
  }, []);

  const updApp = (appId: string, field: keyof AppAnalytics, value: string) => {
    setAnalytics(prev => ({
      ...prev,
      apps: {
        ...prev.apps,
        [appId]: { ...prev.apps[appId], gtmId: "", gscVerification: "", label: appId, [field]: value },
      },
    }));
  };

  const saveAnalytics = async () => {
    setSavingAnalytics(true);
    try {
      await updateAnalyticsSettings(analytics);
      toast.success("Analytics settings saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save analytics settings");
    } finally {
      setSavingAnalytics(false);
    }
  };

  const upd = (key: keyof Settings, val: any) => setS(p => ({ ...p, [key]: val }));

  const save = async (section: string) => {
    setSaving(true);
    try {
      await updateSettings({ ...s });
      toast.success(`${section} settings saved!`);
    } catch (err: any) {
      toast.error(err.message || `Failed to save ${section.toLowerCase()} settings`);
    } finally {
      setSaving(false);
    }
  };

  const saveReferrals = async () => {
    setSavingRef(true);
    try {
      await updateReferralSettings(refSettings);
      toast.success("Referral settings saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save referral settings");
    } finally {
      setSavingRef(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!testEmail.trim() || !testEmail.includes("@")) {
      toast.error("Enter a valid email address to send the test to");
      return;
    }
    setTestingSmtp(true);
    try {
      // First save SMTP config
      await updateSettings({ ...s });
      await testSmtp(testEmail);
      toast.success(`Test email sent to ${testEmail}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send test email. Check your SMTP credentials.");
    }
    setTestingSmtp(false);
  };

  const handleChangePassword = async () => {
    if (!pwForm.current) { toast.error("Current password is required"); return; }
    if (pwForm.next.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    if (pwForm.next !== pwForm.confirm) { toast.error("New passwords do not match"); return; }
    setChangingPw(true);
    try {
      await changePassword(pwForm.current, pwForm.next);
      toast.success("Password changed successfully!");
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    }
    setChangingPw(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your admin panel and platform preferences</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-6 flex-wrap h-auto gap-1 overflow-x-auto">
          <TabsTrigger value="general" className="gap-1.5"><Globe size={13} />General</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5"><Bell size={13} />Notifications</TabsTrigger>
          <TabsTrigger value="moderation" className="gap-1.5"><Shield size={13} />Moderation</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5"><Palette size={13} />Appearance</TabsTrigger>
          <TabsTrigger value="email" className="gap-1.5"><Mail size={13} />Email & SMTP</TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5"><Lock size={13} />Security</TabsTrigger>
          <TabsTrigger value="authentication" className="gap-1.5"><ShieldCheck size={13} />Auth</TabsTrigger>
          <TabsTrigger value="referrals" className="gap-1.5"><Gift size={13} />Referrals</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5"><BarChart2 size={13} />Analytics</TabsTrigger>
        </TabsList>

        {/* ── General ─────────────────────────────────────────────────── */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Site Information</CardTitle>
              <CardDescription>Basic settings for your website and platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Site Name</Label>
                  <Input value={s.siteName || ""} onChange={(e) => upd("siteName", e.target.value)} placeholder="CodeSwayam" />
                </div>
                <div className="space-y-1.5">
                  <Label>Site URL</Label>
                  <Input value={s.siteUrl || ""} onChange={(e) => upd("siteUrl", e.target.value)} placeholder="https://codeswayam.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Tagline</Label>
                <Input value={s.tagline || ""} onChange={(e) => upd("tagline", e.target.value)} placeholder="Build. Learn. Grow." />
              </div>
              <div className="space-y-1.5">
                <Label>Site Description</Label>
                <Textarea rows={2} value={s.siteDescription || ""} onChange={(e) => upd("siteDescription", e.target.value)} placeholder="Describe your platform..." />
                <p className="text-xs text-muted-foreground">Used for SEO meta description</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Admin Email</Label>
                  <Input type="email" value={s.adminEmail || ""} onChange={(e) => upd("adminEmail", e.target.value)} placeholder="admin@example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Language</Label>
                  <Select value={s.language} onValueChange={(v) => upd("language", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                      <SelectItem value="hi">🇮🇳 Hindi</SelectItem>
                      <SelectItem value="ta">🇮🇳 Tamil</SelectItem>
                      <SelectItem value="te">🇮🇳 Telugu</SelectItem>
                      <SelectItem value="mr">🇮🇳 Marathi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Timezone</Label>
                <Select value={s.timezone} onValueChange={(v) => upd("timezone", v)}>
                  <SelectTrigger className="max-w-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</SelectItem>
                    <SelectItem value="UTC">UTC +0:00</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (EST -5:00)</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST -8:00)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                    <SelectItem value="Europe/Paris">Europe/Paris (CET +1:00)</SelectItem>
                    <SelectItem value="Asia/Singapore">Asia/Singapore (SGT +8:00)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST +9:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <SectionSave onSave={() => save("General")} saving={saving} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notifications ─────────────────────────────────────────────── */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Choose which events trigger an email to your admin address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0 divide-y">
              <ToggleRow label="New User Registration" desc="Notify when a new user signs up" checked={s.notifyNewUser} onChange={(v) => upd("notifyNewUser", v)} />
              <ToggleRow label="New Comment" desc="Alerts for new blog comments awaiting moderation" checked={s.notifyNewComment} onChange={(v) => upd("notifyNewComment", v)} />
              <ToggleRow label="New Subscription" desc="When someone subscribes to one of your products" checked={s.notifyNewSubscription} onChange={(v) => upd("notifyNewSubscription", v)} />
              <ToggleRow label="Weekly Activity Report" desc="Summary of site activity sent every Monday" checked={s.notifyWeeklyReport} onChange={(v) => upd("notifyWeeklyReport", v)} />
              <ToggleRow label="Security Alerts" desc="Failed login attempts and suspicious activity" checked={s.notifySecurityAlerts} onChange={(v) => upd("notifySecurityAlerts", v)} />
              <ToggleRow label="Product Updates" desc="Updates about CodeSwayam platform features" checked={s.notifyProductUpdates} onChange={(v) => upd("notifyProductUpdates", v)} />
              <ToggleRow label="Marketing Emails" desc="Newsletters and promotional content" checked={s.notifyMarketingEmails} onChange={(v) => upd("notifyMarketingEmails", v)} />
            </CardContent>
          </Card>
          <SectionSave onSave={() => save("Notification")} saving={saving} />
        </TabsContent>

        {/* ── Moderation ───────────────────────────────────────────────── */}
        <TabsContent value="moderation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Moderation</CardTitle>
              <CardDescription>Control how comments and user actions are handled</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0 divide-y">
              <ToggleRow label="Auto-approve Comments" desc="Skip manual review and auto-publish new comments" checked={s.autoApproveComments} onChange={(v) => upd("autoApproveComments", v)} />
              <ToggleRow label="Require Email Verification" desc="Users must verify email before they can comment or access content" checked={s.requireEmailVerification} onChange={(v) => upd("requireEmailVerification", v)} />
              <ToggleRow label="Enable Spam Filter" desc="Automatically detect and block spam comments using Akismet-style heuristics" checked={s.enableSpamFilter} onChange={(v) => upd("enableSpamFilter", v)} />
              <div className="py-4">
                <Label>Max Login Attempts</Label>
                <p className="text-xs text-muted-foreground mb-3">Lock user account after this many failed login attempts in a session</p>
                <Select value={s.maxLoginAttempts} onValueChange={(v) => upd("maxLoginAttempts", v)}>
                  <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 attempts</SelectItem>
                    <SelectItem value="5">5 attempts</SelectItem>
                    <SelectItem value="10">10 attempts</SelectItem>
                    <SelectItem value="unlimited">Unlimited (not recommended)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <SectionSave onSave={() => save("Moderation")} saving={saving} />
        </TabsContent>

        {/* ── Appearance ──────────────────────────────────────────────── */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>Customize how your site looks and feels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Admin Theme</Label>
                  <Select value={s.theme} onValueChange={(v) => upd("theme", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">☀️ Light</SelectItem>
                      <SelectItem value="dark">🌙 Dark</SelectItem>
                      <SelectItem value="system">💻 System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Posts Per Page</Label>
                  <Select value={s.postsPerPage} onValueChange={(v) => upd("postsPerPage", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["5", "10", "20", "50"].map(v => <SelectItem key={v} value={v}>{v} posts</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Accent Color</Label>
                <p className="text-xs text-muted-foreground">Choose your brand's primary color used across buttons and highlights</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {accentPresets.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => upd("accentColor", c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${s.accentColor === c ? "border-foreground scale-110" : "border-transparent hover:scale-105"}`}
                      style={{ background: c }}
                      title={c}
                    />
                  ))}
                  <input
                    type="color"
                    value={s.accentColor || "#8b5cf6"}
                    onChange={(e) => upd("accentColor", e.target.value)}
                    className="w-8 h-8 rounded-full cursor-pointer border border-border bg-transparent"
                    title="Custom color"
                  />
                  <Badge style={{ background: s.accentColor }} className="text-white border-none text-xs">{s.accentColor}</Badge>
                </div>
              </div>
              <Separator />
              <div className="space-y-0 divide-y">
                <ToggleRow label="Show Author Bio" desc="Display author card and biography below blog posts" checked={s.showAuthorBio} onChange={(v) => upd("showAuthorBio", v)} />
                <ToggleRow label="Table of Contents" desc="Automatically generate TOC for long articles" checked={s.enableTableOfContents} onChange={(v) => upd("enableTableOfContents", v)} />
                <ToggleRow label="Social Share Buttons" desc="Add share buttons (Twitter, LinkedIn, WhatsApp) to blog posts" checked={s.enableSocialShare} onChange={(v) => upd("enableSocialShare", v)} />
              </div>
            </CardContent>
          </Card>
          <SectionSave onSave={() => save("Appearance")} saving={saving} />
        </TabsContent>

        {/* ── Email & SMTP ─────────────────────────────────────────────── */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail size={18} className="text-primary" />
                SMTP Configuration
              </CardTitle>
              <CardDescription>
                Configure your outgoing email server. Used for invites, notifications, and verification emails.
                Supports Gmail, Postmark, SendGrid, Mailgun, or any SMTP provider.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>SMTP Host</Label>
                  <Input placeholder="smtp.gmail.com" value={s.smtpHost || ""} onChange={(e) => upd("smtpHost", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>SMTP Port</Label>
                  <Select value={s.smtpPort} onValueChange={(v) => upd("smtpPort", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 (SMTP)</SelectItem>
                      <SelectItem value="465">465 (SMTPS / SSL)</SelectItem>
                      <SelectItem value="587">587 (STARTTLS — recommended)</SelectItem>
                      <SelectItem value="2525">2525 (Alternative)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>SMTP Username</Label>
                  <Input placeholder="you@gmail.com" value={s.smtpUser || ""} onChange={(e) => upd("smtpUser", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>SMTP Password / App Password</Label>
                  <div className="relative">
                    <Input
                      type={showSmtpPass ? "text" : "password"}
                      placeholder="Leave blank to keep existing"
                      value={s.smtpPass || ""}
                      onChange={(e) => upd("smtpPass", e.target.value)}
                      className="pr-10"
                    />
                    <button type="button" onClick={() => setShowSmtpPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showSmtpPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>From Email</Label>
                  <Input placeholder="noreply@codeswayam.com" value={s.smtpFromEmail || ""} onChange={(e) => upd("smtpFromEmail", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>From Name</Label>
                  <Input placeholder="CodeSwayam" value={s.smtpFromName || ""} onChange={(e) => upd("smtpFromName", e.target.value)} />
                </div>
              </div>

              {/* Quick-fill presets */}
              <div className="rounded-lg border border-violet-200 bg-violet-50 dark:border-violet-500/20 dark:bg-violet-500/10 p-4">
                <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 mb-2">⚡ Quick Fill — Common Providers</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Gmail",    host: "smtp.gmail.com",        port: "587" },
                    { label: "Postmark", host: "smtp.postmarkapp.com",  port: "587" },
                    { label: "SendGrid", host: "smtp.sendgrid.net",     port: "587" },
                    { label: "Mailgun",  host: "smtp.mailgun.org",      port: "587" },
                    { label: "Zoho",     host: "smtp.zoho.com",         port: "465" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setS(p => ({ ...p, smtpHost: preset.host, smtpPort: preset.port }))}
                      className="px-2.5 py-1 text-xs bg-white dark:bg-violet-900 border border-violet-200 dark:border-violet-800 rounded-md text-violet-700 dark:text-violet-100 hover:bg-violet-100 dark:hover:bg-violet-800 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <SectionSave onSave={() => save("SMTP")} saving={saving} label="Save SMTP Config" />

              <Separator />

              {/* Test email */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><FlaskConical size={14} /> Send Test Email</Label>
                <p className="text-xs text-muted-foreground">Verify your SMTP config by sending a test email. Config will be saved first.</p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="max-w-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleTestSmtp()}
                  />
                  <Button variant="outline" onClick={handleTestSmtp} disabled={testingSmtp}>
                    {testingSmtp ? <><Loader2 size={14} className="mr-2 animate-spin" />Sending...</> : <><Send size={14} className="mr-2" />Send Test</>}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Security ─────────────────────────────────────────────────── */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock size={18} className="text-primary" />
                Change Admin Password
              </CardTitle>
              <CardDescription>Update your admin account password. Minimum 8 characters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-sm">
              {(["current", "next", "confirm"] as const).map((field) => {
                const labels = { current: "Current Password", next: "New Password", confirm: "Confirm New Password" };
                return (
                  <div key={field} className="space-y-1.5">
                    <Label>{labels[field]}</Label>
                    <div className="relative">
                      <Input
                        type={showPw[field] ? "text" : "password"}
                        value={pwForm[field]}
                        onChange={(e) => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                        placeholder={field === "current" ? "Your current password" : "••••••••"}
                        className="pr-10"
                        onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPw[field] ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {field === "next" && pwForm.next.length > 0 && pwForm.next.length < 8 && (
                      <p className="text-xs text-red-500">Must be at least 8 characters</p>
                    )}
                    {field === "confirm" && pwForm.confirm && pwForm.next !== pwForm.confirm && (
                      <p className="text-xs text-red-500">Passwords do not match</p>
                    )}
                  </div>
                );
              })}
              {pwForm.next.length >= 8 && pwForm.next === pwForm.confirm && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <CheckCircle2 size={13} /> Passwords match
                </div>
              )}
              <Button
                onClick={handleChangePassword}
                disabled={changingPw || !pwForm.current || pwForm.next.length < 8 || pwForm.next !== pwForm.confirm}
                className="w-full"
              >
                {changingPw ? <><Loader2 size={14} className="mr-2 animate-spin" />Updating...</> : <><Lock size={14} className="mr-2" />Update Password</>}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session & Security Info</CardTitle>
              <CardDescription>Current authentication and session configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Auth Mode", value: "Custom Auth (Email + Password + Google OAuth)", color: "text-emerald-600" },
                { label: "Password Hashing", value: "bcryptjs (PBKDF2-like, 10 rounds)", color: "text-blue-600" },
                { label: "Session Type", value: "HttpOnly cookie with JWT", color: "text-violet-600" },
                { label: "Login Lockout", value: `After ${s.maxLoginAttempts === "unlimited" ? "unlimited" : s.maxLoginAttempts} failed attempts`, color: "text-amber-600" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className={`text-sm font-medium ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Authentication ───────────────────────────────────────────── */}
        <TabsContent value="authentication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                Authentication Mode
              </CardTitle>
              <CardDescription>
                Controls how users sign up and log in across all CodeSwayam apps. Currently locked to Custom Auth
                after Clerk was removed. Future providers can be added here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Active: Custom Auth */}
              <div className="p-5 rounded-xl border-2 border-primary bg-primary/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                    <Key size={18} className="text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
                <h3 className="font-semibold text-sm mb-1">Custom Auth (Your Own System)</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Email + password stored in your PostgreSQL database with bcryptjs hashing. Google OAuth also supported. 
                  JWT tokens are issued as HttpOnly cookies. No third-party auth dependency.
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-[10px]">✓ Google OAuth</Badge>
                  <Badge variant="outline" className="text-[10px]">✓ Email/Password</Badge>
                  <Badge variant="outline" className="text-[10px]">✓ HttpOnly JWT</Badge>
                  <Badge variant="outline" className="text-[10px]">✓ Email Verification</Badge>
                  <Badge variant="outline" className="text-[10px]">✓ Password Reset</Badge>
                </div>
              </div>

              {/* Coming soon providers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: "Magic Link Auth", desc: "Passwordless login via one-time email links", icon: "✉️" },
                  { name: "OTP / Phone Auth", desc: "SMS-based authentication with Twilio/AWS SNS", icon: "📱" },
                  { name: "SSO / SAML", desc: "Enterprise single sign-on integration", icon: "🏢" },
                  { name: "Passkeys (WebAuthn)", desc: "Biometric and hardware key authentication", icon: "🔐" },
                ].map((provider) => (
                  <div key={provider.name} className="p-4 rounded-xl border border-dashed border-border bg-muted/30 flex items-start gap-3 opacity-60">
                    <span className="text-xl">{provider.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{provider.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{provider.desc}</p>
                      <Badge variant="outline" className="text-[10px] mt-2">Coming Soon</Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10 p-4">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <strong>Note:</strong> Auth changes affect all users immediately. Test in staging before switching providers.
                  Contact support to enable enterprise auth options.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Analytics ────────────────────────────────────────────────── */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 size={18} className="text-primary" />
                Analytics & Tracking
              </CardTitle>
              <CardDescription>
                GTM IDs and GSC verification are stored in the database and served dynamically — no .env changes or redeploys needed.
                Each app fetches its config from <code className="bg-muted px-1 rounded text-xs">/admin/analytics/config/:appId</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Per-app GTM + GSC — dynamic from DB */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Per-App Tracking <span className="text-xs font-normal text-muted-foreground">(GTM ID + GSC verification per app)</span></p>
                </div>

                {/* Core apps (always shown) */}
                <div className="space-y-3">
                  {CORE_APPS.map(({ id, label }) => (
                    <div key={id} className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-muted-foreground" />
                        <span className="text-sm font-medium">{label}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">{id}</Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">GTM Container ID</Label>
                          <Input
                            placeholder="GTM-XXXXXXX"
                            value={analytics.apps[id]?.gtmId || ""}
                            onChange={(e) => updApp(id, "gtmId", e.target.value)}
                            className="font-mono text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">GSC Verification (content= value)</Label>
                          <Input
                            placeholder="paste content= value here"
                            value={analytics.apps[id]?.gscVerification || ""}
                            onChange={(e) => updApp(id, "gscVerification", e.target.value)}
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* SaaS products — dynamic */}
                  {saasProducts.map(({ saasId, name }) => (
                    <div key={saasId} className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-muted-foreground" />
                        <span className="text-sm font-medium">{name}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">{saasId}</Badge>
                        <Badge variant="secondary" className="text-[10px]">SaaS Product</Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">GTM Container ID</Label>
                          <Input
                            placeholder="GTM-XXXXXXX"
                            value={analytics.apps[saasId]?.gtmId || ""}
                            onChange={(e) => updApp(saasId, "gtmId", e.target.value)}
                            className="font-mono text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">GSC Verification (content= value)</Label>
                          <Input
                            placeholder="paste content= value here"
                            value={analytics.apps[saasId]?.gscVerification || ""}
                            onChange={(e) => updApp(saasId, "gscVerification", e.target.value)}
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {saasProducts.length === 0 && (
                    <p className="text-xs text-muted-foreground px-1">No SaaS products yet. Add products in <a href="/saas-products" className="text-primary underline">SaaS Products</a> and they'll appear here automatically.</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Standalone tracking */}
              <div className="space-y-3">
                <p className="text-sm font-semibold">Standalone Tracking <span className="text-xs font-normal text-muted-foreground">(skip if managing via GTM)</span></p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">GA4 Measurement ID (Web)</Label>
                    <Input placeholder="G-XXXXXXXXXX" value={analytics.ga4IdWeb || ""} onChange={(e) => setAnalytics(p => ({ ...p, ga4IdWeb: e.target.value }))} className="font-mono text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Meta Pixel ID (Global)</Label>
                    <Input placeholder="123456789012345" value={analytics.metaPixelId || ""} onChange={(e) => setAnalytics(p => ({ ...p, metaPixelId: e.target.value }))} className="font-mono text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Hotjar Site ID</Label>
                    <Input placeholder="1234567" value={analytics.hotjarId || ""} onChange={(e) => setAnalytics(p => ({ ...p, hotjarId: e.target.value }))} className="font-mono text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Microsoft Clarity ID</Label>
                    <Input placeholder="xxxxxxxxxx" value={analytics.clarityId || ""} onChange={(e) => setAnalytics(p => ({ ...p, clarityId: e.target.value }))} className="font-mono text-sm" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Info box */}
              <div className="rounded-lg border border-violet-200 bg-violet-50 dark:border-violet-500/20 dark:bg-violet-500/10 p-4">
                <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 mb-2">How it works — no .env needed</p>
                <ol className="text-xs text-violet-700 dark:text-violet-400 space-y-1 list-decimal list-inside">
                  <li>GTM IDs are saved to the database here — no environment variables required</li>
                  <li>Each app calls <code className="bg-violet-100 dark:bg-violet-900 px-1 rounded">/admin/analytics/config/:appId</code> at runtime to get its GTM ID</li>
                  <li>Adding a new SaaS product in <strong>SaaS Products</strong> automatically adds it to this list</li>
                  <li>Change GTM IDs anytime without redeploying any app</li>
                </ol>
              </div>

              <SectionSave onSave={saveAnalytics} saving={savingAnalytics} label="Save Analytics Settings" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Referrals ────────────────────────────────────────────────── */}
        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift size={18} className="text-primary" />
                Referral Program Settings
              </CardTitle>
              <CardDescription>
                Configure the reward points and toggle the referral system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ToggleRow 
                label="Enable Referral Program" 
                desc="Allow users to generate and share referral codes, and earn points when new users sign up with them." 
                checked={refSettings.referralEnabled} 
                onChange={(v) => setRefSettings(p => ({ ...p, referralEnabled: v }))} 
              />
              <Separator />
              <div className="space-y-1.5 pt-2 max-w-sm">
                <Label>Reward Points per Referral</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    min="0"
                    value={refSettings.referralPointsValue} 
                    onChange={(e) => setRefSettings(p => ({ ...p, referralPointsValue: parseInt(e.target.value) || 0 }))} 
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Both the referrer and the new user will receive this many points.</p>
              </div>
              <SectionSave onSave={saveReferrals} saving={savingRef} label="Save Referral Settings" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
