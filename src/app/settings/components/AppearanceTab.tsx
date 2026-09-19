"use client";

import { useState, useEffect } from "react";
import { Settings } from "./types";
import { SectionSave, ToggleRow } from "./SharedUI";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Paintbrush } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export function AppearanceTab({ baseline }: { baseline: Settings }) {
  const [s, setS] = useState<Settings>(baseline);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const fields: (keyof Settings)[] = [
      "theme", "accentColor", "postsPerPage", "showAuthorBio", "enableTableOfContents", "enableSocialShare"
    ];
    setIsDirty(fields.some(f => s[f] !== baseline[f]));
  }, [s, baseline]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          theme: s.theme,
          accentColor: s.accentColor,
          postsPerPage: s.postsPerPage,
          showAuthorBio: s.showAuthorBio,
          enableTableOfContents: s.enableTableOfContents,
          enableSocialShare: s.enableSocialShare
        }),
      });
      toast.success("Appearance settings saved successfully");
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
          <Paintbrush size={18} className="text-primary" />
          Appearance & UX
        </CardTitle>
        <CardDescription>
          Customize the look and feel of the front-end application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
          <div className="space-y-1.5">
            <Label>Default Theme</Label>
            <Select value={s.theme} onValueChange={(v) => setS(p => ({ ...p, theme: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System Default</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Brand Accent Color</Label>
            <div className="flex gap-2">
              <Input type="color" value={s.accentColor} onChange={(e) => setS(p => ({ ...p, accentColor: e.target.value }))} className="w-12 h-9 p-1" />
              <Input value={s.accentColor} onChange={(e) => setS(p => ({ ...p, accentColor: e.target.value }))} className="flex-1 font-mono uppercase" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Items per page</Label>
            <Input type="number" min="5" max="100" value={s.postsPerPage} onChange={(e) => setS(p => ({ ...p, postsPerPage: e.target.value }))} />
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <ToggleRow label="Show Author Bio" desc="Display author information at the bottom of blog posts." checked={s.showAuthorBio} onChange={(v) => setS(p => ({ ...p, showAuthorBio: v }))} />
          <Separator />
          <ToggleRow label="Enable Table of Contents" desc="Auto-generate a table of contents for long articles." checked={s.enableTableOfContents} onChange={(v) => setS(p => ({ ...p, enableTableOfContents: v }))} />
          <Separator />
          <ToggleRow label="Social Sharing Buttons" desc="Show Twitter, LinkedIn, and Facebook share buttons on content." checked={s.enableSocialShare} onChange={(v) => setS(p => ({ ...p, enableSocialShare: v }))} />
        </div>
        
        <SectionSave onSave={handleSave} saving={saving} disabled={!isDirty} label="Save Appearance Settings" />
      </CardContent>
    </Card>
  );
}
