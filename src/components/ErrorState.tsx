import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
        <AlertTriangle size={22} className="text-red-500" />
      </div>
      <div className="text-center">
        <p className="font-medium text-foreground">Something went wrong</p>
        <p className="text-sm mt-1 max-w-sm">{error}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw size={14} /> Try Again
        </Button>
      )}
    </div>
  );
}
