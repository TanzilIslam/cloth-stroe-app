"use client"

// Receive from a customer or pay a supplier against their balance.
import { useState } from "react"

import { Money } from "@/components/shared/money"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PAYMENT_LABELS, type DueRow, type PaymentInput } from "@/types"

export type PaymentValues = Pick<PaymentInput, "amount" | "method">

interface PaymentFormProps {
  row: DueRow
  onSubmit: (values: PaymentValues) => Promise<void>
}

export function PaymentForm({ row, onSubmit }: PaymentFormProps) {
  const [amount, setAmount] = useState(String(row.amount))
  const [method, setMethod] = useState<PaymentValues["method"]>("cash")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const value = Number(amount)
  const valid = value > 0 && value <= row.amount

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      await onSubmit({ amount: value, method })
    } catch (err) {
      setError((err as Error).message)
    }
    setPending(false)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Balance{" "}
        <Money amount={row.amount} className="font-medium text-foreground" />
      </p>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Amount ৳
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          max={row.amount}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        {(["cash", "bKash"] as const).map((m) => (
          <Button
            key={m}
            type="button"
            variant={method === m ? "default" : "outline"}
            onClick={() => setMethod(m)}
          >
            {PAYMENT_LABELS[m]}
          </Button>
        ))}
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={!valid || pending}>
        {pending
          ? "Saving…"
          : row.partyType === "customer"
            ? "Receive payment"
            : "Pay supplier"}
      </Button>
    </form>
  )
}
