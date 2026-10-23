// Empty list / panel: icon, title, optional hint, on a faint navy grid.
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  hint?: string
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  hint,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative isolate flex flex-col items-center justify-center gap-2 overflow-hidden px-4 py-10 text-center",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grid"
      />
      <span className="grid size-12 place-items-center rounded-full bg-card text-primary shadow-sm ring-1 ring-border">
        <Icon className="size-5" />
      </span>
      <p className="font-medium">{title}</p>
      {hint && <p className="max-w-xs text-sm text-muted-foreground">{hint}</p>}
    </div>
  )
}
