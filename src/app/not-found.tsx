"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center mb-6">
        <FileQuestion size={36} className="text-violet-600 dark:text-violet-400" />
      </div>
      <h1 className="text-4xl font-black tracking-tight mb-2">404</h1>
      <p className="text-xl font-semibold text-foreground mb-2">Page Not Found</p>
      <p className="text-muted-foreground max-w-sm mb-8 text-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft size={16} /> Go Back
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
