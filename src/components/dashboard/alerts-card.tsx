// Dashboard alerts: low stock and oldest customer dues, linking to details.
import { Package, Wallet } from "lucide-react"
import Link from "next/link"

import { Money } from "@/components/shared/money"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { daysSince } from "@/lib/calc"
import { ROUTES } from "@/lib/routes"
import type { DueRow, LowStockRow } from "@/types"
import { variantLabel } from "@/lib/utils"

interface AlertsCardProps {
  lowStock: LowStockRow[]
  dues: DueRow[]
}

export function AlertsCard({ lowStock, dues }: AlertsCardProps) {
  const oldestDues = dues.filter((d) => d.partyType === "customer").slice(0, 3)

  return (
    <Card className="gap-4 py-5 shadow-xs">
      <CardHeader>
        <CardTitle>Alerts</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <section>
          <Link
            href={ROUTES.stock}
            className="mb-1 flex items-center gap-2 font-medium pointer-coarse:min-h-11"
          >
            <Package className="size-4" /> Low stock ({lowStock.length})
          </Link>
          {lowStock.length === 0 ? (
            <p className="text-muted-foreground">All stocked up</p>
          ) : (
            <ul>
              {lowStock.slice(0, 4).map((r) => (
                <li
                  key={`${r.product.id}:${r.variant?.id ?? 0}`}
                  className="flex justify-between"
                >
                  <span className="truncate">
                    {r.product.name}
                    {r.variant && ` · ${variantLabel(r.variant)}`}
                  </span>
                  <span className="text-destructive">
                    {r.stock} {r.product.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <Link
            href={ROUTES.hisab}
            className="mb-1 flex items-center gap-2 font-medium pointer-coarse:min-h-11"
          >
            <Wallet className="size-4" /> Oldest dues
          </Link>
          {oldestDues.length === 0 ? (
            <p className="text-muted-foreground">No customer dues</p>
          ) : (
            <ul>
              {oldestDues.map((d) => (
                <li key={d.party.id} className="flex justify-between gap-2">
                  <span className="truncate">
                    {d.party.name}
                    {d.since && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {daysSince(d.since)}d
                      </span>
                    )}
                  </span>
                  <Money amount={d.amount} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  )
}
