// Expense rows: category, note, date, amount. Delete button for owner.
import { Trash2 } from "lucide-react"

import { Money } from "@/components/shared/money"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import type { Expense, ID } from "@/types"

import { EXPENSE_META } from "./expense-meta"

interface ExpenseListProps {
  expenses: Expense[]
  onDelete?: (id: ID) => void
  empty?: string
}

export function ExpenseList({
  expenses,
  onDelete,
  empty = "No expenses",
}: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">{empty}</p>
    )
  }

  return (
    <ul className="flex flex-col divide-y rounded-lg border">
      {expenses.map((e) => {
        const { label, icon: Icon } = EXPENSE_META[e.category]
        return (
          <li key={e.id} className="flex items-center gap-3 px-3 py-2">
            <Icon className="size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{label}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[formatDate(e.date), e.note].filter(Boolean).join(" · ")}
              </p>
            </div>
            <Money amount={e.amount} className="font-medium" />
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete expense"
                onClick={() => onDelete(e.id)}
              >
                <Trash2 />
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
