# Admin Panel - Dashboard & Management

## Overview

**Admin Panel** is a comprehensive administrative dashboard for managing the CodeSwayam platform. It provides system administrators with powerful tools for user management, analytics, system configuration, and platform monitoring. Built with **Next.js** and modern UI libraries, it delivers an intuitive and responsive admin experience.

---

## 🎯 Key Features

- **User Management**: Create, edit, delete users; manage roles and permissions
- **Analytics Dashboard**: Real-time platform statistics and insights
- **Content Management**: Manage platform content and resources
- **System Monitoring**: Monitor system health and performance
- **Reports & Export**: Generate and download reports
- **Activity Logs**: Track all platform activities
- **Configuration Panel**: System settings and configuration
- **Role & Permissions**: Manage admin roles and access levels
- **Search & Filter**: Advanced search and filtering capabilities
- **Responsive Design**: Works on desktop and tablet

---

## 🛠️ Tech Stack

### Frontend Framework
- **Framework**: Next.js 16.x (React 19.x)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, @codeswayam/ui

### Data Management
- **Data Fetching**: TanStack React Query (React Query)
- **Data Tables**: @tanstack/react-table for complex tables
- **Forms**: React Hook Form, Zod
- **HTTP Client**: Axios

### Key Libraries
- **Toast Notifications**: Sonner
- **Icons**: Lucide React
- **UI Components**: Radix UI
- **Utilities**: clsx, tailwind-merge

---

## 📋 Prerequisites

- **Node.js**: v18 or higher
- **npm**: v11.6.2+
- **Admin Access**: Backend admin privileges

---

## 🔧 Installation & Setup

### 1. Install Dependencies

```bash
# From root directory
npm install

# Or from admin-panel directory
cd apps/admin-panel
npm install
```

### 2. Environment Variables

Create `.env.local` file in the `apps/admin-panel` directory:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_TIMEOUT=10000

# Feature Flags
NEXT_PUBLIC_ENABLE_ADVANCED_ANALYTICS=true
NEXT_PUBLIC_ENABLE_USER_EXPORT=true

# Dashboard Configuration
NEXT_PUBLIC_DASHBOARD_REFRESH_INTERVAL=30000  # 30 seconds

# Authentication
NEXT_PUBLIC_AUTH_SERVICE_URL=http://localhost:3003
```

---

## 🚀 Running the Application

### Development Mode

```bash
# Start development server
npm run dev

# Access at http://localhost:3002
```

### Build for Production

```bash
# Create optimized build
npm run build

# Test production build locally
npm run start

# Access at http://localhost:3002
```

---

## 📁 Project Structure

```
apps/admin-panel/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Dashboard home
│   ├── globals.css             # Global styles
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Main dashboard
│   │   ├── analytics/          # Analytics pages
│   │   ├── users/              # User management
│   │   ├── content/            # Content management
│   │   ├── reports/            # Reports section
│   │   ├── settings/           # System settings
│   │   └── logs/               # Activity logs
│   └── api/                    # API routes
├── components/
│   ├── layout/
│   │   ├── header.tsx          # Top header
│   │   ├── sidebar.tsx         # Side navigation
│   │   └── footer.tsx
│   ├── dashboard/
│   │   ├── stats-card.tsx      # Statistics cards
│   │   ├── charts.tsx          # Chart components
│   │   └── summary.tsx
│   ├── users/
│   │   ├── user-table.tsx      # User data table
│   │   ├── user-form.tsx       # User edit form
│   │   └── user-dialog.tsx
│   ├── common/                 # Reusable components
│   └── ui/                     # UI primitives
├── lib/
│   ├── api.ts                  # Admin API client
│   ├── hooks/                  # Custom hooks
│   │   ├── useUsers.ts
│   │   ├── useAnalytics.ts
│   │   └── usePermissions.ts
│   ├── utils.ts                # Utilities
│   └── constants.ts            # Constants
├── public/
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

---

## 📝 Available Scripts

