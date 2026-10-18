"use client"

// Create or edit a product (owner only).
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { UNITS, type Product, type ProductInput, type Unit } from "@/types"

interface ProductFormProps {
  shopId: number
  product?: Product
  categories: string[]
  onSubmit: (input: ProductInput) => Promise<void>
}

const num = (v: string) => (v === "" ? 0 : Number(v))

export function ProductForm({
  shopId,
  product,
  categories,
  onSubmit,
}: ProductFormProps) {
  const isNew = !product
  const [form, setForm] = useState({
    name: product?.name ?? "",
    brand: product?.brand ?? "",
    category: product?.category ?? "",
    unit: (product?.unit ?? "piece") as Unit,
    costPrice: String(product?.costPrice ?? ""),
    sellPrice: String(product?.sellPrice ?? ""),
    lowStockAt: String(product?.lowStockAt ?? 5),
    barcode: product?.barcode ?? "",
    hasVariants: product?.hasVariants ?? false,
    stockQty: "",
  })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch })
  const valid =
    form.name.trim() && form.category.trim() && num(form.sellPrice) > 0

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      await onSubmit({
        shopId,
        name: form.name.trim(),
        brand: form.brand.trim() || null,
        category: form.category.trim(),
        unit: form.unit,
        costPrice: num(form.costPrice),
        sellPrice: num(form.sellPrice),
        lowStockAt: num(form.lowStockAt),
        barcode: form.barcode.trim() || null,
        hasVariants: form.hasVariants,
        stockQty:
          isNew && !form.hasVariants
            ? num(form.stockQty)
            : (product?.stockQty ?? 0),
      })
    } catch (err) {
      setError((err as Error).message)
    }
    setPending(false)
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-3">
      <Field label="Name" className="col-span-2">
        <Input
          required
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
        />
      </Field>
      <Field label="Brand">
        <Input
          value={form.brand}
          onChange={(e) => set({ brand: e.target.value })}
        />
      </Field>
      <Field label="Category">
        <Input
          required
          list="product-categories"
          value={form.category}
          onChange={(e) => set({ category: e.target.value })}
        />
        <datalist id="product-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>
      <Field label="Unit">
        <Select
          value={form.unit}
          onValueChange={(v) => set({ unit: v as Unit })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UNITS.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Barcode">
        <Input
          value={form.barcode}
          onChange={(e) => set({ barcode: e.target.value })}
        />
      </Field>
      <Field label="Cost price ৳">
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          value={form.costPrice}
          onChange={(e) => set({ costPrice: e.target.value })}
        />
      </Field>
      <Field label="Sell price ৳">
        <Input
          required
          type="number"
          inputMode="decimal"
          min={0}
          value={form.sellPrice}
          onChange={(e) => set({ sellPrice: e.target.value })}
        />
      </Field>
      <Field label="Low stock at">
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          value={form.lowStockAt}
          onChange={(e) => set({ lowStockAt: e.target.value })}
        />
      </Field>
      {isNew && !form.hasVariants && (
        <Field label="Opening stock">
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            value={form.stockQty}
            onChange={(e) => set({ stockQty: e.target.value })}
          />
        </Field>
      )}
      {isNew && (
        <label className="col-span-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4"
            checked={form.hasVariants}
            onChange={(e) => set({ hasVariants: e.target.checked })}
          />
          Has size / color variants (ready-made dress)
        </label>
      )}
      {error && (
        <p className="col-span-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="col-span-2" disabled={!valid || pending}>
        {pending ? "Saving…" : isNew ? "Add product" : "Save changes"}
      </Button>
    </form>
  )
}

function Field({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <label
      className={cn("flex flex-col gap-1.5 text-sm font-medium", className)}
    >
      {label}
      {children}
    </label>
  )
}
