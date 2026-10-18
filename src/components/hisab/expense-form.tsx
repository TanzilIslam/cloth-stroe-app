"use client"

// Expense in 2 taps: category icon → amount (numpad) → save.
import { useState } from "react"

import { applyNumpadKey, Numpad } from "@/components/shared/numpad"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/types"

import { EXPENSE_META } from "./expense-meta"

export interface ExpenseValues {
  category: ExpenseCategory
  amount: number
  note: string | null
}

interface ExpenseFormProps {
  onSubmit: (values: ExpenseValues) => Promise<void>
}

export function ExpenseForm({ onSubmit }: ExpenseFormProps) {
  const [category, setCategory] = useState<ExpenseCategory | null>(null)
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (!category) return
    setPending(true)
    setError(null)
    try {
      await onSubmit({
        category,
        amount: Number(amount),
        note: note.trim() || null,
      })
      setCategory(null)
      setAmount("")
      setNote("")
    } catch (err) {
      setError((err as Error).message)
    }
    setPending(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-5 gap-2">
        {EXPENSE_CATEGORIES.map((c) => {
          const { label, icon: Icon } = EXPENSE_META[c]
          return (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-2 text-xs",
                category === c && "border-primary bg-accent font-medium"
              )}
            >
              <Icon className="size-6" />
              {label}
            </button>
          )
        })}
      </div>

      {category && (
        <>
          <p className="text-center text-3xl font-semibold tabular-nums">
            ৳{amount || "0"}
          </p>
          <Numpad onKey={(k) => setAmount(applyNumpadKey(amount, k, 7))} />
          <Input
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button disabled={pending || Number(amount) <= 0} onClick={save}>
            {pending ? "Saving…" : "Save expense"}
          </Button>
        </>
      )}
    </div>
  )
}