```bash
# Development
npm run dev              # Start dev server at port 3002
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
```

---

## 📊 Dashboard Features

### Main Dashboard
- **Key Metrics**: Active users, revenue, platform health
- **Charts**: User growth, revenue trends
- **Recent Activities**: Latest system events
- **Quick Actions**: Common admin tasks

### User Management
- **User List**: Paginated table with sorting/filtering
- **User Details**: View complete user information
- **Edit User**: Update user information
- **Change Role**: Modify user permissions
- **Bulk Actions**: Select multiple users for actions
- **User Search**: Search by name, email, ID

### Analytics
- **User Analytics**: Growth, retention, engagement
- **Revenue Analytics**: Payment trends, MRR
- **System Health**: Performance metrics
- **Custom Reports**: Date range and metric selection

### Content Management
- **Pages**: Manage website content
- **Resources**: Manage downloadable resources
- **Media**: Manage images and files
- **Publish/Unpublish**: Control content visibility

### System Settings
- **General Settings**: Site configuration
- **Email Settings**: Email template configuration
- **Payment Settings**: Stripe/Razorpay config
- **Security Settings**: Security policies

### Activity Logs
- **Action Log**: All system actions
- **User Actions**: Track user activities
- **Admin Actions**: Monitor admin activities
- **Exports**: Download logs as CSV/JSON

---

## 🔐 Authentication & Authorization

### Admin Authentication
```typescript
// Protected routes require admin role
<ProtectedRoute requiredRole="admin">
  <AdminPanel />
</ProtectedRoute>
```

### Permission Checks
```typescript
// Check specific permissions
if (hasPermission('users:create')) {
  // Show create button
}
```

---

## 📊 Data Tables

### User Table Example
```typescript
const columns = [
  {
    accessorKey: "id",
    header: "ID"
  },
  {
    accessorKey: "email",
    header: "Email"
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => <RoleBadge role={row.getValue("role")} />
  },
  // ... more columns
]

<DataTable
  columns={columns}
  data={users}
  pagination
  filtering
  sorting
/>
```

---

## 📈 Analytics Integration

### Using Chart Components
```typescript
import { LineChart, BarChart } from '@/components/charts'

<LineChart
  data={userGrowthData}
  xAxis="date"
  yAxis="count"
  title="User Growth"
/>
```

---

## 🔌 API Integration

### Admin Endpoints
- `GET /admin/users` - List all users with pagination
- `GET /admin/users/:id` - Get user details
- `PATCH /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Delete user
- `POST /admin/users` - Create new user
- `GET /admin/analytics` - Get analytics data
- `GET /admin/logs` - Get activity logs
- `GET /admin/settings` - Get system settings
- `PATCH /admin/settings` - Update settings

---

## 📋 Common Admin Tasks

### Creating Users
1. Navigate to Users section
2. Click "Add User"
3. Fill in user details
4. Select role/permissions
5. Click Create

### Viewing Analytics
1. Go to Analytics section
2. Select date range
3. Choose metrics
4. View charts and data
5. Export report

### Managing Permissions
1. Go to Users
2. Select user
3. Edit permissions
4. Apply changes
5. Log action

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# E2E testing
npm run test:e2e
```

---

## 🌍 Deployment

### Deploy to Vercel
```bash
npm i -g vercel
vercel
```

### Production Setup
- Set secure API base URL
- Configure authentication
- Set up analytics key
- Configure email notifications

---

## 🤝 Contributing

### Code Standards
- Follow Next.js best practices
- Use TypeScript strictly
- Write accessible components
- Include proper error handling
- Add loading states

---

## 🐛 Troubleshooting

### Permission Denied
- Verify admin role
- Check authentication token
- Verify API credentials

### Data Not Loading
- Check API endpoint
- Verify network connection
- Check error logs

### Build Errors
```bash
rm -rf .next node_modules
npm install
npm run build
```

---

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com)

---

## 📄 License

ISC License

---

**Last Updated**: April 2026

For more information, see the main [README.md](../../README.md)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
