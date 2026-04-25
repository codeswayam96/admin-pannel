'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  FileText,
  ShoppingBag,
  Settings,
  BarChart2,
  Tag,
  Image,
  MessageSquare,
  ChevronRight,
  Zap,
  LogOut,
  Menu,
  X,
  Command,
  CreditCard,
  Activity,
  Coins,
  Gift,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchProfile, logout } from '@/lib/api';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';

const navGroups = [
  {
    label: 'Main',
    items: [
      { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/analytics', icon: BarChart2, label: 'Analytics' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/blogs', icon: FileText, label: 'Blogs' },
      { href: '/categories', icon: Tag, label: 'Categories' },
      { href: '/media', icon: Image, label: 'Media' },
      { href: '/comments', icon: MessageSquare, label: 'Comments' },
    ],
  },
  {
    label: 'Business',
    items: [
      { href: '/saas-products', icon: ShoppingBag, label: 'SaaS Products' },
      { href: '/saas-products/analytics', icon: BarChart2, label: 'Product Analytics' },
      { href: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
      { href: '/credits', icon: Coins, label: 'Credits' },
      { href: '/rewards', icon: Gift, label: 'Rewards' },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/users', icon: Users, label: 'Users' },
      { href: '/approvals', icon: CheckCircle, label: 'Approvals' },
      { href: '/activity', icon: Activity, label: 'Activity Log' },
      { href: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export function MobileSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<{ name?: string; email?: string; role?: string } | null>(null);

  useEffect(() => {
    fetchProfile().then(setProfile).catch(() => {});
  }, []);

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const displayName = profile?.name || profile?.email?.split('@')[0] || 'Admin';
  const displayEmail = profile?.email || '';
  const initials = displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'A';

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-background border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="h-10 w-10"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-sm">CodeSwayam</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => {
              // Trigger command palette
              const event = new KeyboardEvent('keydown', {
                key: 'k',
                metaKey: true,
                bubbles: true,
              });
              document.dispatchEvent(event);
            }}
          >
            <Command className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Sidebar */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 flex flex-col"
              style={{
                background: 'hsl(var(--sidebar))',
                color: 'hsl(var(--sidebar-foreground))',
              }}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center shadow-lg">
                    <Zap size={16} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-base font-bold tracking-tight text-white">CodeSwayam</h1>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Admin Panel</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </Button>
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
                              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                              active
                                ? 'bg-violet-500/20 text-violet-300 shadow-sm'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            )}
                          >
                            <item.icon
                              size={18}
                              className={cn(
                                'flex-shrink-0 transition-colors',
                                active ? 'text-violet-400' : 'text-white/40 group-hover:text-white/70'
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
                  <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{displayName}</p>
                    <p className="text-xs text-white/40 truncate">{displayEmail}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-white/40 hover:text-white transition-colors"
                    title="Logout"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

    </>
  );
}
