"use client";

import { useState, useEffect } from "react";
import { Settings } from "./types";
import { SectionSave, ToggleRow } from "./SharedUI";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export function NotificationsTab({ baseline }: { baseline: Settings }) {
  const [s, setS] = useState<Settings>(baseline);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const fields: (keyof Settings)[] = [
      "notifyNewUser", "notifyNewComment", "notifyNewSubscription", 
      "notifyWeeklyReport", "notifySecurityAlerts", 
      "notifyProductUpdates", "notifyMarketingEmails"
    ];
    setIsDirty(fields.some(f => s[f] !== baseline[f]));
  }, [s, baseline]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          notifyNewUser: s.notifyNewUser,
          notifyNewComment: s.notifyNewComment,
          notifyNewSubscription: s.notifyNewSubscription,
          notifyWeeklyReport: s.notifyWeeklyReport,
          notifySecurityAlerts: s.notifySecurityAlerts,
          notifyProductUpdates: s.notifyProductUpdates,
          notifyMarketingEmails: s.notifyMarketingEmails
        }),
      });
      toast.success("Notification settings saved successfully");
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
          <Bell size={18} className="text-primary" />
          Email Notifications
        </CardTitle>
        <CardDescription>
          Control which administrative alerts are sent to the Admin Contact Email.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <ToggleRow label="New User Registration" desc="Receive an email when a new user signs up." checked={s.notifyNewUser} onChange={(v) => setS(p => ({ ...p, notifyNewUser: v }))} />
        <Separator />
        <ToggleRow label="New Subscription" desc="Receive an email when a user purchases a subscription or bundle." checked={s.notifyNewSubscription} onChange={(v) => setS(p => ({ ...p, notifyNewSubscription: v }))} />
        <Separator />
        <ToggleRow label="New Comments" desc="Receive an email when a new comment is posted." checked={s.notifyNewComment} onChange={(v) => setS(p => ({ ...p, notifyNewComment: v }))} />
        <Separator />
        <ToggleRow label="Security Alerts" desc="Receive critical security alerts and audit notifications." checked={s.notifySecurityAlerts} onChange={(v) => setS(p => ({ ...p, notifySecurityAlerts: v }))} />
        <Separator />
        <ToggleRow label="Weekly Reports" desc="Receive a weekly summary of platform activity and revenue." checked={s.notifyWeeklyReport} onChange={(v) => setS(p => ({ ...p, notifyWeeklyReport: v }))} />
        
        <SectionSave onSave={handleSave} saving={saving} disabled={!isDirty} label="Save Notification Settings" />
      </CardContent>
    </Card>
  );
}
