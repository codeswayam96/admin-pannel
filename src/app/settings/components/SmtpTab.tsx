"use client";

import { useState, useEffect } from "react";
import { Settings } from "./types";
import { SectionSave } from "./SharedUI";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Mail, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function SmtpTab({ baseline }: { baseline: Settings }) {
  const [s, setS] = useState<Settings>(baseline);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  // Test SMTP state
  const [testEmail, setTestEmail] = useState("");
  const [testingSmtp, setTestingSmtp] = useState(false);

  useEffect(() => {
    const fields: (keyof Settings)[] = [
      "smtpHost", "smtpPort", "smtpUser", "smtpPass", "smtpFromEmail", "smtpFromName"
    ];
    setIsDirty(fields.some(f => s[f] !== baseline[f]));
  }, [s, baseline]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Only send the password if it was actually modified
      const payload: Partial<Settings> = {
        smtpHost: s.smtpHost,
        smtpPort: s.smtpPort,
        smtpUser: s.smtpUser,
        smtpFromEmail: s.smtpFromEmail,
        smtpFromName: s.smtpFromName
      };
      
      if (s.smtpPass && s.smtpPass !== "") {
        payload.smtpPass = s.smtpPass;
      }
      
      await api("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      toast.success("SMTP configuration saved successfully");
      setIsDirty(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save SMTP settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }
    setTestingSmtp(true);
    try {
      await api("/admin/settings/test-smtp", {
        method: "POST",
        body: JSON.stringify({ to: testEmail }),
      });
      toast.success(`Test email sent to ${testEmail}! Check your inbox.`);
      setTestEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send test email");
    } finally {
      setTestingSmtp(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail size={18} className="text-primary" />
            Email & SMTP Settings
          </CardTitle>
          <CardDescription>
            Configure your mail server for sending transactional emails and newsletters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>SMTP Host</Label>
              <Input placeholder="smtp.mailgun.org" value={s.smtpHost} onChange={(e) => setS(p => ({ ...p, smtpHost: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>SMTP Port</Label>
              <Input type="number" placeholder="587" value={s.smtpPort} onChange={(e) => setS(p => ({ ...p, smtpPort: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>SMTP Username</Label>
              <Input placeholder="postmaster@yourdomain.com" value={s.smtpUser} onChange={(e) => setS(p => ({ ...p, smtpUser: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>SMTP Password</Label>
              <Input type="password" placeholder="••••••••••••••••" value={s.smtpPass} onChange={(e) => setS(p => ({ ...p, smtpPass: e.target.value }))} />
              <p className="text-xs text-muted-foreground mt-1">Leave blank to keep existing password.</p>
            </div>
            <div className="space-y-1.5">
              <Label>From Email Address</Label>
              <Input type="email" placeholder="noreply@codeswayam.com" value={s.smtpFromEmail} onChange={(e) => setS(p => ({ ...p, smtpFromEmail: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>From Name</Label>
              <Input placeholder="CodeSwayam" value={s.smtpFromName} onChange={(e) => setS(p => ({ ...p, smtpFromName: e.target.value }))} />
            </div>
          </div>

          <SectionSave onSave={handleSave} saving={saving} disabled={!isDirty} label="Save SMTP Configuration" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Test Configuration</CardTitle>
          <CardDescription>Send a test email to verify your SMTP settings are working correctly.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 max-w-sm">
            <Input 
              type="email" 
              placeholder="admin@example.com" 
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTestSmtp()}
            />
            <Button onClick={handleTestSmtp} disabled={testingSmtp || !testEmail} variant="secondary">
              {testingSmtp ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
