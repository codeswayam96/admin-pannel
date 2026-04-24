import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function FormSkeleton() {
  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Form Title */}
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>

        {/* Form Fields */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" /> {/* Label */}
            <Skeleton className="h-10 w-full rounded-lg" /> {/* Input */}
            {i === 2 && <Skeleton className="h-3 w-48" />} {/* Help text */}
          </div>
        ))}

        {/* Large Text Area */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>

        {/* Checkbox/Radio group */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
    </Card>
  );
}
