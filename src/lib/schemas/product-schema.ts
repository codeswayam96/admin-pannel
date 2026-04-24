import { z } from 'zod';

export const productFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Product name must be at least 2 characters long' })
    .max(100, { message: 'Product name must not exceed 100 characters' }),

  slug: z
    .string()
    .min(2, { message: 'Slug must be at least 2 characters long' })
    .max(100, { message: 'Slug must not exceed 100 characters' })
    .regex(/^[a-z0-9-]+$/, {
      message: 'Slug can only contain lowercase letters, numbers, and hyphens',
    }),

  description: z
    .string()
    .min(20, { message: 'Description must be at least 20 characters long' })
    .max(500, { message: 'Description must not exceed 500 characters' }),

  longDescription: z
    .string()
    .min(50, { message: 'Long description must be at least 50 characters long' })
    .max(5000, { message: 'Long description must not exceed 5000 characters' })
    .optional()
    .or(z.literal('')),

  logo: z
    .string()
    .url({ message: 'Logo must be a valid URL' })
    .optional()
    .or(z.literal('')),

  icon: z
    .string()
    .min(1, { message: 'Please select an icon' }),

  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
      message: 'Color must be a valid hex color code',
    })
    .default('#06B6D4'),

  status: z.enum(['active', 'beta', 'coming-soon', 'deprecated'], {
    required_error: 'Please select a status',
  }),

  featured: z.boolean().default(false),

  pricing: z.object({
    free: z.boolean().default(false),
    startingPrice: z
      .number()
      .min(0, { message: 'Price must be a positive number' })
      .optional(),
    currency: z.string().default('USD'),
    billingPeriod: z
      .enum(['month', 'year', 'one-time'])
      .default('month')
      .optional(),
  }),

  features: z
    .array(z.string().min(1, { message: 'Feature cannot be empty' }))
    .min(1, { message: 'Add at least one feature' })
    .max(20, { message: 'Maximum 20 features allowed' }),

  website: z
    .string()
    .url({ message: 'Website must be a valid URL' })
    .optional()
    .or(z.literal('')),

  category: z
    .string()
    .min(1, { message: 'Please select a category' }),

  tags: z
    .array(z.string())
    .max(10, { message: 'Maximum 10 tags allowed' })
    .optional(),

  // Metrics
  subscribers: z
    .number()
    .int()
    .min(0, { message: 'Subscribers must be a positive integer' })
    .default(0),

  monthlyRevenue: z
    .number()
    .min(0, { message: 'Revenue must be a positive number' })
    .default(0),

  // SEO
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
});

export type ProductFormData = z.infer<typeof productFormSchema>;
