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
    <ul className="flex flex-col divide-y rounded-lg border">
      {sales.map((s) => {
        const net = s.total - s.discount
        const [first, ...rest] = s.items
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelect(s)}
              className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-accent"
            >
              <span className="w-16 shrink-0 text-sm text-muted-foreground tabular-nums">
                {formatTime(s.createdAt)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {first?.productName}
                  {rest.length > 0 && (
                    <span className="text-muted-foreground">
                      {" "}
                      +{rest.length}
                    </span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {[s.customerName, s.userName].filter(Boolean).join(" · ")}
                </span>
              </span>
              {net < 0 ? (
                <Badge variant="destructive">Return</Badge>
              ) : s.due > 0 ? (
                <Badge variant="outline">Due</Badge>
              ) : (
                <Badge variant="secondary">{PAYMENT_LABELS[s.method]}</Badge>
              )}
              <Money amount={net} className="w-20 text-right font-semibold" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
