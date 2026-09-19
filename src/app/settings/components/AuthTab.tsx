"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Fingerprint, KeyRound, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AuthTab({ authSettings }: { authSettings: any }) {
  const currentAuthType = authSettings?.authType || "custom";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock size={18} className="text-primary" />
          Authentication Provider
        </CardTitle>
        <CardDescription>
          Select the authentication provider for your application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={cn(
            "relative p-4 rounded-xl border-2 transition-all cursor-pointer",
            currentAuthType === "custom" 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50"
          )}>
            {currentAuthType === "custom" && (
              <Badge className="absolute -top-3 -right-3 px-2 py-0.5 shadow-sm">Active</Badge>
            )}
            <Fingerprint className={cn("w-8 h-8 mb-3", currentAuthType === "custom" ? "text-primary" : "text-muted-foreground")} />
            <h3 className="font-semibold mb-1">Custom Auth (JWT)</h3>
            <p className="text-xs text-muted-foreground">Built-in authentication using JWT, PostgreSQL, and standard email/password flows.</p>
          </div>

          <div className="relative p-4 rounded-xl border-2 border-border/50 bg-muted/20 opacity-75 grayscale cursor-not-allowed">
            <Badge variant="outline" className="absolute -top-3 -right-3 bg-background">Coming Soon</Badge>
            <KeyRound className="w-8 h-8 mb-3 text-muted-foreground" />
            <h3 className="font-semibold mb-1 text-muted-foreground">Clerk Auth</h3>
            <p className="text-xs text-muted-foreground">Drop-in UI components and multi-session management.</p>
          </div>

          <div className="relative p-4 rounded-xl border-2 border-border/50 bg-muted/20 opacity-75 grayscale cursor-not-allowed">
            <Badge variant="outline" className="absolute -top-3 -right-3 bg-background">Coming Soon</Badge>
            <Smartphone className="w-8 h-8 mb-3 text-muted-foreground" />
            <h3 className="font-semibold mb-1 text-muted-foreground">NextAuth.js</h3>
            <p className="text-xs text-muted-foreground">Extensive OAuth provider support and social logins.</p>
          </div>
        </div>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mt-6">
          <p className="text-sm font-medium text-primary">Currently locked to Custom Auth.</p>
          <p className="text-xs text-muted-foreground mt-1">
            The platform is currently optimized for the built-in custom JWT authentication. 
            Third-party providers will be available in a future update.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
