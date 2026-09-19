"use client";

import { useState, useEffect } from "react";
import { Settings } from "./types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionSave } from "./SharedUI";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function GeneralTab({ baseline }: { baseline: Settings }) {
  const [s, setS] = useState<Settings>(baseline);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check if any fields changed compared to baseline
    const fields: (keyof Settings)[] = [
      "siteName", "siteUrl", "siteDescription", "adminEmail", "tagline", "language", "timezone"
    ];
    const changed = fields.some(f => s[f] !== baseline[f]);
    setIsDirty(changed);
    
    // Basic validation
    const newErrors: Record<string, string> = {};
    if (s.siteUrl && !/^https?:\/\//.test(s.siteUrl)) {
      newErrors.siteUrl = "URL must start with http:// or https://";
    }
    setErrors(newErrors);
  }, [s, baseline]);

  const handleSave = async () => {
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the validation errors before saving.");
      return;
    }
    setSaving(true);
    try {
      await api("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          siteName: s.siteName,
          siteUrl: s.siteUrl,
          siteDescription: s.siteDescription,
          adminEmail: s.adminEmail,
          tagline: s.tagline,
          language: s.language,
          timezone: s.timezone
        }),
      });
      toast.success("General settings saved successfully");
      setIsDirty(false); // Can safely assume backend persisted this
    } catch (error: any) {
      toast.error(error.message || "Failed to save general settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon size={18} className="text-primary" />
          General Settings
        </CardTitle>
        <CardDescription>
          Configure the core identity and basic details of your application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Site Name</Label>
            <Input value={s.siteName} onChange={(e) => setS(p => ({ ...p, siteName: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Site URL</Label>
            <Input value={s.siteUrl} onChange={(e) => setS(p => ({ ...p, siteUrl: e.target.value }))} />
            {errors.siteUrl && <p className="text-xs text-red-500">{errors.siteUrl}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Tagline</Label>
            <Input value={s.tagline} onChange={(e) => setS(p => ({ ...p, tagline: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Admin Contact Email</Label>
            <Input type="email" value={s.adminEmail} onChange={(e) => setS(p => ({ ...p, adminEmail: e.target.value }))} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Site Description</Label>
          <Textarea 
            value={s.siteDescription} 
            onChange={(e) => setS(p => ({ ...p, siteDescription: e.target.value }))}
            rows={3} 
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Language</Label>
            <Input value={s.language} onChange={(e) => setS(p => ({ ...p, language: e.target.value }))} placeholder="e.g. en" />
          </div>
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Input value={s.timezone} onChange={(e) => setS(p => ({ ...p, timezone: e.target.value }))} placeholder="e.g. Asia/Kolkata" />
          </div>
        </div>

        <SectionSave onSave={handleSave} saving={saving} disabled={!isDirty} label="Save General Settings" />
      </CardContent>
    </Card>
  );
}
