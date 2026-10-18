"use client"

// Product list with search + category filter. Cost column for owner only.
import { useState } from "react"

import { DataTable, type Column } from "@/components/shared/data-table"
import { Money } from "@/components/shared/money"
import { productStock } from "@/components/sell/product-tile"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { ProductWithVariants } from "@/types"

interface ProductTableProps {
  products: ProductWithVariants[]
  showCost: boolean
  onSelect?: (product: ProductWithVariants) => void
}

const ALL = "all"

export function ProductTable({
  products,
  showCost,
  onSelect,
}: ProductTableProps) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState(ALL)

  const categories = [...new Set(products.map((p) => p.category))].sort()
  const q = query.trim().toLowerCase()
  const rows = products.filter(
    (p) =>
      (category === ALL || p.category === category) &&
      (!q ||
        `${p.name} ${p.brand ?? ""} ${p.barcode ?? ""}`
          .toLowerCase()
          .includes(q))
  )

  const columns: Column<ProductWithVariants>[] = [
    {
      header: "Product",
      cell: (p) => (
        <div className="min-w-32">
          <p className="font-medium">{p.name}</p>
          <p className="text-xs text-muted-foreground">
            {[p.brand, p.hasVariants && `${p.variants.length} variants`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      ),
    },
    {
      header: "Category",
      cell: (p) => p.category,
      className: "hidden md:table-cell",
    },
    {
      header: "Stock",
      cell: (p) => {
        const stock = productStock(p)
        return (
          <span
            className={cn(
              stock <= p.lowStockAt && "font-medium text-destructive"
            )}
          >
            {stock} {p.unit}
          </span>
        )
      },
    },
    { header: "Price", cell: (p) => <Money amount={p.sellPrice} /> },
    ...(showCost
      ? [
          {
            header: "Cost",
            cell: (p: ProductWithVariants) => <Money amount={p.costPrice} />,
            className: "hidden sm:table-cell",
          },
        ]
      : []),
    {
      header: "Status",
      cell: (p) =>
        p.active ? null : <Badge variant="secondary">Inactive</Badge>,
      className: "hidden md:table-cell",
    },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          type="search"
          placeholder="Search products"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40" aria-label="Category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(p) => p.id}
        onRowClick={onSelect}
        empty="No products found"
      />
    </div>
  )
}
