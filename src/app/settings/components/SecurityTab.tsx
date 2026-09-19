"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    
    setChangingPwd(true);
    try {
      await api("/admin/settings/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-primary" />
          Admin Security
        </CardTitle>
        <CardDescription>
          Update your administrator credentials and security preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-md">
        <div className="space-y-1.5">
          <Label>Current Password</Label>
          <Input 
            type="password" 
            value={currentPassword} 
            onChange={(e) => setCurrentPassword(e.target.value)} 
          />
        </div>
        <div className="space-y-1.5">
          <Label>New Password</Label>
          <Input 
            type="password" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
          />
        </div>
        <div className="space-y-1.5">
          <Label>Confirm New Password</Label>
          <Input 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleChangePassword} 
          disabled={changingPwd || !currentPassword || !newPassword || !confirmPassword} 
          className="w-full sm:w-auto"
        >
          {changingPwd ? (
            <><Loader2 size={14} className="mr-2 animate-spin" />Updating Password...</>
          ) : (
            <><KeyRound size={14} className="mr-2" />Change Password</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
