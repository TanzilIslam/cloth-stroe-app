// Today so far vs. the same day last week up to the same time.
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

import { Money } from "@/components/shared/money"
import { StatCard } from "@/components/shared/stat-card"
import { cn } from "@/lib/utils"

interface ComparisonCardProps {
  today: number
  lastWeek: number
}

export function ComparisonCard({ today, lastWeek }: ComparisonCardProps) {
  const pct = lastWeek
    ? Math.round(((today - lastWeek) / lastWeek) * 100)
    : null
  const Icon =
    pct === null || pct === 0 ? Minus : pct > 0 ? ArrowUpRight : ArrowDownRight
  const weekday = new Date().toLocaleDateString("en-GB", { weekday: "long" })

  return (
    <StatCard
      label={`vs. last ${weekday}`}
      value={
        <span
          className={cn(
            "flex items-center gap-1",
            pct !== null && pct < 0 && "text-destructive"
          )}
        >
          <Icon className="size-6" />
          {pct === null ? "No data" : `${pct > 0 ? "+" : ""}${pct}%`}
        </span>
      }
      hint={
        <>
          Last week this time: <Money amount={lastWeek} />
        </>
      }
    />
  )
}
