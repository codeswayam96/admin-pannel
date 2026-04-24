import { z } from 'zod';

export const blogFormSchema = z.object({
  title: z
    .string()
    .min(5, { message: 'Title must be at least 5 characters long' })
    .max(200, { message: 'Title must not exceed 200 characters' }),

  slug: z
    .string()
    .min(3, { message: 'Slug must be at least 3 characters long' })
    .max(200, { message: 'Slug must not exceed 200 characters' })
    .regex(/^[a-z0-9-]+$/, {
      message: 'Slug can only contain lowercase letters, numbers, and hyphens',
    }),

  excerpt: z
    .string()
    .min(20, { message: 'Excerpt must be at least 20 characters long' })
    .max(500, { message: 'Excerpt must not exceed 500 characters' }),

  content: z
    .string()
    .min(50, { message: 'Content must be at least 50 characters long' }),

  coverImage: z
    .string()
    .url({ message: 'Cover image must be a valid URL' })
    .optional()
    .or(z.literal('')),

  category: z
    .string()
    .min(1, { message: 'Please select a category' }),

  tags: z
    .array(z.string())
    .min(1, { message: 'Please add at least one tag' })
    .max(10, { message: 'Maximum 10 tags allowed' }),

  status: z.enum(['draft', 'published', 'archived'], {
    required_error: 'Please select a status',
  }),

  featured: z.boolean().default(false),

  // SEO Fields
  metaTitle: z
    .string()
    .max(60, { message: 'Meta title must not exceed 60 characters' })
    .optional()
    .or(z.literal('')),

  metaDescription: z
    .string()
    .max(160, { message: 'Meta description must not exceed 160 characters' })
    .optional()
    .or(z.literal('')),

  ogImage: z
    .string()
    .url({ message: 'OG image must be a valid URL' })
    .optional()
    .or(z.literal('')),

  publishedAt: z.date().optional(),

  saasName: z
    .string()
    .min(1, { message: 'Please select a SaaS product' })
    .optional()
    .or(z.literal('')),
});

export type BlogFormData = z.infer<typeof blogFormSchema>;
