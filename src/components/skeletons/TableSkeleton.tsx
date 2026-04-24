import { Skeleton } from '@/components/ui/skeleton';

export function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-80" /> {/* Search bar */}
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-lg" /> {/* Filter button */}
          <Skeleton className="h-10 w-32 rounded-lg" /> {/* Add button */}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        {/* Table Header Row */}
        <div className="grid grid-cols-5 gap-4 p-4 border-b bg-muted/50">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4" />
          ))}
        </div>

        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-5 gap-4 p-4 border-b last:border-0"
          >
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-4" />
            ))}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
