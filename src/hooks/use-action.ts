"use client"

// Runs a mutation with a pending flag and toasts: success message (optional)
// and the error message on failure. Use for every button that calls src/api.
import { useCallback, useState } from "react"
import { toast } from "sonner"

interface Options<T> {
  /** Toast on success; a function gets the result. Omit for no toast. */
  success?: string | ((data: T) => string)
  onDone?: (data: T) => void
}

export function useAction<A extends unknown[], T>(
  action: (...args: A) => Promise<T>,
  { success, onDone }: Options<T> = {}
) {
  const [pending, setPending] = useState(false)

  const run = useCallback(
    async (...args: A): Promise<T | undefined> => {
      setPending(true)
      try {
        const data = await action(...args)
        if (success)
          toast.success(typeof success === "function" ? success(data) : success)
        onDone?.(data)
        return data
      } catch (e) {
        toast.error((e as Error).message || "Something went wrong")
        return undefined
      } finally {
        setPending(false)
      }
    },
    [action, success, onDone]
  )

  return { run, pending }
}
