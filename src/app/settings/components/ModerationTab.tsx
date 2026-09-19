"use client";

import { useState, useEffect } from "react";
import { Settings } from "./types";
import { SectionSave, ToggleRow } from "./SharedUI";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export function ModerationTab({ baseline }: { baseline: Settings }) {
  const [s, setS] = useState<Settings>(baseline);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const fields: (keyof Settings)[] = [
      "autoApproveComments", "requireEmailVerification", "enableSpamFilter", "maxLoginAttempts"
    ];
    setIsDirty(fields.some(f => s[f] !== baseline[f]));
  }, [s, baseline]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          autoApproveComments: s.autoApproveComments,
          requireEmailVerification: s.requireEmailVerification,
          enableSpamFilter: s.enableSpamFilter,
          maxLoginAttempts: parseInt(s.maxLoginAttempts, 10) || 5
        }),
      });
      toast.success("Moderation settings saved successfully");
      setIsDirty(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-primary" />
          Moderation & Security
        </CardTitle>
        <CardDescription>
          Configure user restrictions and automated moderation features.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ToggleRow label="Require Email Verification" desc="New users must verify their email before accessing the platform." checked={s.requireEmailVerification} onChange={(v) => setS(p => ({ ...p, requireEmailVerification: v }))} />
        <Separator />
        <ToggleRow label="Auto-Approve Comments" desc="Publish comments immediately without manual admin approval." checked={s.autoApproveComments} onChange={(v) => setS(p => ({ ...p, autoApproveComments: v }))} />
        <Separator />
        <ToggleRow label="Enable Spam Filter" desc="Automatically flag potential spam comments for review." checked={s.enableSpamFilter} onChange={(v) => setS(p => ({ ...p, enableSpamFilter: v }))} />
        <Separator />
        <div className="space-y-1.5 pt-2">
          <Label>Max Login Attempts</Label>
          <Input 
            type="number" 
            min="1"
            value={s.maxLoginAttempts} 
            onChange={(e) => setS(p => ({ ...p, maxLoginAttempts: e.target.value }))} 
            className="max-w-[200px]"
          />
          <p className="text-xs text-muted-foreground mt-1">Number of failed attempts before account is temporarily locked.</p>
        </div>
        
        <SectionSave onSave={handleSave} saving={saving} disabled={!isDirty} label="Save Moderation Settings" />
      </CardContent>
    </Card>
  );
}
