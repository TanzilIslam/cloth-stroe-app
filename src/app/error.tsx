"use client"

// Catches unexpected render errors anywhere in the app.
import { LoadError } from "@/components/shared/load-state"

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <LoadError
        message={error.message || "Something went wrong."}
        onRetry={retry}
      />
    </main>
  )
}
