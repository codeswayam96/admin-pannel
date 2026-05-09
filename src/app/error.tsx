"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service in production
    if (process.env.NODE_ENV === "production") {
      // e.g. Sentry.captureException(error);
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-6">
        <AlertTriangle size={36} className="text-red-600 dark:text-red-400" />
      </div>
      <h1 className="text-2xl font-black tracking-tight mb-2">Something went wrong</h1>
      <p className="text-muted-foreground max-w-sm mb-2 text-sm">
        An unexpected error occurred. Our team has been notified.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground/60 font-mono mb-6">
          Error ID: {error.digest}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button onClick={reset} variant="outline">
          <RefreshCw size={16} /> Try Again
        </Button>
        <Button asChild>
          <Link href="/">
            <Home size={16} /> Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
