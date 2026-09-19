# CodeSwayam Admin Panel

> The unified platform administration panel for CodeSwayam — manage users, subscriptions, content, analytics, and platform infrastructure from a single, powerful interface.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Port](https://img.shields.io/badge/Port-3002-green)]()
[![License](https://img.shields.io/badge/License-Private-red)]()

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Getting Started](#getting-started)
5. [Environment Variables](#environment-variables)
6. [Application Routes](#application-routes)
7. [Internal API Routes](#internal-api-routes)
8. [Component Inventory](#component-inventory)
9. [Library & Utilities](#library--utilities)
10. [Feature Matrix by Admin Role](#feature-matrix-by-admin-role)
11. [Key Features In Depth](#key-features-in-depth)
12. [Code Examples](#code-examples)
13. [Authentication & Middleware](#authentication--middleware)
14. [Data Export](#data-export)
15. [Theme System](#theme-system)
16. [Development Guide](#development-guide)
17. [Project Structure](#project-structure)

---

## Overview

The **CodeSwayam Admin Panel** is a full-stack, server-rendered administration interface built on **Next.js 16 App Router** with **React 19** and **TypeScript**. It provides platform administrators with complete control over every aspect of the CodeSwayam ecosystem — from individual user lifecycle management to cross-application usage analytics, content moderation, billing operations, and infrastructure health monitoring.

The panel runs on **port 3002** and is protected end-to-end by a layered security model: Next.js middleware performs admin JWT validation before any route is served, and all API calls are authenticated via the shared `@codeswayam/auth` package.

### What This Panel Manages

| Domain | Scope |
|---|---|
| Users | Full user lifecycle, entitlements, subscriptions, credits |
| Billing | Subscriptions, credits, wallets, coupons, trials |
| Content | Blogs, categories, comments, media library |
| Platform | SaaS products, feature flags, API keys, webhooks |
| Analytics | Platform-wide metrics, per-product analytics, usage dashboards |
| Operations | Notifications, approvals, audit logs, health monitoring |
| Configuration | Settings, SMTP, OAuth, security, trusted domains |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Admin Panel (Port 3002)                       │
│                     Next.js 16 App Router + React 19                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────┐ │
│  │   Middleware  │   │  App Router  │   │    Server Components      │ │
│  │  (4.3 KB)    │──▶│   /app/*     │──▶│  (Data fetching layer)   │ │
│  │ JWT Validate │   │              │   │                            │ │
│  └──────────────┘   └──────┬───────┘   └──────────────────────────┘ │
│                             │                                         │
│  ┌──────────────────────────▼──────────────────────────────────────┐ │
│  │                    Client Components                              │ │
│  │                                                                   │ │
│  │  AdminCommandPalette  │  DataTable  │  UserDeepDive  │  Charts   │ │
│  │  TiptapEditor         │  Sidebar    │  FileUploadZone            │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                      Internal API Routes                         │  │
│  │                                                                  │  │
│  │   /api/dashboard/stream (SSE)  │  /api/uploadthing              │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────────┐  │
│  │  Zustand     │  │   Zod         │  │   Local State             │  │
│  │  Stores      │  │   Schemas     │  │   (React 19 hooks)        │  │
│  └──────────────┘  └───────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────────┐
              ▼               ▼                   ▼
   ┌──────────────────┐  ┌──────────┐  ┌──────────────────┐
   │ @codeswayam/auth │  │ Backend  │  │   UploadThing    │
   │ @codeswayam/     │  │   API    │  │   (File Storage) │
   │ api-client       │  │          │  │                  │
   │ @codeswayam/     │  └──────────┘  └──────────────────┘
   │ access           │
   │ @codeswayam/ui   │
   │ @codeswayam/     │
   │ analytics        │
   └──────────────────┘
```

### Data Flow

```
Browser Request
    │
    ▼
Next.js Middleware (JWT validation, role check)
    │
    ├── Unauthenticated ──▶ Redirect to /auth/login
    │
    └── Authenticated ──▶ Route Handler
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
              Server Component     Client Component
              (initial data fetch)  (interactive UI)
                    │                   │
                    ▼                   ▼
              @codeswayam/         Zustand Store
              api-client           (table-store,
              (REST calls)          theme-store)
                    │
                    ▼
              Backend API
              (Port varies)
```

---

## Tech Stack

### Core Framework

| Package | Version | Purpose |
|---|---|---|
| `next` | 16.x | App Router, SSR, API routes, middleware |
| `react` | 19.x | UI library with concurrent features |
| `typescript` | 5.x | Type safety across the entire codebase |

### CodeSwayam Monorepo Packages

| Package | Version | Purpose |
|---|---|---|
| `@codeswayam/auth` | 2.5.1 | Authentication, JWT utilities, session management |
| `@codeswayam/api-client` | 1.3.1 | Typed HTTP client for backend API |
| `@codeswayam/access` | 1.0.0 | Role-based access control primitives |
| `@codeswayam/ui` | 1.2.1 | Shared design system components |
| `@codeswayam/analytics` | latest | Analytics event tracking |

### Third-Party Libraries

| Package | Purpose |
|---|---|
| `@tiptap/react` + extensions | Rich text editor for blog CMS |
| `uploadthing` | File upload infrastructure with CDN |
| `zod` | Runtime schema validation |
| `zustand` | Lightweight global state management |
| `tailwindcss` | Utility-first CSS framework |
| `next-themes` | Dark/light theme with SSR support |

---

## Getting Started

### Prerequisites

- Node.js >= 18.17.0
- pnpm >= 8.x (monorepo package manager)
- Access to the CodeSwayam backend API
- Valid admin JWT credentials

### Installation

From the monorepo root:

```bash
# Install all dependencies
pnpm install

# Start only the admin panel
pnpm --filter @codeswayam/admin-panel dev

# Or navigate directly
cd apps/admin-panel
pnpm dev
```

The panel will be available at **http://localhost:3002**.

### Build for Production

```bash
# Build from monorepo root
pnpm --filter @codeswayam/admin-panel build

# Or from the app directory
cd apps/admin-panel
pnpm build
pnpm start
```

### Linting & Type Checking

```bash
# Type check
pnpm --filter @codeswayam/admin-panel type-check

# Lint
pnpm --filter @codeswayam/admin-panel lint

# Format
pnpm --filter @codeswayam/admin-panel format
```

---

## Environment Variables

Create a `.env.local` file in `apps/admin-panel/` before running the development server.

```env
# ── API Endpoints ─────────────────────────────────────────────────────────────
# Base URL of the CodeSwayam backend REST API
NEXT_PUBLIC_API_URL=https://api.codeswayam.com

# Base URL of the authentication service
NEXT_PUBLIC_AUTH_URL=https://auth.codeswayam.com

# ── UploadThing (File Uploads) ─────────────────────────────────────────────────
# Secret key from the UploadThing dashboard (server-side only)
UPLOADTHING_SECRET=sk_live_xxxxxxxxxxxxxxxxxxxx

# Your UploadThing application ID
UPLOADTHING_APP_ID=xxxxxxxxxxxxxxxx

# ── Admin JWT Secret ───────────────────────────────────────────────────────────
# Secret used to validate admin JWTs in the Next.js middleware
# Must match the secret used by the auth service when issuing admin tokens
ADMIN_JWT_SECRET=your-super-secret-admin-jwt-key-min-32-chars
```

### Environment Variable Reference

| Variable | Required | Visibility | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Public (browser) | Backend API base URL. Exposed to client-side code. |
| `NEXT_PUBLIC_AUTH_URL` | ✅ | Public (browser) | Auth service base URL. Used for login redirects and token refresh. |
| `UPLOADTHING_SECRET` | ✅ | Server-only | UploadThing secret key. **Never expose to the browser.** |
| `UPLOADTHING_APP_ID` | ✅ | Server-only | UploadThing application identifier. |
| `ADMIN_JWT_SECRET` | ✅ | Server-only | JWT signing secret for middleware validation. **Keep this secret.** |

> ⚠️ **Security Note:** `UPLOADTHING_SECRET` and `ADMIN_JWT_SECRET` are server-only variables. They do not have the `NEXT_PUBLIC_` prefix, so Next.js will never bundle them into client-side JavaScript. Never add these to your public environment.

---

## Application Routes

All routes live under `src/app/` and are protected by the admin JWT middleware.

### Core & Analytics

| Route | File | Description |
|---|---|---|
| `/` | `page.tsx` | **Dashboard Home** — Platform-wide KPIs (total users, live MRR, published blogs, SaaS products). Includes a **Period / Month Dropdown Selector** (All Time Live, Current Month, Last Month, Last 3M/6M/12M, or specific historical calendar months). Real-time streaming stats via SSE, accurate subscription-backed revenue calculations, per-product MRR breakdown, and MRR Waterfall movements. |
| `/analytics` | `analytics/page.tsx` | **Platform Analytics** — Interactive charts for user growth, revenue trends, feature usage. Date range picker (custom, 7d, 30d, 90d, 1y). Export data to CSV or PDF. |
| `/usage` ★ | `usage/page.tsx` | **Cross-App Usage Dashboard** *(Phase 6)* — Aggregated usage counters across all CodeSwayam applications. Side-by-side comparison, quota utilization bars, top consumers. |
| `/usage/[appId]` ★ | `usage/[appId]/page.tsx` | **Per-App Usage Detail** *(Phase 6)* — Drill-down into a single application's usage counters, historical usage charts, quota vs. actual comparisons, and per-feature breakdowns. |
| `/health` | `health/page.tsx` | **System Health** — Live status of database connections, Redis cache, background job queues, external service integrations. Response time graphs and uptime percentages. |
| `/activity` | `activity/page.tsx` | **Activity Feed** — Chronological stream of all platform events. Filter by user, action type, or date range. |

### User Management

| Route | File | Description |
|---|---|---|
| `/users` | `users/page.tsx` | **User Management** — Searchable, filterable user table with pagination. Columns: name, email, role, subscription plan, credit balance, join date, last active. Inline actions: impersonate, suspend, delete. |
| `/users/[id]` | `users/[id]/page.tsx` | **User Detail** — Opens `UserDeepDive` component (16KB). Tabs: Profile, Entitlements, Subscriptions, Credits, Activity, Audit. Full credit adjustment panel, plan change UI, and entitlement editor. |

### Billing & Subscriptions

| Route | File | Description |
|---|---|---|
| `/subscriptions` | `subscriptions/page.tsx` | **Subscription Management** — Table of all subscriptions filtered by status (active, cancelled, past_due, expired). Plan change modal, cancellation flow, bulk operations (cancel, pause, resume). |
| `/credits` | `credits/page.tsx` | **Credit Management** — Four tabs: Wallets (per-user balance overview), Transactions (full ledger), Purchases (credit packs), Coupons (create/manage discount/credit coupons). Manual adjustment panel with reason tracking. |
| `/trials` | `trials/page.tsx` | **Trial Management** — Active and expired free trials. Extend trial period, convert to paid, or revoke. Trial conversion funnel metrics. |
| `/rewards` | `rewards/page.tsx` | **Rewards Management** — Points ledger, referral tracking, reward tiers configuration. Issue manual points, view top earners, manage referral bonus rules. |

### SaaS Products

| Route | File | Description |
|---|---|---|
| `/saas-products` | `saas-products/page.tsx` | **Product CRUD** — Full management of SaaS product catalog. Create/edit products with pricing tiers, usage limit configuration (JSON editor with schema validation), feature toggles per tier, and credit costs. Drag-to-reorder tiers. |
| `/saas-products/analytics` | `saas-products/analytics/page.tsx` | **Per-Product Analytics** — MRR, churn, and subscriber metrics. Features a **Period Selector Dropdown** (All Time Live, 30D, 3M, 6M, 12M). Accurately calculates Total MRR/ARR, per-product MRR & ARPU in paise/INR, product churn rate (%), and MoM growth rate (%). |

### Content Management

| Route | File | Description |
|---|---|---|
| `/blogs` | `blogs/page.tsx` | **Blog CMS** — All blog posts with status filter (draft, published, archived). Sortable table with view count, last modified, author. Bulk publish/unpublish. SEO preview cards. |
| `/blogs/new` | `blogs/new/page.tsx` | **New Blog Post** — Full Tiptap editor with toolbar (headings, bold, italic, lists, code blocks, images, embeds). SEO fields (meta title, meta description, canonical URL, OG image). Category and tag assignment. Publish scheduling. |
| `/blogs/[id]` | `blogs/[id]/page.tsx` | **Edit Blog Post** — Identical to `/blogs/new` but pre-populated. Version history sidebar. Diff view for changes. |
| `/categories` | `categories/page.tsx` | **Category Management** — Blog category tree. Create, rename, nest, and delete categories. Slug auto-generation. Post count per category. |
| `/comments` | `comments/page.tsx` | **Comment Moderation** — Pending, approved, and flagged comments queue. Inline approve/reject/delete. User context panel on hover. Bulk moderation actions. |
| `/media` | `media/page.tsx` | **Media Library** — Grid view of all uploaded files (images, PDFs, documents). Drag-and-drop upload via `FileUploadZone`. UploadThing-backed storage. Copy URL, delete, filter by type. |

### Platform Configuration

| Route | File | Description |
|---|---|---|
| `/feature-flags` | `feature-flags/page.tsx` | **Feature Flags** — Toggle features per application and subscription tier. Boolean and percentage-rollout flags. Flag history with who changed what and when. Emergency kill-switch highlighting. |
| `/webhooks` | `webhooks/page.tsx` | **Webhook Management** — Register webhook endpoints with event subscriptions. Delivery log table with status codes, response times, and payload previews. Replay failed deliveries. |
| `/api-keys` | `api-keys/page.tsx` | **API Key Management** — Issue, rotate, and revoke Neural API keys. Per-key usage counters, rate limit configuration, and scope assignment. |
| `/notifications` | `notifications/page.tsx` | **Notification Campaigns** — Create and send push notification campaigns. Audience targeting (all users, plan-based, tag-based). Schedule future sends. Delivery statistics (sent, opened, clicked). |
| `/settings` | `settings/page.tsx` | **Platform Settings** — Tabbed configuration: SMTP (email delivery settings), OAuth providers (Google, GitHub), Security (password policy, MFA enforcement, session TTL), Trusted Domains (CORS whitelist). |

### Compliance & Audit

| Route | File | Description |
|---|---|---|
| `/audit-log` | `audit-log/page.tsx` | **Audit Trail** — Immutable log of all admin actions. Filter by admin user, action type (CREATE, UPDATE, DELETE, LOGIN, etc.), resource type, and date range. Export as CSV for compliance reporting. |
| `/approvals` | `approvals/page.tsx` | **Approval Workflows** — Queue of pending approvals (plan upgrades requiring review, large credit adjustments, etc.). Approve or reject with a reason. Assignee management. |

### Developer Tools

| Route | File | Description |
|---|---|---|
| `/changelog` | `changelog/page.tsx` | **Platform Changelog** — Version history with release notes. Tag entries by type (feature, bugfix, breaking, security). |
| `/search` | `search/page.tsx` | **Global Search** — Full-text search across users, blogs, products, API keys. Also the backing page for the ⌘K command palette. |

> ★ Routes marked **NEW** are part of Phase 6 of the implementation plan (Cross-App Usage Dashboard).

---

## Internal API Routes

Located under `src/app/api/`, these are Next.js Route Handlers consumed internally by the panel itself.

### `GET /api/dashboard/stream`

Server-Sent Events (SSE) endpoint that pushes real-time platform metrics to the dashboard home page without requiring a full page refresh.

**Stream events:**

| Event | Payload | Description |
|---|---|---|
| `metrics` | `{ activeUsers, revenue, newSignups, creditsIssued }` | Updated platform KPIs |
| `alert` | `{ level, message, timestamp }` | System alerts (high error rate, queue backlog, etc.) |
| `heartbeat` | `{ ts }` | Keep-alive ping every 30 seconds |

**Usage in dashboard:**
```typescript
const eventSource = new EventSource('/api/dashboard/stream');
eventSource.addEventListener('metrics', (e) => {
  const data = JSON.parse(e.data);
  setMetrics(data);
});
```

### `POST /api/uploadthing`

UploadThing file upload handler. Validates authentication, enforces file type and size limits, and returns a CDN URL for the uploaded asset. Used by `FileUploadZone` and the Tiptap editor image upload.

**Accepted file types:** Images (JPEG, PNG, WebP, GIF, SVG), PDF, common document formats.
**Max file size:** Configurable via UploadThing dashboard (default: 16MB).

---

## Component Inventory

### Layout & Navigation

| Component | File | Size | Description |
|---|---|---|---|
| `Sidebar` | `components/Sidebar.tsx` | 6.1 KB | Primary navigation sidebar. Collapsible. Groups routes into sections (Analytics, Users, Billing, Content, Platform, Settings). Active route highlighting. Admin role badge. |
| `MobileSidebar` | `components/MobileSidebar.tsx` | 9.5 KB | Responsive mobile navigation. Sheet-based drawer that slides in from the left. Mirrors the desktop Sidebar structure. Closes on route change. |
| `AdminCommandPalette` | `components/AdminCommandPalette.tsx` | 14 KB | Full ⌘K (Cmd+K / Ctrl+K) command palette. Fuzzy-search across all routes, recent pages, and quick actions (create user, issue credits, toggle flag). Keyboard-navigable result list. |

### Data Display

| Component | File | Description |
|---|---|---|
| `DataTable` | `components/data-table/DataTable.tsx` | Generic, fully-typed data table built on TanStack Table. Sortable columns, row selection, pagination integration. |
| `DataTableToolbar` | `components/data-table/DataTableToolbar.tsx` | Toolbar above data tables: search input, column visibility toggle, filter dropdowns, export button. |
| `DataTablePagination` | `components/data-table/DataTablePagination.tsx` | Pagination controls: page size selector, page navigation, total record count. |
| `DataTableColumnHeader` | `components/data-table/DataTableColumnHeader.tsx` | Sortable column header component with asc/desc/unsorted indicators. |
| `Pagination` | `components/Pagination.tsx` | Standalone pagination component for non-table contexts. |

### Dashboard Components

| Component | File | Description |
|---|---|---|
| `MetricCard` | `components/dashboard/MetricCard.tsx` | KPI display card. Shows value, label, trend (up/down %), and an optional sparkline. Accepts a loading skeleton state. |
| `DateRangePicker` | `components/dashboard/DateRangePicker.tsx` | Calendar-based date range selector. Preset options (Today, 7D, 30D, 90D, YTD, custom). Emits `{ from, to }` on change. |
| `ExportButton` | `components/dashboard/ExportButton.tsx` | Dropdown button that triggers CSV or PDF export of the current data view. Integrates with `pdf-exporter.ts` and `csv-exporter.ts`. |

### User Components

| Component | File | Size | Description |
|---|---|---|---|
| `UserDeepDive` | `components/users/UserDeepDive.tsx` | 16 KB | Comprehensive user detail panel. Tabs: **Profile** (edit name, email, avatar), **Entitlements** (view and edit access grants), **Subscriptions** (history, plan change), **Credits** (wallet balance, transaction history, manual adjustment form), **Activity** (recent actions), **Audit** (changes made to this user's account). |

### Content Components

| Component | File | Size | Description |
|---|---|---|---|
| `TiptapEditor` | `components/TiptapEditor.tsx` | 7.5 KB | Rich text editor wrapping Tiptap. Toolbar with formatting controls, headings, lists, blockquote, code, horizontal rule. Image upload integration via UploadThing. Output as HTML or JSON. |
| `FileUploadZone` | `components/FileUploadZone.tsx` | 8.4 KB | Drag-and-drop file upload area. Visual drop target, upload progress bar, file preview thumbnails, error state handling. Backed by UploadThing. |

### UI Utilities

| Component | File | Description |
|---|---|---|
| `ConfirmDialog` | `components/ConfirmDialog.tsx` | Reusable confirmation modal. Accepts `title`, `description`, `onConfirm`, and `onCancel`. Renders a destructive-styled confirm button for delete/irreversible actions. |
| `ThemeToggle` | `components/ThemeToggle.tsx` | Sun/moon icon button that cycles between light and dark themes. |
| `ThemeProvider` | `components/ThemeProvider.tsx` | Wraps the app in `next-themes` provider. Reads initial theme from Zustand `theme-store`, persists selection. |

### Loading Skeletons

| Component | File | Usage |
|---|---|---|
| `DashboardSkeleton` | `components/skeletons/DashboardSkeleton.tsx` | Shown while dashboard KPI data is loading. Mimics the MetricCard grid layout. |
| `TableSkeleton` | `components/skeletons/TableSkeleton.tsx` | Shimmer skeleton for any data table. Configurable row and column count. |
| `FormSkeleton` | `components/skeletons/FormSkeleton.tsx` | Skeleton for settings and edit forms. |
| `ChartSkeleton` | `components/skeletons/ChartSkeleton.tsx` | Placeholder for chart areas while analytics data loads. |

---

## Library & Utilities

### `src/lib/api.ts` (17.3 KB)

The central admin API client. Wraps `@codeswayam/api-client` with admin-specific authentication headers and typed response interfaces for every endpoint.

**Organized into namespaced modules:**

```typescript
import { adminApi } from '@/lib/api';

// Users
adminApi.users.list(params)
adminApi.users.get(userId)
adminApi.users.update(userId, data)
adminApi.users.suspend(userId, reason)
adminApi.users.delete(userId)
adminApi.users.adjustCredits(userId, amount, reason)

// Subscriptions
adminApi.subscriptions.list(params)
adminApi.subscriptions.changePlan(subId, newPlanId)
adminApi.subscriptions.cancel(subId, reason)
adminApi.subscriptions.bulkCancel(subIds, reason)

// Analytics
adminApi.analytics.platformMetrics(dateRange)
adminApi.analytics.userGrowth(dateRange, granularity)
adminApi.analytics.revenue(dateRange, groupBy)

// Feature Flags
adminApi.featureFlags.list()
adminApi.featureFlags.toggle(flagId, enabled)
adminApi.featureFlags.setRollout(flagId, percentage)

// Usage (Phase 6)
adminApi.usage.crossApp(dateRange)
adminApi.usage.byApp(appId, dateRange)

// ... and many more namespaces
```

### `src/lib/uploadthing.ts`

UploadThing client configuration. Exports typed upload hooks (`useUploadThing`) and the server-side `createUploadthing` router used in `/api/uploadthing`.

### `src/lib/export/pdf-exporter.ts`

Server-side PDF generation utility. Accepts a table data structure and column definitions, renders to PDF with CodeSwayam branding, and triggers a browser download.

### `src/lib/export/csv-exporter.ts`

Client-side CSV export utility. Takes a data array and column map, serializes to CSV format, and triggers a browser download. Handles special characters, nested values, and date formatting.

### `src/lib/schemas/`

Zod validation schemas for form data.

| Schema | File | Validates |
|---|---|---|
| Product Schema | `product-schema.ts` | SaaS product creation/edit form including pricing tier arrays and usage limit JSON |
| Blog Schema | `blog-schema.ts` | Blog post fields including SEO metadata, slug format, and required fields |

### `src/lib/stores/`

Zustand global state stores.

| Store | File | State |
|---|---|---|
| `table-store.ts` | Manages cross-route table state: column visibility, sort order, selected rows, active filters. Persisted to `localStorage`. |
| `theme-store.ts` | Tracks the current theme (`light` / `dark` / `system`). Synced with `next-themes`. |

---

## Feature Matrix by Admin Role

| Feature | Platform Admin | App Admin *(future)* |
|---|---|---|
| **Dashboard** | ✅ Platform-wide KPIs | ✅ App-scoped KPIs |
| **User Management** | ✅ All users | ✅ Users of assigned app |
| **User Entitlements** | ✅ View & edit | 🔒 View only |
| **Credit Adjustments** | ✅ Any user | ✅ Users of assigned app |
| **Subscription Management** | ✅ All subscriptions | ✅ App subscriptions |
| **Plan Changes** | ✅ | ✅ |
| **Bulk Subscription Ops** | ✅ | 🔒 |
| **Credit & Coupon Management** | ✅ | 🔒 |
| **Trial Management** | ✅ | ✅ App trials |
| **Rewards Management** | ✅ | 🔒 |
| **SaaS Product CRUD** | ✅ | 🔒 |
| **SaaS Product Analytics** | ✅ | ✅ Assigned products |
| **Feature Flags** | ✅ All apps/tiers | ✅ Assigned app |
| **Blog CMS** | ✅ | ✅ |
| **Comment Moderation** | ✅ | ✅ |
| **Media Library** | ✅ | ✅ |
| **Platform Analytics** | ✅ | 🔒 |
| **Usage Dashboard** | ✅ All apps | ✅ Assigned app |
| **Webhook Management** | ✅ | ✅ Assigned app |
| **API Key Management** | ✅ | 🔒 |
| **Notification Campaigns** | ✅ | ✅ App audience |
| **Audit Log** | ✅ Full log | ✅ Own actions |
| **Approval Workflows** | ✅ All approvals | ✅ Assigned app |
| **Health Dashboard** | ✅ | 🔒 |
| **Platform Settings** | ✅ | 🔒 |
| **Feature Flag Kill-Switch** | ✅ | 🔒 |
| **Impersonate User** | ✅ | 🔒 |
| **Delete User** | ✅ | 🔒 |
| **Changelog** | ✅ | ✅ |

> 🔒 = No access &nbsp;&nbsp; ✅ = Full access &nbsp;&nbsp; *(future)* = Role planned but not yet implemented

---

## Key Features In Depth

### 1. Real-Time Streaming Dashboard (SSE)

The dashboard home page subscribes to `/api/dashboard/stream` immediately on mount. The server keeps the HTTP connection open and pushes metric updates as platform activity occurs, giving administrators a live view of the platform without polling.

The stream connection is managed by a React hook that handles reconnection on disconnect, cleanup on unmount, and graceful degradation to static data if SSE is unavailable.

### 2. Full User Lifecycle Management

The `/users` route and `UserDeepDive` component together cover every aspect of user administration:

- **Search and filter** by name, email, subscription status, plan, registration date, and credit balance
- **Entitlements tab** shows every access grant a user holds — which features, which limits, which products — with direct edit capability
- **Credit adjustment** with mandatory reason field for audit trail
- **Subscription management** including plan upgrades, downgrades, cancellation, and trial extension
- **Activity history** showing the last N actions the user took on the platform

### 3. Usage Monitoring Across All Apps (Phase 6)

The new `/usage` dashboard aggregates API usage counters from every CodeSwayam application into a unified view. Administrators can identify which apps are approaching quota limits, which features are most consumed, and track trends over time. The `/usage/[appId]` drill-down provides per-feature counter breakdowns with historical charts.

### 4. Feature Flags Per App/Tier

The feature flag system supports three modes:
- **Boolean** — fully on or off
- **Percentage rollout** — gradually enable for a fraction of users
- **Tier-scoped** — enable only for users on specific subscription plans

Every flag change is recorded with the admin's identity and timestamp. High-risk flags are highlighted with a kill-switch indicator.

### 5. Webhook Management with Delivery Logs

Administrators can register webhook endpoints and subscribe them to specific platform events (user.created, subscription.cancelled, payment.failed, etc.). The delivery log table shows:
- HTTP status code of the webhook receiver
- Response time
- Payload preview (collapsible JSON)
- Retry count for failed deliveries
- "Replay" button to re-send a specific delivery

### 6. Audit Trail for Compliance

Every admin action is written to an append-only audit log with:
- Admin user identity
- Action type (CREATE / UPDATE / DELETE / LOGIN / EXPORT / etc.)
- Target resource type and ID
- Before/after payload snapshot for UPDATE operations
- IP address and user agent
- ISO 8601 timestamp

The log is filterable and exportable as CSV for security audits or compliance reporting.

### 7. Push Notification Campaigns

Build and send push notification campaigns with:
- **Audience targeting**: all users, plan-based segments, custom tag groups
- **Content editor**: title, body, icon, click URL, custom data payload
- **Scheduling**: send immediately or schedule for a future datetime
- **Analytics**: per-campaign delivery rate, open rate, and click-through rate

### 8. Blog CMS with Rich Editor

The Tiptap-powered blog editor supports:
- Full formatting toolbar (H1–H4, bold, italic, strikethrough, underline)
- Ordered and unordered lists, task lists
- Code blocks with syntax highlighting
- Image insertion with UploadThing cloud upload
- Blockquote, horizontal rule, hard break
- Inline link editor
- Full SEO metadata panel (meta title, description, OG image, canonical URL)
- Category and tag assignment
- Draft/published/archived status toggle
- Publish date scheduling

### 9. Media Library with Cloud Uploads

The media library provides a centralized view of all files uploaded to UploadThing. Administrators can:
- Upload new files via drag-and-drop or file picker
- Browse files in a responsive grid with thumbnail previews
- Filter by file type (image, document, etc.)
- Copy CDN URL to clipboard
- Delete files (with confirmation)
- Search by filename

### 10. CSV/PDF Export for All Data Tables

Every data table in the admin panel has an `ExportButton` in its toolbar. Two formats are supported:

**CSV**: Client-side generation, instant download, preserves all visible columns.
**PDF**: Server-side rendering with CodeSwayam branding, pagination, and column headers. Used for compliance documents and formal reports.

### 11. ⌘K Command Palette

`AdminCommandPalette` (14 KB) provides keyboard-first navigation of the entire admin panel. Press `⌘K` (macOS) or `Ctrl+K` (Windows/Linux) to open a full-screen search overlay with:
- Fuzzy search across all routes with route descriptions
- Recent pages history
- Quick actions: "Create new user", "Issue credits", "Toggle feature flag X"
- Keyboard arrow-key navigation and Enter to select

### 12. Trial Period Management

The `/trials` route lists all active and expired free trials with metadata: start date, end date, trial plan, conversion status. Administrators can:
- Extend a trial by N days
- Convert a trial directly to a paid subscription
- Revoke a trial with a reason (which notifies the user)
- View conversion funnel metrics (started → converted / expired)

---

## Code Examples

### Admin API Client Usage

The `adminApi` object in `src/lib/api.ts` provides a fully-typed interface to every backend endpoint. All methods return typed promises.

```typescript
// src/app/users/page.tsx

import { adminApi } from '@/lib/api';

interface PageProps {
  searchParams: { page?: string; search?: string; plan?: string };
}

export default async function UsersPage({ searchParams }: PageProps) {
  const { page = '1', search = '', plan } = searchParams;

  // Typed response — UserListResponse is inferred from api.ts
  const { users, total, pageCount } = await adminApi.users.list({
    page: parseInt(page, 10),
    pageSize: 25,
    search,
    plan: plan as PlanSlug | undefined,
  });

  return <UsersTable users={users} total={total} pageCount={pageCount} />;
}
```

### Feature Flag Toggle

```typescript
// src/app/feature-flags/actions.ts
'use server';

import { adminApi } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export async function toggleFeatureFlag(
  flagId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await adminApi.featureFlags.toggle(flagId, enabled);
    // Revalidate the feature flags page so the UI reflects the change
    revalidatePath('/feature-flags');
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}
```

```typescript
// Usage in a client component
'use client';

import { toggleFeatureFlag } from './actions';
import { Switch } from '@codeswayam/ui';

interface FeatureFlagRowProps {
  flag: { id: string; name: string; enabled: boolean };
}

export function FeatureFlagRow({ flag }: FeatureFlagRowProps) {
  const [optimistic, setOptimistic] = useState(flag.enabled);

  async function handleToggle(checked: boolean) {
    setOptimistic(checked); // optimistic update
    const result = await toggleFeatureFlag(flag.id, checked);
    if (!result.success) {
      setOptimistic(!checked); // revert on error
      toast.error(result.error ?? 'Failed to toggle flag');
    }
  }

  return (
    <div className="flex items-center justify-between py-3">
      <span className="font-medium">{flag.name}</span>
      <Switch checked={optimistic} onCheckedChange={handleToggle} />
    </div>
  );
}
```

### Usage Dashboard Data Fetch

```typescript
// src/app/usage/page.tsx

import { adminApi } from '@/lib/api';
import { DateRange } from '@/components/dashboard/DateRangePicker';

interface UsagePageProps {
  searchParams: { from?: string; to?: string };
}

export default async function UsagePage({ searchParams }: UsagePageProps) {
  const dateRange: DateRange = {
    from: searchParams.from ? new Date(searchParams.from) : subDays(new Date(), 30),
    to: searchParams.to ? new Date(searchParams.to) : new Date(),
  };

  // Fetch aggregated cross-app usage data
  const usageData = await adminApi.usage.crossApp(dateRange);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cross-App Usage</h1>

      {usageData.apps.map((app) => (
        <div key={app.id} className="rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">{app.name}</h2>
            <span className="text-sm text-muted-foreground">
              {app.usedUnits.toLocaleString()} / {app.quotaUnits.toLocaleString()} units
            </span>
          </div>
          {/* Quota utilization bar */}
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(app.usedUnits / app.quotaUnits) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Per-App Usage Detail

```typescript
// src/app/usage/[appId]/page.tsx

import { adminApi } from '@/lib/api';

interface AppUsagePageProps {
  params: { appId: string };
}

export default async function AppUsagePage({ params }: AppUsagePageProps) {
  const [appUsage, appMeta] = await Promise.all([
    adminApi.usage.byApp(params.appId, { from: subDays(new Date(), 30), to: new Date() }),
    adminApi.saasProducts.get(params.appId),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">{appMeta.name} — Usage Detail</h1>
        <p className="text-muted-foreground">Last 30 days</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {appUsage.counters.map((counter) => (
          <MetricCard
            key={counter.feature}
            label={counter.feature}
            value={counter.used}
            trend={counter.trendPercent}
          />
        ))}
      </div>

      {/* Historical usage chart rendered by @codeswayam/analytics */}
      <UsageHistoryChart data={appUsage.history} />
    </div>
  );
}
```

### UserDeepDive Component Usage

```typescript
// src/app/users/[id]/page.tsx

import { adminApi } from '@/lib/api';
import { UserDeepDive } from '@/components/users/UserDeepDive';

interface UserDetailPageProps {
  params: { id: string };
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  // Fetch all user data in parallel
  const [user, entitlements, subscriptions, credits, activity] = await Promise.all([
    adminApi.users.get(params.id),
    adminApi.users.getEntitlements(params.id),
    adminApi.users.getSubscriptions(params.id),
    adminApi.users.getCreditWallet(params.id),
    adminApi.users.getActivity(params.id, { limit: 50 }),
  ]);

  return (
    <UserDeepDive
      user={user}
      entitlements={entitlements}
      subscriptions={subscriptions}
      creditWallet={credits}
      recentActivity={activity}
      // Callbacks wired to Server Actions
      onCreditAdjust={adjustUserCredits}
      onPlanChange={changeUserPlan}
      onSuspend={suspendUser}
    />
  );
}
```

---

## Authentication & Middleware

### Middleware Architecture

The Next.js middleware (`middleware.ts`, 4.3 KB) runs on every request to the admin panel before any route handler is executed.

**Validation steps:**

1. **Token extraction** — Reads the `admin_token` cookie or the `Authorization: Bearer` header.
2. **JWT verification** — Validates the token signature using `ADMIN_JWT_SECRET`. Rejects expired, tampered, or missing tokens.
3. **Role assertion** — Confirms the token payload contains `role: "PLATFORM_ADMIN"` (or `APP_ADMIN` for future scoped access).
4. **Route protection** — Any request failing steps 1–3 is redirected to the auth service login page with the current URL as a `redirect` query parameter.
5. **Header injection** — Injects `x-admin-id` and `x-admin-role` headers into the request for downstream Server Components and Route Handlers.

```typescript
// Simplified middleware flow
export async function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
    ?? request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return redirectToLogin(request);
  }

  const payload = await verifyAdminJWT(token, process.env.ADMIN_JWT_SECRET!);

  if (!payload || !['PLATFORM_ADMIN', 'APP_ADMIN'].includes(payload.role)) {
    return redirectToLogin(request);
  }

  const response = NextResponse.next();
  response.headers.set('x-admin-id', payload.sub);
  response.headers.set('x-admin-role', payload.role);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/uploadthing).*)'],
};
```

### Session Management

Session handling is delegated to `@codeswayam/auth` v2.5.1. The auth package provides:
- Token refresh logic (silently renews tokens before expiry)
- Logout utility (clears cookies, invalidates server-side session)
- `useAdminSession()` hook for client components needing the current admin identity

---

## Data Export

### CSV Export

Triggered from any `ExportButton` in a table toolbar. The `csv-exporter.ts` utility:

1. Accepts `data: Record<string, unknown>[]` and `columns: ColumnDef[]`
2. Serializes each row respecting column formatting (dates, numbers, booleans)
3. Escapes commas and quotes in string values
4. Triggers a browser file download via a Blob URL

```typescript
import { exportToCSV } from '@/lib/export/csv-exporter';

exportToCSV({
  filename: `users-export-${format(new Date(), 'yyyy-MM-dd')}`,
  data: users,
  columns: [
    { key: 'email', label: 'Email' },
    { key: 'plan', label: 'Plan' },
    { key: 'createdAt', label: 'Joined', format: (v) => format(new Date(v), 'PP') },
    { key: 'creditBalance', label: 'Credits', format: (v) => v.toLocaleString() },
  ],
});
```

### PDF Export

The `pdf-exporter.ts` utility generates a server-rendered PDF:

1. Accepts the same `data` and `columns` interface as the CSV exporter
2. Renders a styled table with CodeSwayam header branding
3. Handles pagination for large datasets
4. Returns a PDF `Blob` that the client downloads

---

## Theme System

The admin panel supports **light**, **dark**, and **system** (OS preference) themes.

**How it works:**

1. `ThemeProvider` (wraps `_layout.tsx`) reads the initial theme from `theme-store` (Zustand, persisted in `localStorage`).
2. `next-themes` applies the appropriate Tailwind `dark` class to `<html>`.
3. All `@codeswayam/ui` components and custom components use Tailwind's `dark:` variant for color inversions.
4. `ThemeToggle` button updates `theme-store`, which propagates to `next-themes`.

**No flash of unstyled content (FOUC):** The `ThemeProvider` uses `next-themes`' `suppressHydrationWarning` and `defaultTheme="system"` to prevent the light/dark flash on first load.

---

## Development Guide

### Adding a New Route

1. Create the directory under `src/app/your-route/`.
2. Add `page.tsx` as a Server Component for initial data fetching.
3. Add the route to `Sidebar.tsx` and `MobileSidebar.tsx` navigation arrays.
4. Register the route in `AdminCommandPalette.tsx` route list.
5. If the route needs new API calls, add the corresponding method to `src/lib/api.ts`.
6. Add Zod schema to `src/lib/schemas/` if the route has a form.

### Adding a New API Method

`src/lib/api.ts` exports the `adminApi` object. Add new methods to the relevant namespace:

```typescript
// src/lib/api.ts

export const adminApi = {
  // ... existing namespaces

  yourFeature: {
    list: (params: YourListParams): Promise<YourListResponse> =>
      apiClient.get('/admin/your-feature', { params }),

    create: (data: CreateYourFeatureInput): Promise<YourFeature> =>
      apiClient.post('/admin/your-feature', data),
  },
};
```

### Adding a Feature Flag

Feature flags are managed at runtime through the admin UI. To check a flag in application code:

```typescript
import { adminApi } from '@/lib/api';

const flags = await adminApi.featureFlags.list();
const isNewFeatureEnabled = flags.find(f => f.key === 'new-feature')?.enabled ?? false;
```

### Coding Conventions

- **Server Components first**: Default to Server Components for data fetching. Use `'use client'` only when interactivity requires it.
- **Parallel data fetching**: Use `Promise.all()` in Server Components to fetch independent data concurrently.
- **Zod validation on all forms**: Every form submission must be validated against a Zod schema before the Server Action calls the API.
- **Skeleton loading**: Every new page should have a corresponding `loading.tsx` that renders the appropriate skeleton component.
- **ConfirmDialog for destructive actions**: Any action that deletes or irreversibly modifies data must show a `ConfirmDialog` before proceeding.
- **Audit trail awareness**: Any admin action that mutates platform data should flow through the backend audit logging path — do not add client-side shortcuts that bypass the API.

---

## Project Structure

```
apps/admin-panel/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (ThemeProvider, Sidebar)
│   │   ├── page.tsx                  # Dashboard home (/)
│   │   ├── loading.tsx               # Root loading state
│   │   │
│   │   ├── analytics/
│   │   │   └── page.tsx              # /analytics
│   │   ├── api/
│   │   │   ├── dashboard/
│   │   │   │   └── stream/
│   │   │   │       └── route.ts      # SSE stream endpoint
│   │   │   └── uploadthing/
│   │   │       └── route.ts          # File upload handler
│   │   ├── api-keys/
│   │   │   └── page.tsx
│   │   ├── approvals/
│   │   │   └── page.tsx
│   │   ├── audit-log/
│   │   │   └── page.tsx
│   │   ├── blogs/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── categories/
│   │   │   └── page.tsx
│   │   ├── changelog/
│   │   │   └── page.tsx
│   │   ├── comments/
│   │   │   └── page.tsx
│   │   ├── credits/
│   │   │   └── page.tsx
│   │   ├── feature-flags/
│   │   │   └── page.tsx
│   │   ├── health/
│   │   │   └── page.tsx
│   │   ├── media/
│   │   │   └── page.tsx
│   │   ├── notifications/
│   │   │   └── page.tsx
│   │   ├── rewards/
│   │   │   └── page.tsx
│   │   ├── saas-products/
│   │   │   ├── page.tsx
│   │   │   └── analytics/
│   │   │       └── page.tsx
│   │   ├── search/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   ├── subscriptions/
│   │   │   └── page.tsx
│   │   ├── trials/
│   │   │   └── page.tsx
│   │   ├── usage/                    # ★ NEW (Phase 6)
│   │   │   ├── page.tsx
│   │   │   └── [appId]/
│   │   │       └── page.tsx
│   │   ├── users/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── webhooks/
│   │       └── page.tsx
│   │
│   ├── components/                   # Shared UI components
│   │   ├── AdminCommandPalette.tsx   # ⌘K palette (14 KB)
│   │   ├── ConfirmDialog.tsx
│   │   ├── FileUploadZone.tsx        # (8.4 KB)
│   │   ├── MobileSidebar.tsx         # (9.5 KB)
│   │   ├── Pagination.tsx
│   │   ├── Sidebar.tsx               # (6.1 KB)
│   │   ├── ThemeProvider.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── TiptapEditor.tsx          # (7.5 KB)
│   │   ├── dashboard/
│   │   │   ├── DateRangePicker.tsx
│   │   │   ├── ExportButton.tsx
│   │   │   └── MetricCard.tsx
│   │   ├── data-table/
│   │   │   ├── DataTable.tsx
│   │   │   ├── DataTableColumnHeader.tsx
│   │   │   ├── DataTablePagination.tsx
│   │   │   └── DataTableToolbar.tsx
│   │   ├── skeletons/
│   │   │   ├── ChartSkeleton.tsx
│   │   │   ├── DashboardSkeleton.tsx
│   │   │   ├── FormSkeleton.tsx
│   │   │   └── TableSkeleton.tsx
│   │   └── users/
│   │       └── UserDeepDive.tsx      # (16 KB)
│   │
│   ├── lib/                          # Utilities and infrastructure
│   │   ├── api.ts                    # Admin API client (17.3 KB)
│   │   ├── uploadthing.ts
│   │   ├── export/
│   │   │   ├── csv-exporter.ts
│   │   │   └── pdf-exporter.ts
│   │   ├── schemas/
│   │   │   ├── blog-schema.ts
│   │   │   └── product-schema.ts
│   │   └── stores/
│   │       ├── table-store.ts
│   │       └── theme-store.ts
│   │
│   └── middleware.ts                 # JWT validation middleware (4.3 KB)
│
├── public/                           # Static assets
├── .env.local                        # Local environment variables (gitignored)
├── .env.example                      # Environment variable template
├── next.config.ts                    # Next.js configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json
```

---

*Last updated: September 14, 2026 — Admin Panel v1.x, Phase 6 (Usage Dashboard) included.*
