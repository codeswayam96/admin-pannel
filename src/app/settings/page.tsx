"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchSettings, fetchReferralSettings, fetchAnalyticsSettings, fetchProducts, fetchAuthSettings } from "@/lib/api";
import { Loader2 } from "lucide-react";
import {
  GeneralTab,
  NotificationsTab,
  ModerationTab,
  AppearanceTab,
  SmtpTab,
  SecurityTab,
  AuthTab,
  ReferralsTab,
  AnalyticsTab,
  defaults,
  defaultAnalytics,
  Settings,
  AnalyticsConfig
} from "./components";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [authSettings, setAuthSettings] = useState<any>({});
  const [refSettings, setRefSettings] = useState<any>({ referralEnabled: true, referralPointsValue: 50 });
  const [analyticsSettings, setAnalyticsSettings] = useState<AnalyticsConfig>(defaultAnalytics);
  const [saasProducts, setSaasProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchSettings().catch(() => null),
      fetchAuthSettings().catch(() => null),
      fetchReferralSettings().catch(() => null),
      fetchAnalyticsSettings().catch(() => null),
      fetchProducts().catch(() => [])
    ]).then(([sData, authData, refData, analyticsData, productsData]) => {
      // Merge Settings
      if (sData) {
        const safeData: any = { ...sData };
        Object.keys(defaults).forEach(k => {
          const key = k as keyof Settings;
          if (safeData[key] === null || safeData[key] === undefined) {
            safeData[key] = defaults[key];
          }
        });
        setSettings({ ...safeData, smtpPass: "" }); // Never store actual password hash in state
      }

      // Merge Auth Settings
      if (authData) setAuthSettings(authData);

      // Merge Referral Settings
      if (refData) setRefSettings(refData);

      // Merge Analytics
      if (analyticsData) setAnalyticsSettings({ ...defaultAnalytics, ...analyticsData, apps: analyticsData.apps || {} });

      // Parse Products for Analytics
      if (productsData && Array.isArray(productsData)) {
        const seen = new Set<string>();
        const deduped: any[] = [];
        for (const p of productsData) {
          const familyKey = p.productFamily || p.saasId;
          if (!seen.has(familyKey)) {
            seen.add(familyKey);
            deduped.push({ id: p.id, slug: familyKey, name: p.tag || p.name });
          }
        }
        setSaasProducts(deduped);
      }
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your application's global configuration and integrations.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="smtp">Email & SMTP</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <GeneralTab baseline={settings} />
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <NotificationsTab baseline={settings} />
        </TabsContent>
        
        <TabsContent value="moderation" className="space-y-4">
          <ModerationTab baseline={settings} />
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4">
          <AppearanceTab baseline={settings} />
        </TabsContent>
        
        <TabsContent value="smtp" className="space-y-4">
          <SmtpTab baseline={settings} />
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          <AuthTab authSettings={authSettings} />
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <ReferralsTab baselineRefSettings={refSettings} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsTab baselineAnalytics={analyticsSettings} saasProducts={saasProducts} />
        </TabsContent>

      </Tabs>
    </div>
  );
}
