"use client"

// POS cart state: add / remove items, set qty, discount, totals.
import { useMemo, useReducer } from "react"

import type {
  ProductVariant,
  ProductWithVariants,
  SaleItemInput,
} from "@/types"

export interface CartItem {
  key: string
  product: ProductWithVariants
  variant: ProductVariant | null
  qty: number // negative = return
  price: number
}

interface CartState {
  items: CartItem[]
  discount: number
}

type Action =
  | {
      type: "add"
      product: ProductWithVariants
      variant: ProductVariant | null
      qty: number
    }
  | { type: "setQty"; key: string; qty: number }
  | { type: "remove"; key: string }
  | { type: "discount"; amount: number }
  | { type: "clear" }

const itemKey = (productId: number, variantId: number | null) =>
  `${productId}:${variantId ?? 0}`

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "add": {
      const key = itemKey(action.product.id, action.variant?.id ?? null)
      const existing = state.items.find((i) => i.key === key)
      const items = existing
        ? state.items.map((i) =>
            i.key === key ? { ...i, qty: i.qty + action.qty } : i
          )
        : [
            ...state.items,
            {
              key,
              product: action.product,
              variant: action.variant,
              qty: action.qty,
              price: action.product.sellPrice,
            },
          ]
      return { ...state, items: items.filter((i) => i.qty !== 0) }
    }
    case "setQty":
      return {
        ...state,
        items: state.items
          .map((i) => (i.key === action.key ? { ...i, qty: action.qty } : i))
          .filter((i) => i.qty !== 0),
      }
    case "remove":
      return {
        ...state,
        items: state.items.filter((i) => i.key !== action.key),
      }
    case "discount":
      return { ...state, discount: Math.max(0, action.amount) }
    case "clear":
      return { items: [], discount: 0 }
  }
}

export function useCart() {
  const [state, dispatch] = useReducer(reducer, { items: [], discount: 0 })

  return useMemo(() => {
    const subtotal = state.items.reduce((s, i) => s + i.qty * i.price, 0)
    const total = subtotal - state.discount
    const toInput = (): SaleItemInput[] =>
      state.items.map((i) => ({
        productId: i.product.id,
        variantId: i.variant?.id ?? null,
        qty: i.qty,
        price: i.price,
      }))

    return {
      items: state.items,
      discount: state.discount,
      subtotal,
      total,
      count: state.items.length,
      /** Qty already in the cart for a product / variant. */
      qtyOf: (productId: number, variantId: number | null) =>
        state.items.find((i) => i.key === itemKey(productId, variantId))?.qty ??
        0,
      add: (
        product: ProductWithVariants,
        variant: ProductVariant | null,
        qty: number
      ) => dispatch({ type: "add", product, variant, qty }),
      setQty: (key: string, qty: number) =>
        dispatch({ type: "setQty", key, qty }),
      remove: (key: string) => dispatch({ type: "remove", key }),
      setDiscount: (amount: number) => dispatch({ type: "discount", amount }),
      clear: () => dispatch({ type: "clear" }),
      toInput,
    }
  }, [state])
}

export type Cart = ReturnType<typeof useCart>
