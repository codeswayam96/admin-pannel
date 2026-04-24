'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FileText,
  Users,
  Package,
  Image,
  MessageSquare,
  Tag,
  BarChart2,
  Search,
  Plus,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type EmptyStateVariant =
  | 'blogs'
  | 'users'
  | 'products'
  | 'media'
  | 'comments'
  | 'categories'
  | 'analytics'
  | 'search'
  | 'default';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  showIcon?: boolean;
}

const variants: Record<
  EmptyStateVariant,
  {
    icon: typeof FileText;
    title: string;
    description: string;
    actionLabel: string;
    actionHref: string;
    color: string;
  }
> = {
  blogs: {
    icon: FileText,
    title: 'No Blog Posts Yet',
    description: 'Start sharing your knowledge with the world. Create your first blog post now.',
    actionLabel: 'Create Blog Post',
    actionHref: '/blogs/create',
    color: 'text-blue-500',
  },
  users: {
    icon: Users,
    title: 'No Users Found',
    description: 'Users will appear here once they sign up or are invited to the platform.',
    actionLabel: 'Invite User',
    actionHref: '/users/invite',
    color: 'text-green-500',
  },
  products: {
    icon: Package,
    title: 'No Products Yet',
    description: 'Add your first SaaS product to showcase your offerings.',
    actionLabel: 'Add Product',
    actionHref: '/saas-products/create',
    color: 'text-purple-500',
  },
  media: {
    icon: Image,
    title: 'No Media Files',
    description: 'Upload images/videos/files to use in your content.',
    actionLabel: 'Upload Media',
    actionHref: '/media/upload',
    color: 'text-pink-500',
  },
  comments: {
    icon: MessageSquare,
    title: 'No Comments Yet',
    description: 'Comments from your readers will appear here.',
    actionLabel: 'View Blog Posts',
    actionHref: '/blogs',
    color: 'text-amber-500',
  },
  categories: {
    icon: Tag,
    title: 'No Categories',
    description: 'Create categories to organize your content better.',
    actionLabel: 'Create Category',
    actionHref: '/categories/create',
    color: 'text-cyan-500',
  },
  analytics: {
    icon: BarChart2,
    title: 'No Analytics Data',
    description: 'Analytics will appear once you have more traffic and engagement.',
    actionLabel: 'View Dashboard',
    actionHref: '/',
    color: 'text-indigo-500',
  },
  search: {
    icon: Search,
    title: 'No Results Found',
    description: 'Try adjusting your search or filter criteria.',
    actionLabel: 'Clear Filters',
    actionHref: '',
    color: 'text-slate-500',
  },
  default: {
    icon: FolderOpen,
    title: 'Nothing Here Yet',
    description: 'This section is empty. Add some content to get started.',
    actionLabel: 'Get Started',
    actionHref: '',
    color: 'text-slate-500',
  },
};

export function EmptyState({
  variant = 'default',
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  showIcon = true,
}: EmptyStateProps) {
  const config = variants[variant];
  const Icon = config.icon;

  const finalTitle = title || config.title;
  const finalDescription = description || config.description;
  const finalActionLabel = actionLabel || config.actionLabel;
  const finalActionHref = actionHref || config.actionHref;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {showIcon && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className={`mb-6 rounded-full bg-muted p-6 ${config.color}`}
        >
          <Icon className="h-12 w-12" />
        </motion.div>
      )}

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold text-foreground mb-2"
      >
        {finalTitle}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground max-w-md mb-8"
      >
        {finalDescription}
      </motion.p>

      {(finalActionHref || onAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {onAction ? (
            <Button onClick={onAction} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              {finalActionLabel}
            </Button>
          ) : finalActionHref ? (
            <Button asChild size="lg">
              <Link href={finalActionHref}>
                <Plus className="mr-2 h-4 w-4" />
                {finalActionLabel}
              </Link>
            </Button>
          ) : null}
        </motion.div>
      )}

      {/* Decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </div>
    </motion.div>
  );
}
