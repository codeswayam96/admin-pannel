import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function ChartSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" /> {/* Time range selector */}
      </div>

      {/* Chart Area */}
      <div className="space-y-3">
        <Skeleton className="h-[300px] w-full rounded-lg" />

        {/* Legend */}
        <div className="flex justify-center gap-6 pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function ChartGridSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <ChartSkeleton key={i} />
      ))}
    </div>
  );
}
