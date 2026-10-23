// One day's sales: time, items, method and total. Tap a row for details.
import { Money } from "@/components/shared/money"
import { Badge } from "@/components/ui/badge"
import { formatTime } from "@/lib/utils"
import { PAYMENT_LABELS, type SaleDetail } from "@/types"

interface SaleListProps {
  sales: SaleDetail[]
  onSelect: (sale: SaleDetail) => void
}

export function SaleList({ sales, onSelect }: SaleListProps) {
  if (sales.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No sales this day
      </p>
    )
  }

  return (
    <ul className="flex flex-col divide-y surface">
      {sales.map((s) => {
        const net = s.total - s.discount
        const [first, ...rest] = s.items
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelect(s)}
              className="flex w-full flex-col gap-1 px-3 py-3 text-left hover:bg-accent"
            >
              <span className="flex w-full items-baseline justify-between gap-3">
                <span className="min-w-0 truncate font-medium">
                  {first?.productName}
                  {rest.length > 0 && (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      +{rest.length} more
                    </span>
                  )}
                </span>
                <Money amount={net} className="shrink-0 font-semibold" />
              </span>
              <span className="flex w-full items-center justify-between gap-3 text-[0.8125rem] text-muted-foreground">
                <span className="min-w-0 truncate tabular-nums">
                  {[formatTime(s.createdAt), s.userName, s.customerName]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                {net < 0 ? (
                  <Badge variant="destructive">Return</Badge>
                ) : s.due > 0 ? (
                  <Badge className="border-transparent bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                    Due
                  </Badge>
                ) : (
                  <Badge variant="secondary">{PAYMENT_LABELS[s.method]}</Badge>
                )}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
