import { Skeleton } from "@/components/ui/skeleton";

export function WidgetSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3">
      {/* Skeleton for Summary stats */}
      <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/60 bg-background/60 p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-2 w-10" />
          </div>
        ))}
      </div>

      {/* Skeleton for Progress bar */}
      <Skeleton className="h-1.5 w-full rounded-full" />

      {/* Skeleton for List items */}
      <div className="flex-1 overflow-hidden rounded-xl border border-border/60 bg-background/60 p-2 space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg border border-border/40 px-2 py-2.5 bg-card animate-pulse">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SimpleWidgetSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-1">
      <Skeleton className="h-8 w-full rounded-lg" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
