"use client"

// Payment: cash / bKash / due, paid amount (rest = due), change, customer.
import { useState } from "react"

import { Money } from "@/components/shared/money"
import { applyNumpadKey, Numpad } from "@/components/shared/numpad"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PAYMENT_LABELS,
  PAYMENT_METHODS,
  type Customer,
  type ID,
  type PaymentMethod,
} from "@/types"

export interface Payment {
  method: PaymentMethod
  paid: number
  customerId: ID | null
}

interface PayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Amount to pay after discount. Negative = refund. */
  total: number
  customers: Customer[]
  onAddCustomer: (name: string, phone: string) => Promise<Customer>
  onConfirm: (payment: Payment) => Promise<void>
}

const METHODS = PAYMENT_METHODS.map((value) => ({
  value,
  label: PAYMENT_LABELS[value],
}))

export function PayDialog(props: PayDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[95svh] max-w-sm overflow-y-auto">
        {/* Remount on open so every sale starts fresh */}
        {props.open && <PayForm {...props} />}
      </DialogContent>
    </Dialog>
  )
}

function PayForm({
  total,
  customers,
  onAddCustomer,
  onConfirm,
}: PayDialogProps) {
  const [method, setMethod] = useState<PaymentMethod>("cash")
  const [tendered, setTendered] = useState("")
  const [customerId, setCustomerId] = useState<ID | null>(null)
  const [newCustomer, setNewCustomer] = useState<{
    name: string
    phone: string
  } | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refund = total < 0
  const given =
    method === "due" ? 0 : tendered === "" ? total : Number(tendered)
  const paid = refund ? total : Math.min(given, total)
  const due = refund ? 0 : total - paid
  const change = method === "cash" && given > total ? given - total : 0
  const needsCustomer = due > 0 && !customerId

  async function addCustomer() {
    if (!newCustomer?.name.trim()) return
    const c = await onAddCustomer(
      newCustomer.name.trim(),
      newCustomer.phone.trim()
    )
    setCustomerId(c.id)
    setNewCustomer(null)
  }

  async function confirm() {
    setPending(true)
    setError(null)
    try {
      await onConfirm({
        method: refund ? "cash" : paid === 0 ? "due" : method,
        paid,
        customerId,
      })
    } catch (e) {
      setError((e as Error).message)
      setPending(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{refund ? "Refund" : "Payment"}</DialogTitle>
        <DialogDescription>
          {refund ? "Give back" : "Total"} <Money amount={Math.abs(total)} />
        </DialogDescription>
      </DialogHeader>

      {!refund && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <Button
                key={m.value}
                variant={method === m.value ? "default" : "outline"}
                onClick={() => setMethod(m.value)}
              >
                {m.label}
              </Button>
            ))}
          </div>

          {method !== "due" && (
            <>
              <p className="text-center text-3xl font-semibold tabular-nums">
                ৳{tendered || total}
              </p>
              <Numpad
                onKey={(k) => setTendered(applyNumpadKey(tendered, k, 8))}
              />
            </>
          )}

          <div className="flex flex-col gap-1 text-sm">
            {change > 0 && (
              <p className="flex justify-between font-medium">
                <span>Change</span> <Money amount={change} />
              </p>
            )}
            {due > 0 && (
              <p className="flex justify-between font-medium text-destructive">
                <span>Due</span> <Money amount={due} />
              </p>
            )}
          </div>

          {due > 0 &&
            (newCustomer ? (
              <div className="flex flex-col gap-2">
                <Input
                  placeholder="Customer name"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                />
                <Input
                  placeholder="Phone"
                  inputMode="tel"
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, phone: e.target.value })
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setNewCustomer(null)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={addCustomer}>Save customer</Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Select
                  value={customerId ? String(customerId) : ""}
                  onValueChange={(v) => setCustomerId(Number(v))}
                >
                  <SelectTrigger className="flex-1" aria-label="Customer">
                    <SelectValue placeholder="Pick customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} · {c.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => setNewCustomer({ name: "", phone: "" })}
                >
                  New
                </Button>
              </div>
            ))}
        </>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button
        disabled={pending || needsCustomer || !!newCustomer}
        onClick={confirm}
      >
        {pending ? "Saving…" : refund ? "Confirm refund" : "Confirm sale"}
      </Button>
    </>
  )
}
