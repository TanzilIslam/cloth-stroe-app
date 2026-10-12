"use client"

// Cash check: opening + today's cash flows = expected; enter counted cash.
import { CheckCircle2, TriangleAlert } from "lucide-react"
import { useState } from "react"

import { Money } from "@/components/shared/money"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { CashSummary } from "@/types"

interface CashCountFormProps {
  summary: CashSummary
  onSubmit: (values: { expected: number; counted: number }) => Promise<void>
}

export function CashCountForm({ summary, onSubmit }: CashCountFormProps) {
  const [opening, setOpening] = useState(String(summary.lastCounted ?? 0))
  const [counted, setCounted] = useState("")
  const [pending, setPending] = useState(false)

  const expected =
    Number(opening || 0) +
    summary.cashSales +
    summary.cashIn -
    summary.expenses -
    summary.cashOut
  const diff = counted === "" ? null : Number(counted) - expected

  const lines = [
    { label: "Cash sales", value: summary.cashSales },
    { label: "Dues received", value: summary.cashIn },
    { label: "Expenses", value: -summary.expenses },
    { label: "Paid out", value: -summary.cashOut },
  ]

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    await onSubmit({ expected, counted: Number(counted) })
    setCounted("")
    setPending(false)
  }

  return (
    <form onSubmit={submit} className="flex max-w-md flex-col gap-3">
      <label className="flex items-center justify-between gap-4 text-sm font-medium">
        Opening cash ৳
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          className="w-32 text-right"
          value={opening}
          onChange={(e) => setOpening(e.target.value)}
        />
      </label>
      <ul className="flex flex-col gap-1 text-sm">
        {lines.map((l) => (
          <li key={l.label} className="flex justify-between">
            <span className="text-muted-foreground">{l.label}</span>
            <Money amount={l.value} />
          </li>
        ))}
      </ul>
      <p className="flex justify-between border-t pt-2 font-semibold">
        <span>Expected in drawer</span>
        <Money amount={expected} />
      </p>
      <label className="flex items-center justify-between gap-4 text-sm font-medium">
        Counted cash ৳
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          className="h-12 w-32 text-right text-lg"
          value={counted}
          onChange={(e) => setCounted(e.target.value)}
        />
      </label>
      {diff !== null && (
        <p
          className={cn(
            "flex items-center gap-2 rounded-md p-2 text-sm font-medium",
            diff === 0 ? "bg-secondary" : "bg-destructive/10 text-destructive"
          )}
          role="status"
        >
          {diff === 0 ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <TriangleAlert className="size-4" />
          )}
          {diff === 0 ? "Matched" : diff < 0 ? "Short" : "Over"}{" "}
          {diff !== 0 && <Money amount={Math.abs(diff)} />}
        </p>
      )}
      <Button type="submit" size="lg" disabled={counted === "" || pending}>
        {pending ? "Saving…" : "Save cash count"}
      </Button>
    </form>
  )
}
