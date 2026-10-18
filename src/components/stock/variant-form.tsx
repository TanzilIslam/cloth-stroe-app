"use client"

// Size / color variants for ready-made dresses. Opening stock on add;
// later stock comes from stock in.
import { Trash2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { variantLabel } from "@/lib/utils"
import type { ProductVariant } from "@/types"

interface VariantFormProps {
  variants: ProductVariant[]
  /** Resolves true when saved (fields are then cleared). */
  onAdd: (
    size: string | null,
    color: string | null,
    openingStock: number
  ) => Promise<boolean>
  onDelete: (id: number) => Promise<void>
}

export function VariantForm({ variants, onAdd, onDelete }: VariantFormProps) {
  const [size, setSize] = useState("")
  const [color, setColor] = useState("")
  const [stock, setStock] = useState("")

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!size.trim() && !color.trim()) return
    const saved = await onAdd(
      size.trim() || null,
      color.trim() || null,
      Number(stock || 0)
    )
    if (!saved) return
    setSize("")
    setColor("")
    setStock("")
  }

  const remove = (id: number) => onDelete(id)

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-medium">Variants</h3>
      <ul className="flex flex-col divide-y rounded-lg border">
        {variants.length === 0 && (
          <li className="p-3 text-sm text-muted-foreground">No variants yet</li>
        )}
        {variants.map((v) => (
          <li
            key={v.id}
            className="flex items-center justify-between gap-2 px-3 py-2"
          >
            <span className="text-sm">{variantLabel(v)}</span>
            <span className="ml-auto text-sm text-muted-foreground">
              {v.stockQty} in stock
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete variant"
              disabled={v.stockQty !== 0}
              onClick={() => remove(v.id)}
            >
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="flex gap-2">
        <Input
          placeholder="Size"
          value={size}
          onChange={(e) => setSize(e.target.value)}
        />
        <Input
          placeholder="Color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          placeholder="Stock"
          aria-label="Opening stock"
          className="w-24"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />
        <Button type="submit" variant="outline">
          Add
        </Button>
      </form>
    </div>
  )
}
