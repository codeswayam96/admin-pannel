import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";

export function SectionSave({ 
  onSave, 
  saving, 
  disabled = false,
  label = "Save Changes" 
}: { 
  onSave: () => void; 
  saving: boolean; 
  disabled?: boolean;
  label?: string 
}) {
  return (
    <div className="flex justify-end pt-2">
      <Button onClick={onSave} disabled={saving || disabled} className="min-w-28">
        {saving ? (
          <><Loader2 size={14} className="mr-2 animate-spin" />Saving...</>
        ) : (
          <><Save size={14} className="mr-2" />{label}</>
        )}
      </Button>
    </div>
  );
}

export function ToggleRow({ 
  label, 
  desc, 
  checked, 
  onChange 
}: { 
  label: string; 
  desc: string; 
  checked: boolean; 
  onChange: (v: boolean) => void 
}) {
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
