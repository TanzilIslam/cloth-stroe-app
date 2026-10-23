"use client"

// Product button for quick sell: name, brand, price, stock left.
// Items already in the cart get a navy ring and a qty badge.
import { Money } from "@/components/shared/money"
import { cn } from "@/lib/utils"
import type { ProductWithVariants } from "@/types"

interface ProductTileProps {
  product: ProductWithVariants
  /** Stock left after what's already in the cart. */
  available: number
  /** Qty of this product in the cart (0 = not in cart). */
  inCart?: number
  disabled?: boolean
  onSelect: () => void
}

export function ProductTile({
  product,
  available,
  inCart = 0,
  disabled,
  onSelect,
}: ProductTileProps) {
  const low = available <= product.lowStockAt

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "relative flex min-h-28 flex-col items-start justify-between surface p-3 text-left transition-shadow hover:shadow-sm active:bg-accent disabled:opacity-50",
        inCart !== 0 && "border-primary ring-1 ring-primary"
      )}
    >
      {inCart !== 0 && (
        <span className="absolute top-2 right-2 rounded-full bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground tabular-nums">
          ×{Math.abs(inCart)}
        </span>
      )}
      <div className={cn(inCart !== 0 && "pr-8")}>
        <p className="line-clamp-2 leading-tight font-medium">{product.name}</p>
        {product.brand && (
          <p className="text-[0.8125rem] text-muted-foreground">
            {product.brand}
          </p>
        )}
      </div>
      <div className="flex w-full items-end justify-between gap-2">
        <Money amount={product.sellPrice} className="font-semibold" />
        <span
          className={cn(
            "text-[0.8125rem]",
            low ? "font-medium text-destructive" : "text-muted-foreground"
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
