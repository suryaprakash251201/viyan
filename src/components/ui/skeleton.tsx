import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-lg bg-muted", className)}
      {...props}
    />
  )
}

function CardSkeleton({ size = "default" }: { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card-skeleton"
      data-size={size}
      className={cn(
        "flex flex-col gap-4 rounded-xl bg-card py-4 ring-1 ring-foreground/10",
        size === "sm" && "gap-3 py-3"
      )}
    >
      <div className="px-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="px-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}

function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-t border-border/60">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-2 py-2">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

function WidgetSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    </div>
  )
}

function NoteSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="flex gap-1">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  )
}

function BookmarkSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
      <Skeleton className="size-8 rounded" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-2 w-32" />
      </div>
    </div>
  )
}

function EventSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
      <Skeleton className="size-2 rounded-full" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2 w-1/3" />
      </div>
    </div>
  )
}

function TaskSkeleton() {
  return (
    <div className="flex items-center gap-2 py-1">
      <Skeleton className="size-4 rounded" />
      <Skeleton className="h-3 flex-1" />
    </div>
  )
}

export {
  Skeleton,
  CardSkeleton,
  TableRowSkeleton,
  WidgetSkeleton,
  NoteSkeleton,
  BookmarkSkeleton,
  EventSkeleton,
  TaskSkeleton,
}