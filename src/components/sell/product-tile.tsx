"use client"

// Product button for quick sell: name, brand, price, stock left.
import { Money } from "@/components/shared/money"
import { cn } from "@/lib/utils"
import type { ProductWithVariants } from "@/types"

interface ProductTileProps {
  product: ProductWithVariants
  /** Stock left after what's already in the cart. */
  available: number
  disabled?: boolean
  onSelect: () => void
}

export function ProductTile({
  product,
  available,
  disabled,
  onSelect,
}: ProductTileProps) {
  const low = available <= product.lowStockAt

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className="flex min-h-28 flex-col items-start justify-between rounded-lg border bg-card p-3 text-left active:bg-accent disabled:opacity-50"
    >
      <div>
        <p className="line-clamp-2 leading-tight font-medium">{product.name}</p>
        {product.brand && (
          <p className="text-xs text-muted-foreground">{product.brand}</p>
        )}
      </div>
      <div className="flex w-full items-end justify-between gap-2">
        <Money amount={product.sellPrice} className="font-semibold" />
        <span
          className={cn(
            "text-xs",
            low ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {available} {product.unit}
        </span>
      </div>
    </button>
  )
}

/** Stock for a product: sum of variants when it has them. */
export function productStock(product: ProductWithVariants) {
  return product.hasVariants
    ? product.variants.reduce((s, v) => s + v.stockQty, 0)
    : product.stockQty
}
