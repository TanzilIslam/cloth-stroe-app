"use client"

// After tapping a tile: pick a variant (if any), then qty → added to cart.
import { useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { ProductVariant, ProductWithVariants } from "@/types"

import { QtyChips } from "./qty-chips"

interface AddItemDialogProps {
  product: ProductWithVariants | null
  returnMode: boolean
  /** Qty already in the cart for a product / variant. */
  inCart: (productId: number, variantId: number | null) => number
  onAdd: (variant: ProductVariant | null, qty: number) => void
  onClose: () => void
}

export function AddItemDialog({
  product: openProduct,
  returnMode,
  inCart,
  onAdd,
  onClose,
}: AddItemDialogProps) {
  const [variantId, setVariantId] = useState<number | null>(null)
  // Keep showing the last product while the dialog fades out
  const [lastProduct, setLastProduct] = useState(openProduct)
  if (openProduct && openProduct !== lastProduct) setLastProduct(openProduct)
  const product = openProduct ?? lastProduct

  const variant = product?.variants.find((v) => v.id === variantId) ?? null
  const needsVariant = !!product?.hasVariants && !variant
  const stock = variant ? variant.stockQty : (product?.stockQty ?? 0)
  const max = returnMode
    ? undefined
    : stock - (product ? inCart(product.id, variant?.id ?? null) : 0)

  function close() {
    setVariantId(null)
    onClose()
  }

  return (
    <Dialog open={!!openProduct} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{product?.name}</DialogTitle>
          <DialogDescription>
            {returnMode
              ? "Return qty"
              : needsVariant
                ? "Pick size / color"
                : "Pick qty"}
          </DialogDescription>
        </DialogHeader>

        {product?.hasVariants && (
          <div className="grid grid-cols-3 gap-2">
            {product.variants.map((v) => {
              const left = v.stockQty - inCart(product.id, v.id)
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={!returnMode && left <= 0}
                  onClick={() => setVariantId(v.id)}
                  className={cn(
                    "rounded-lg border p-2 text-sm disabled:opacity-40",
                    v.id === variantId && "border-primary bg-accent"
                  )}
                >
                  <span className="block font-medium">
                    {[v.size, v.color].filter(Boolean).join(" · ")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {left} left
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {product && !needsVariant && (
          <QtyChips
            key={variant?.id ?? 0}
            unit={product.unit}
            max={max}
            onPick={(qty) => {
              onAdd(variant, returnMode ? -qty : qty)
              close()
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
