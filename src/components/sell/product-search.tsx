"use client"

// Search products by name, brand, category or barcode. Enter = exact match.
import { Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"

interface ProductSearchProps {
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
}

export function ProductSearch({
  value,
  onChange,
  onSubmit,
}: ProductSearchProps) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        inputMode="search"
        placeholder="Search name or barcode"
        className="h-12 pr-10 pl-10 text-base"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit?.()}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
          onClick={() => onChange("")}
        >
          <X className="size-5" />
        </button>
      )}
    </div>
  )
}
