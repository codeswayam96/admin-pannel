import * as React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-sm text-muted-foreground", className)}>
      <Link href="/" className="hover:text-foreground transition-colors">
        <Home size={14} />
      </Link>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <ChevronRight size={13} className="opacity-40 shrink-0" />
          {item.href && i < items.length - 1 ? (
            <Link href={item.href} className="hover:text-foreground transition-colors truncate max-w-[160px]">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium truncate max-w-[160px]">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
