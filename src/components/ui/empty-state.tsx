import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    loading?: boolean
  }
  className?: string
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-8 text-center",
        className
      )}
    >
      <Icon className="h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <Button
          size="sm"
          variant="outline"
          onClick={action.onClick}
          disabled={action.loading}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

export { EmptyState }