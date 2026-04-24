import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-full" />
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Chart 1 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
          <Skeleton className="h-[300px] w-full" />
        </Card>

        {/* Chart 2 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
          <Skeleton className="h-[300px] w-full" />
        </Card>
      </div>

      {/* Table */}
      <Card className="p-6">
        <Skeleton className="h-6 w-40 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full max-w-xs" />
                <Skeleton className="h-3 w-full max-w-sm" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
