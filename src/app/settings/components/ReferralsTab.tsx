"use client";

import { useState, useEffect } from "react";
import { SectionSave, ToggleRow } from "./SharedUI";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Gift } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export function ReferralsTab({ baselineRefSettings }: { baselineRefSettings: any }) {
  const [refSettings, setRefSettings] = useState({
    referralEnabled: true,
    referralPointsValue: 50,
    ...baselineRefSettings
  });
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const changed = 
      refSettings.referralEnabled !== baselineRefSettings.referralEnabled ||
      refSettings.referralPointsValue !== baselineRefSettings.referralPointsValue;
    setIsDirty(changed);
  }, [refSettings, baselineRefSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api("/admin/referrals/settings", {
        method: "PATCH",
        body: JSON.stringify({
          referralEnabled: refSettings.referralEnabled,
          referralPointsValue: refSettings.referralPointsValue
        }),
      });
      toast.success("Referral settings saved successfully");
      setIsDirty(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save referral settings");
    } finally {
      setSaving(false);
    }
  };

  return (
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
          onChange={(v) => setRefSettings((p: any) => ({ ...p, referralEnabled: v }))} 
        />
        <Separator />
        <div className="space-y-1.5 pt-2 max-w-sm">
          <Label>Reward Points per Referral</Label>
          <div className="flex gap-2">
            <Input 
              type="number" 
              min="0"
              value={refSettings.referralPointsValue} 
              onChange={(e) => setRefSettings((p: any) => ({ ...p, referralPointsValue: parseInt(e.target.value) || 0 }))} 
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Both the referrer and the new user will receive this many points.</p>
        </div>
        
        <SectionSave onSave={handleSave} saving={saving} disabled={!isDirty} label="Save Referral Settings" />
      </CardContent>
    </Card>
  );
}
