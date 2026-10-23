// Trend: today so far vs. the same day last week up to the same time.
// Shown inside the "Today's sale" hero card.
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

import { Money } from "@/components/shared/money"
import { SHOP_TZ } from "@/lib/config"

interface TrendProps {
  today: number
  lastWeek: number
}

export function Trend({ today, lastWeek }: TrendProps) {
  const pct = lastWeek
    ? Math.round(((today - lastWeek) / lastWeek) * 100)
    : null
  const Icon =
    pct === null || pct === 0 ? Minus : pct > 0 ? ArrowUpRight : ArrowDownRight
  const weekday = new Date().toLocaleDateString("en-GB", {
    timeZone: SHOP_TZ,
    weekday: "long",
  })

  return (
    <span className="flex flex-wrap items-center gap-x-1.5">
      <span className="inline-flex items-center gap-0.5 rounded-full bg-white/15 px-1.5 py-0.5 font-medium">
        <Icon className="size-3.5" />
        {pct === null ? "No data" : `${pct > 0 ? "+" : ""}${pct}%`}
      </span>
      <span>
        vs. last {weekday} (<Money amount={lastWeek} />)
      </span>
    </span>
  )
}
