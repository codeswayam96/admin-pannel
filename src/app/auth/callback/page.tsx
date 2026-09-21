"use client";

import { useSSOCallback } from "@codeswayam/auth";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const { status, error } = useSSOCallback();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6 bg-card border border-border p-8 rounded-3xl shadow-xl">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">
              Authenticating with CodeSwayam SSO...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold text-xl">
              ✓
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-green-600">
              Authentication Successful! Redirecting...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive font-black text-xl">
              !
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-destructive">
              Authentication Failed
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {error || "An unexpected error occurred during ticket exchange."}
            </p>
            <button
              onClick={() => (window.location.href = "/")}
              className="mt-2 px-6 py-3 bg-violet-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
