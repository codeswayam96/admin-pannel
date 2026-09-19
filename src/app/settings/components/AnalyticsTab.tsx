"use client";

import { useState, useEffect } from "react";
import { AnalyticsConfig } from "./types";
import { SectionSave } from "./SharedUI";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Activity } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export function AnalyticsTab({ 
  baselineAnalytics, 
  saasProducts 
}: { 
  baselineAnalytics: AnalyticsConfig;
  saasProducts: any[];
}) {
  const [analytics, setAnalytics] = useState<AnalyticsConfig>(baselineAnalytics);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const changed = JSON.stringify(analytics) !== JSON.stringify(baselineAnalytics);
    setIsDirty(changed);
  }, [analytics, baselineAnalytics]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api("/admin/analytics/settings", {
        method: "PATCH",
        body: JSON.stringify(analytics),
      });
      toast.success("Analytics settings saved successfully");
      setIsDirty(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save analytics settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity size={18} className="text-primary" />
          Analytics & Tracking
        </CardTitle>
        <CardDescription>
          Configure tracking IDs for various analytics providers across your SaaS products.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* App-specific GTM settings */}
        <div className="space-y-3">
          <p className="text-sm font-semibold">Google Tag Manager (GTM) per App</p>
          <div className="rounded-md border divide-y overflow-hidden">
            <div className="bg-muted/50 p-3 grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
              <div className="col-span-3">App ID</div>
              <div className="col-span-9">GTM Container ID</div>
            </div>
            {saasProducts.map(p => (
              <div key={p.id} className="p-3 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-3 text-sm font-medium">{p.slug}</div>
                <div className="col-span-9 flex flex-col gap-1.5">
                  <Input
                    placeholder="GTM-XXXXXXX"
                    value={analytics.apps?.[p.slug]?.gtmId || ""}
                    onChange={(e) => {
                      setAnalytics(prev => ({
                        ...prev,
                        apps: {
                          ...prev.apps,
                          [p.slug]: {
                            ...prev.apps?.[p.slug],
                            gtmId: e.target.value,
                            label: p.name
                          }
                        }
                      }));
                    }}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            ))}
            {saasProducts.length === 0 && (
              <p className="text-xs text-muted-foreground p-4">
                No SaaS products yet. Add products in <a href="/saas-products" className="text-primary underline">SaaS Products</a> and they'll appear here automatically.
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Standalone tracking */}
        <div className="space-y-3">
          <p className="text-sm font-semibold">Standalone Tracking <span className="text-xs font-normal text-muted-foreground">(skip if managing via GTM)</span></p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">GA4 Measurement ID (Web)</Label>
              <Input 
                placeholder="G-XXXXXXXXXX" 
                value={analytics.ga4IdWeb || ""} 
                onChange={(e) => setAnalytics(prev => ({ ...prev, ga4IdWeb: e.target.value }))} 
                className="font-mono text-sm" 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Meta Pixel ID (Global)</Label>
              <Input 
                placeholder="123456789012345" 
                value={analytics.metaPixelId || ""} 
                onChange={(e) => setAnalytics(prev => ({ ...prev, metaPixelId: e.target.value }))} 
                className="font-mono text-sm" 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hotjar Site ID</Label>
              <Input 
                placeholder="1234567" 
                value={analytics.hotjarId || ""} 
                onChange={(e) => setAnalytics(prev => ({ ...prev, hotjarId: e.target.value }))} 
                className="font-mono text-sm" 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Microsoft Clarity ID</Label>
              <Input 
                placeholder="xxxxxxxxxx" 
                value={analytics.clarityId || ""} 
                onChange={(e) => setAnalytics(prev => ({ ...prev, clarityId: e.target.value }))} 
                className="font-mono text-sm" 
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="rounded-lg border border-violet-200 bg-violet-50 dark:border-violet-500/20 dark:bg-violet-500/10 p-4">
          <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 mb-2">How it works — no .env needed</p>
          <ol className="text-xs text-violet-700 dark:text-violet-400 space-y-1 list-decimal list-inside">
            <li>GTM IDs are saved to the database here — no environment variables required</li>
            <li>Each app calls <code className="bg-violet-100 dark:bg-violet-900 px-1 rounded">/admin/analytics/config/:appId</code> at runtime to get its GTM ID</li>
            <li>Adding a new SaaS product in <strong>SaaS Products</strong> automatically adds it to this list</li>
            <li>Change GTM IDs anytime without redeploying any app</li>
          </ol>
        </div>

        <SectionSave onSave={handleSave} saving={saving} disabled={!isDirty} label="Save Analytics Settings" />
      </CardContent>
    </Card>
  );
}
