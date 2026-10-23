"use client"

// Current sale: items (+/- qty, remove), discount, total and Pay button.
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { Money } from "@/components/shared/money"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Cart as CartState, CartItem } from "@/hooks/use-cart"
import { variantLabel } from "@/lib/utils"

interface CartProps {
  cart: CartState
  onPay: () => void
}

function stockOf(item: CartItem) {
  return item.variant ? item.variant.stockQty : item.product.stockQty
}

export function Cart({ cart, onPay }: CartProps) {
  if (cart.count === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Cart is empty"
        hint="Tap a product to add it"
        className="flex-1"
      />
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <ul className="-mx-1 flex min-h-0 flex-1 flex-col divide-y overflow-y-auto px-1">
        {cart.items.map((item) => {
          const step = item.product.unit === "piece" ? 1 : 0.5
          const sign = Math.sign(item.qty)
          const abs = Math.abs(item.qty)
          const canAdd = sign < 0 || abs + step <= stockOf(item)

          return (
            <li key={item.key} className="flex flex-col gap-2 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.product.name}</p>
                  <p className="text-[0.8125rem] text-muted-foreground">
                    {item.variant && variantLabel(item.variant) + " · "}
                    <Money amount={item.price} /> / {item.product.unit}
                  </p>
                </div>
                {sign < 0 && <Badge variant="destructive">Return</Badge>}
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Decrease"
                    onClick={() => cart.setQty(item.key, sign * (abs - step))}
                  >
                    <Minus />
                  </Button>
                  <span className="w-12 text-center tabular-nums">{abs}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Increase"
                    disabled={!canAdd}
                    onClick={() => cart.setQty(item.key, sign * (abs + step))}
                  >
                    <Plus />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove"
                    onClick={() => cart.remove(item.key)}
                  >
                    <Trash2 />
                  </Button>
                </div>
                <Money amount={item.qty * item.price} className="font-medium" />
              </div>
            </li>
          )
        })}
      </ul>

      <div className="flex flex-col gap-2 border-t pt-3 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <Money amount={cart.subtotal} />
        </div>
        <label className="flex items-center justify-between gap-4">
          <span>Discount</span>
          <span className="relative">
            <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground">
              ৳
            </span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              className="h-9 w-32 pl-6 text-right"
              value={cart.discount || ""}
              placeholder="None"
              onChange={(e) => cart.setDiscount(Number(e.target.value))}
            />
          </span>
        </label>
        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <Money amount={cart.total} />
        </div>
      </div>

      <Button size="lg" className="h-12 text-base" onClick={onPay}>
        {cart.total < 0 ? "Refund" : "Pay"}{" "}
        <Money amount={Math.abs(cart.total)} />
      </Button>
    </div>
  )
}
