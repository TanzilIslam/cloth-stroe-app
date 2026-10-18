// Shared loading and error states for pages.
import { RotateCw, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label={label}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary" />
      ))}
    </div>
  )
}

interface LoadErrorProps {
  message?: string
  onRetry: () => void
}

export function LoadError({ message, onRetry }: LoadErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center"
    >
      <TriangleAlert className="size-6 text-destructive" />
      <p className="text-sm">{message ?? "Could not load data."}</p>
      <Button variant="outline" onClick={onRetry}>
        <RotateCw /> Try again
      </Button>
    </div>
  )
}

/** First error among queries, and a retry that reloads them all. */
export function queryStatus(
  ...queries: { error: Error | null; reload: () => void }[]
) {
  const error = queries.find((q) => q.error)?.error ?? null
  return { error, retry: () => queries.forEach((q) => q.reload()) }
}
