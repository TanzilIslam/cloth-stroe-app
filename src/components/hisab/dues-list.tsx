// Dues oldest first: customers who owe us, suppliers we owe.
// Customers get a WhatsApp reminder link.
import { CheckCircle2, MessageCircle } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { Money } from "@/components/shared/money"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { daysSince } from "@/lib/calc"
import { formatTaka, whatsappLink } from "@/lib/utils"
import type { DueRow } from "@/types"

interface DuesListProps {
  rows: DueRow[]
  shopName: string
  onSettle: (row: DueRow) => void
}

export function DuesList({ rows, shopName, onSettle }: DuesListProps) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="No dues"
        hint="Nobody owes the shop and the shop owes nobody."
        className="surface"
      />
    )
  }

  return (
    <ul className="flex flex-col divide-y surface">
      {rows.map((row) => {
        const isCustomer = row.partyType === "customer"
        const message = `Dear ${row.party.name}, your due at ${shopName} is ${formatTaka(row.amount)}. Thank you, ${shopName}`
        return (
          <li
            key={`${row.partyType}:${row.party.id}`}
            className="flex flex-wrap items-center gap-3 p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-medium">
                {row.party.name}
                <Badge
                  className={
                    isCustomer
                      ? "border-transparent bg-primary/10 text-primary"
                      : "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                  }
                >
                  {isCustomer ? "Owes us" : "We owe"}
                </Badge>
              </p>
              <p className="text-[0.8125rem] text-muted-foreground">
                {row.party.phone}
                {row.since
                  ? ` · ${daysSince(row.since)} days`
                  : " · opening balance"}
              </p>
            </div>
            <Money amount={row.amount} className="font-semibold" />
            <div className="flex gap-2">
              {isCustomer && (
                <Button variant="outline" size="icon" asChild>
                  <a
                    href={whatsappLink(row.party.phone, message)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`WhatsApp reminder to ${row.party.name}`}
                  >
                    <MessageCircle />
                  </a>
                </Button>
              )}
              <Button size="sm" onClick={() => onSettle(row)}>
                {isCustomer ? "Receive" : "Pay"}
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
