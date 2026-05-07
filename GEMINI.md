# Admin Panel Standards & Instructions

## 🎯 Purpose
The Admin Panel is a comprehensive management dashboard for the CodeSwayam platform. It provides system administrators with tools for user management, platform analytics, system configuration, and health monitoring.

## 🛠 Tech Stack
- **Framework**: Next.js 16 (App Router), React 19
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Tables**: TanStack Table (@tanstack/react-table)
- **Editor**: Tiptap (for content management)
- **Charts**: Recharts
- **Styling**: Tailwind CSS, Radix UI, @codeswayam/ui
- **Validation**: React Hook Form, Zod

## 📂 Key Directories & Files
- `src/app`: Next.js App Router pages (Dashboard, Users, Analytics, Reports, Settings).
- `src/components`: Local UI components.
    - `dashboard/`: Stats cards, charts, summaries.
    - `users/`: User tables, forms, and dialogs.
    - `layout/`: Admin-specific sidebar and header.
- `src/lib`: Local utilities, custom hooks (`useUsers`, `useAnalytics`), and API client logic.

## 📐 Local Conventions
- **Data Tables**: Use `@tanstack/react-table` for all data listing. Follow the pattern in `components/users/user-table.tsx`.
- **Analytics**: Use the shared components in `components/dashboard/charts.tsx` for consistency.
- **Permissions**: Use the `ProtectedRoute` component and `hasPermission` utility from `lib/` to gate features.
- **Port**: This application runs on port **3002**.

## 🔄 Specific Workflows
- **Development**: `npm run dev` (starts on port 3002).
- **Building**: `npm run build`.
- **Testing**: `npm test`.

## 🔐 Environment Variables
- `NEXT_PUBLIC_API_BASE_URL`: Base URL for the Core API (default: http://localhost:3000).
- `NEXT_PUBLIC_AUTH_SERVICE_URL`: URL for the Auth Service (default: http://localhost:3003).
- `NEXT_PUBLIC_DASHBOARD_REFRESH_INTERVAL`: Interval for data polling (e.g., 30000).
- `NEXT_PUBLIC_ENABLE_ADVANCED_ANALYTICS`: Feature flag for analytics features.
