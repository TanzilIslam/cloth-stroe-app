"use client"

// Reusable confirm step for deletes and important actions.
// const [confirm, confirmDialog] = useConfirm()
// if (await confirm({ title: "Delete expense?", danger: true })) …
// Render {confirmDialog} once in the component.
import { useCallback, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  /** Red confirm button for destructive actions. */
  danger?: boolean
}

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void }

export function useConfirm() {
  const [pending, setPending] = useState<Pending | null>(null)

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    []
  )

  function close(ok: boolean) {
    pending?.resolve(ok)
    setPending(null)
  }

  const dialog = (
    <Dialog open={!!pending} onOpenChange={(open) => !open && close(false)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{pending?.title}</DialogTitle>
          {pending?.message && (
            <DialogDescription>{pending.message}</DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button
            variant={pending?.danger ? "destructive" : "default"}
            onClick={() => close(true)}
            autoFocus
          >
            {pending?.confirmLabel ?? "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return [confirm, dialog] as const
}
