"use client"

// Top 5 products, brands and categories by sales (last 30 days).
import { useState } from "react"

import { Money } from "@/components/shared/money"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Bestsellers as BestsellersData } from "@/types"

const VIEWS = [
  { key: "products", label: "Products" },
  { key: "brands", label: "Brands" },
  { key: "categories", label: "Categories" },
] as const

export function Bestsellers({ data }: { data: BestsellersData }) {
  const [view, setView] = useState<(typeof VIEWS)[number]["key"]>("products")
  const rows = data[view]
  const max = Math.max(1, ...rows.map((r) => r.value))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Bestsellers · 30 days</CardTitle>
        <div className="flex gap-1" role="group" aria-label="Group by">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              aria-pressed={view === v.key}
              onClick={() => setView(v.key)}
              className={cn(
                "rounded-md px-2 py-1 text-xs pointer-coarse:min-h-11",
                view === v.key
                  ? "bg-secondary font-medium"
                  : "text-muted-foreground"
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sales yet</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {rows.map((r, i) => (
              <li key={r.label} className="flex flex-col gap-1">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="truncate">
                    <span className="text-muted-foreground">{i + 1}.</span>{" "}
                    {r.label}
                  </span>
                  <Money amount={r.value} className="font-medium" />
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-chart-2"
                    style={{ width: `${(r.value / max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
