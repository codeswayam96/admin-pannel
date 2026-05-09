'use client';

import { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Settings,
  BarChart2,
  Tag,
  Image,
  MessageSquare,
  Plus,
  Moon,
  Sun,
  LogOut,
  Webhook,
  Key,
  ToggleLeft,
  HeartPulse,
  Bell,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  href?: string;
  icon: typeof LayoutDashboard;
  keywords?: string[];
  action?: () => void;
  shortcut?: string;
  group: 'navigation' | 'actions' | 'settings';
}

export function AdminCommandPalette() {
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const COMMAND_ITEMS: CommandItem[] = [
    // Navigation
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Go to main dashboard',
      href: '/',
      icon: LayoutDashboard,
      keywords: ['home', 'dashboard', 'main'],
      shortcut: '⌘1',
      group: 'navigation',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      description: 'View analytics and reports',
      href: '/analytics',
      icon: BarChart2,
      keywords: ['analytics', 'stats', 'reports'],
      shortcut: '⌘2',
      group: 'navigation',
    },
    {
      id: 'blogs',
      label: 'Blogs',
      description: 'Manage blog posts',
      href: '/blogs',
      icon: FileText,
      keywords: ['blogs', 'posts', 'articles'],
      shortcut: '⌘3',
      group: 'navigation',
    },
    {
      id: 'users',
      label: 'Users',
      description: 'Manage users',
      href: '/users',
      icon: Users,
      keywords: ['users', 'members', 'accounts'],
      shortcut: '⌘4',
      group: 'navigation',
    },
    {
      id: 'products',
      label: 'SaaS Products',
      description: 'Manage products',
      href: '/saas-products',
      icon: Package,
      keywords: ['products', 'saas', 'apps'],
      shortcut: '⌘5',
      group: 'navigation',
    },
    {
      id: 'categories',
      label: 'Categories',
      description: 'Manage categories',
      href: '/categories',
      icon: Tag,
      keywords: ['categories', 'tags'],
      group: 'navigation',
    },
    {
      id: 'media',
      label: 'Media Library',
      description: 'Manage media files',
      href: '/media',
      icon: Image,
      keywords: ['media', 'images', 'files'],
      group: 'navigation',
    },
    {
      id: 'comments',
      label: 'Comments',
      description: 'Manage comments',
      href: '/comments',
      icon: MessageSquare,
      keywords: ['comments', 'feedback'],
      group: 'navigation',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      description: 'Push notification campaigns',
      href: '/notifications',
      icon: Bell,
      keywords: ['notifications', 'push', 'campaigns'],
      group: 'navigation',
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'System settings',
      href: '/settings',
      icon: Settings,
      keywords: ['settings', 'config'],
      shortcut: '⌘,',
      group: 'navigation',
    },
    {
      id: 'feature-flags',
      label: 'Feature Flags',
      description: 'Toggle features without redeploying',
      href: '/feature-flags',
      icon: ToggleLeft,
      keywords: ['feature', 'flags', 'toggle', 'rollout'],
      group: 'navigation',
    },
    {
      id: 'webhooks',
      label: 'Webhooks',
      description: 'Manage outgoing webhook endpoints',
      href: '/webhooks',
      icon: Webhook,
      keywords: ['webhooks', 'integrations', 'events'],
      group: 'navigation',
    },
    {
      id: 'api-keys',
      label: 'API Keys',
      description: 'Issue and revoke API keys',
      href: '/api-keys',
      icon: Key,
      keywords: ['api', 'keys', 'tokens', 'integrations'],
      group: 'navigation',
    },
    {
      id: 'health',
      label: 'System Health',
      description: 'Monitor services and queues',
      href: '/health',
      icon: HeartPulse,
      keywords: ['health', 'status', 'monitoring', 'uptime'],
      group: 'navigation',
    },

    // Quick Actions
    {
      id: 'new-blog',
      label: 'New Blog Post',
      description: 'Create a new blog post',
      href: '/blogs/create',
      icon: Plus,
      keywords: ['new', 'create', 'blog', 'post'],
      shortcut: '⌘N',
      group: 'actions',
    },
    {
      id: 'new-product',
      label: 'New Product',
      description: 'Add a new product',
      href: '/saas-products/create',
      icon: Plus,
      keywords: ['new', 'create', 'product'],
      group: 'actions',
    },

    // Settings
    {
      id: 'toggle-theme',
      label: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
      description: 'Toggle theme',
      icon: theme === 'dark' ? Sun : Moon,
      keywords: ['theme', 'dark', 'light', 'mode'],
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      group: 'settings',
    },
    {
      id: 'logout',
      label: 'Logout',
      description: 'Sign out of your account',
      icon: LogOut,
      keywords: ['logout', 'sign out', 'exit'],
      action: () => {
        // TODO: Implement logout
        router.push('/login');
      },
      group: 'settings',
    },
  ];

  // Keyboard shortcut to open (Cmd/Ctrl + K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Filter items based on search
  const filteredItems = COMMAND_ITEMS.filter((item) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.label.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.keywords?.some((k) => k.toLowerCase().includes(searchLower))
    );
  });

  const handleSelect = useCallback(
    (item: CommandItem) => {
      if (item.action) {
        item.action();
      } else if (item.href) {
        router.push(item.href);
      }
      setOpen(false);
      setSearch('');
    },
    [router]
  );

  const groupedItems = {
    navigation: filteredItems.filter((i) => i.group === 'navigation'),
    actions: filteredItems.filter((i) => i.group === 'actions'),
    settings: filteredItems.filter((i) => i.group === 'settings'),
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 overflow-hidden max-w-2xl">
        <Command className="rounded-lg border-0 shadow-lg">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Search commands, pages, actions..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              value={search}
              onValueChange={setSearch}
            />
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            {filteredItems.length === 0 && (
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No results found for "{search}"
              </Command.Empty>
            )}

            {groupedItems.navigation.length > 0 && (
              <Command.Group heading="Navigation" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
                {groupedItems.navigation.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.label}
                    onSelect={() => handleSelect(item)}
                    className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2.5 text-sm outline-none aria-selected:bg-primary/10 aria-selected:text-primary hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <item.icon className="mr-3 h-4 w-4 shrink-0 opacity-70" />
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      )}
                    </div>
                    {item.shortcut && (
                      <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                        {item.shortcut}
                      </kbd>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {groupedItems.actions.length > 0 && (
              <Command.Group heading="Quick Actions" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
                {groupedItems.actions.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.label}
                    onSelect={() => handleSelect(item)}
                    className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2.5 text-sm outline-none aria-selected:bg-primary/10 aria-selected:text-primary hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <item.icon className="mr-3 h-4 w-4 shrink-0 opacity-70" />
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      )}
                    </div>
                    {item.shortcut && (
                      <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                        {item.shortcut}
                      </kbd>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {groupedItems.settings.length > 0 && (
              <Command.Group heading="Settings" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
                {groupedItems.settings.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.label}
                    onSelect={() => handleSelect(item)}
                    className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2.5 text-sm outline-none aria-selected:bg-primary/10 aria-selected:text-primary hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <item.icon className="mr-3 h-4 w-4 shrink-0 opacity-70" />
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                ↑↓
              </kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                ↵
              </kbd>
              <span>Select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                ⌘K
              </kbd>
              <span>Toggle</span>
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
