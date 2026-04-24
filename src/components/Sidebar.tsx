"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FileText, ShoppingBag, Settings,
  BarChart2, Tag, Image, MessageSquare, ChevronRight, Zap, LogOut,
  CreditCard, Activity, Coins, Gift, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchProfile, logout } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";

const navGroups = [
  {
    label: "Main",
    items: [
      { href: "/", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/analytics", icon: BarChart2, label: "Analytics" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/blogs", icon: FileText, label: "Blogs" },
      { href: "/categories", icon: Tag, label: "Categories" },
      { href: "/media", icon: Image, label: "Media" },
      { href: "/comments", icon: MessageSquare, label: "Comments" },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/saas-products", icon: ShoppingBag, label: "SaaS Products" },
      { href: "/saas-products/analytics", icon: BarChart2, label: "Product Analytics" },
      { href: "/subscriptions", icon: CreditCard, label: "Subscriptions" },
      { href: "/credits", icon: Coins, label: "Credits" },
      { href: "/rewards", icon: Gift, label: "Rewards" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/users", icon: Users, label: "Users" },
      { href: "/approvals", icon: CheckCircle, label: "Approvals" },
      { href: "/activity", icon: Activity, label: "Activity Log" },
      { href: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<{ name?: string; email?: string; role?: string } | null>(null);

  useEffect(() => {
    fetchProfile().then(setProfile).catch(() => {});
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const displayName = profile?.name || profile?.email?.split("@")[0] || "Admin";
  const displayEmail = profile?.email || "";
  const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "A";

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className="w-64 min-h-screen flex flex-col sticky top-0" style={{ background: "hsl(var(--sidebar))", color: "hsl(var(--sidebar-foreground))" }}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center shadow-lg">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white">CodeSwayam</h1>
          <p className="text-[10px] text-white/40 uppercase tracking-widest">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-semibold px-2 mb-2">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group",
                      active
                        ? "bg-violet-500/20 text-violet-300 shadow-sm"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <item.icon
                      size={18}
                      className={cn(
                        "shrink-0 transition-colors",
                        active ? "text-violet-400" : "text-white/40 group-hover:text-white/70"
                      )}
                    />
                    <span className="flex-1">{item.label}</span>
                    {active && <ChevronRight size={14} className="text-violet-400" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10 space-y-3">
        {/* Theme Toggle Row */}
        <div className="flex items-center justify-between px-3">
          <span className="text-xs text-white/60">Theme</span>
          <ThemeToggle />
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
          <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            <p className="text-xs text-white/40 truncate">{displayEmail}</p>
          </div>
          <button onClick={handleLogout} className="text-white/40 hover:text-white transition-colors" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
