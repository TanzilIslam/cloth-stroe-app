// Low stock with suggested reorder qty, and dead stock (not sold 60+ days).
import { Button } from "@/components/ui/button"
import { daysSince } from "@/lib/calc"
import type { DeadStockRow, ID, LowStockRow } from "@/types"
import { variantLabel } from "@/lib/utils"

interface StockAlertsProps {
  lowStock: LowStockRow[]
  deadStock: DeadStockRow[]
  onRestock: (productId: ID, variantId: ID | null, qty: number) => void
}

export function StockAlerts({
  lowStock,
  deadStock,
  onRestock,
}: StockAlertsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section>
        <h3 className="mb-2 font-semibold">
          Low stock{" "}
          <span className="font-normal text-muted-foreground">
            ({lowStock.length})
          </span>
        </h3>
        <ul className="flex flex-col divide-y surface">
          {lowStock.length === 0 && (
            <li className="p-3 text-sm text-muted-foreground">
              All stocked up
            </li>
          )}
          {lowStock.map(({ product, variant, stock, reorderQty }) => (
            <li
              key={`${product.id}:${variant?.id ?? 0}`}
              className="flex items-center justify-between gap-3 p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {product.name}
                  {variant && (
                    <span className="text-muted-foreground">
                      {" "}
                      · {variantLabel(variant)}
                    </span>
                  )}
                </p>
                <p className="text-sm text-destructive">
                  {stock} {product.unit} left · reorder {reorderQty}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onRestock(product.id, variant?.id ?? null, reorderQty)
                }
              >
                Stock in
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 font-semibold">
          Dead stock{" "}
          <span className="font-normal text-muted-foreground">
            ({deadStock.length})
          </span>
        </h3>
        <ul className="flex flex-col divide-y surface">
          {deadStock.length === 0 && (
            <li className="p-3 text-sm text-muted-foreground">
              Everything sold in the last 60 days
            </li>
          )}
          {deadStock.map(({ product, stock, lastSoldAt }) => (
            <li key={product.id} className="flex justify-between gap-3 p-3">
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">
                  {stock} {product.unit} in stock
                </p>
              </div>
              <p className="text-right text-sm text-muted-foreground">
                {lastSoldAt ? `${daysSince(lastSoldAt)} days` : "Never sold"}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
