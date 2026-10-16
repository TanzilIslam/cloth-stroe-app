"use client"

// Stock in: product → variant → qty → cost (pre-filled) → supplier → paid.
// Staff never see cost or paid; the last cost is used for them.
import { useEffect, useState } from "react"

import { Money } from "@/components/shared/money"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ID, ProductWithVariants, PurchaseInput, Supplier } from "@/types"
import { variantLabel } from "@/lib/utils"

export type StockInValues = Omit<PurchaseInput, "shopId">

interface StockInFormProps {
  products: ProductWithVariants[]
  suppliers: Supplier[]
  isOwner: boolean
  initial?: { productId: ID; variantId: ID | null; qty?: number }
  getLastCost: (productId: ID, variantId: ID | null) => Promise<number>
  onSubmit: (values: StockInValues) => Promise<void>
}

export function StockInForm({
  products,
  suppliers,
  isOwner,
  initial,
  getLastCost,
  onSubmit,
}: StockInFormProps) {
  const [productId, setProductId] = useState<ID | null>(
    initial?.productId ?? null
  )
  const [variantId, setVariantId] = useState<ID | null>(
    initial?.variantId ?? null
  )
  const [qty, setQty] = useState(initial?.qty ? String(initial.qty) : "")
  const [cost, setCost] = useState("")
  const [supplierId, setSupplierId] = useState<ID | null>(
    suppliers[0]?.id ?? null
  )
  const [paid, setPaid] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const product = products.find((p) => p.id === productId)
  const needsVariant = !!product?.hasVariants && !variantId

  // Pre-fill cost from the last stock in (owner only)
  function prefillCost(pid: ID, vid: ID | null) {
    if (isOwner) getLastCost(pid, vid).then((c) => setCost(String(c)))
  }

  useEffect(() => {
    if (initial) prefillCost(initial.productId, initial.variantId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const total = Number(qty || 0) * Number(cost || 0)
  const valid = product && !needsVariant && Number(qty) > 0 && supplierId

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    setPending(true)
    setError(null)
    try {
      await onSubmit({
        productId: product.id,
        variantId,
        supplierId,
        qty: Number(qty),
        cost: isOwner ? Number(cost) : null,
        paid: isOwner ? Number(paid || 0) : 0,
      })
    } catch (err) {
      setError((err as Error).message)
    }
    setPending(false)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Product
        <Select
          value={productId ? String(productId) : ""}
          onValueChange={(v) => {
            const next = products.find((p) => p.id === Number(v))
            setProductId(Number(v))
            setVariantId(null)
            setCost("")
            if (next && !next.hasVariants) prefillCost(next.id, null)
          }}
        >
          <SelectTrigger className="w-full" aria-label="Product">
            <SelectValue placeholder="Pick product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      {product?.hasVariants && (
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Variant
          <Select
            value={variantId ? String(variantId) : ""}
            onValueChange={(v) => {
              setVariantId(Number(v))
              prefillCost(product.id, Number(v))
            }}
          >
            <SelectTrigger className="w-full" aria-label="Variant">
              <SelectValue placeholder="Pick size / color" />
            </SelectTrigger>
            <SelectContent>
              {product.variants.map((v) => (
                <SelectItem key={v.id} value={String(v.id)}>
                  {variantLabel(v)} ({v.stockQty})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Qty {product && `(${product.unit})`}
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            className="h-12 text-lg"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </label>
        {isOwner && (
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Cost / unit ৳
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              className="h-12 text-lg"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </label>
        )}
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Supplier
        <Select
          value={supplierId ? String(supplierId) : ""}
          onValueChange={(v) => setSupplierId(Number(v))}
        >
          <SelectTrigger className="w-full" aria-label="Supplier">
            <SelectValue placeholder="Pick supplier" />
          </SelectTrigger>
          <SelectContent>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      {isOwner && (
        <div className="grid grid-cols-2 items-end gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Paid now ৳
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              value={paid}
              placeholder="0"
              onChange={(e) => setPaid(e.target.value)}
            />
          </label>
          <p className="pb-2 text-right text-sm">
            Total <Money amount={total} className="font-semibold" />
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        className="h-12"
        disabled={!valid || pending}
      >
        {pending ? "Saving…" : "Save stock in"}
      </Button>
    </form>
  )
}
