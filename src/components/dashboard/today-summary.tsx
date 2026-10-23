// Today's sale (navy hero card with the weekly trend), gross profit, cash and
// dues. Staff see the sale only.
import { Money } from "@/components/shared/money"
import { StatCard } from "@/components/shared/stat-card"
import type { DashboardStats } from "@/types"

import { Trend } from "./comparison-card"

interface TodaySummaryProps {
  stats: DashboardStats
  trend?: { today: number; lastWeek: number }
  staffView?: boolean
}

export function TodaySummary({ stats, trend, staffView }: TodaySummaryProps) {
  const sale = (
    <StatCard
      tone="primary"
      label="Today's sale"
      value={<Money amount={stats.sale} />}
      hint={
        <span className="flex flex-col gap-1">
          <span>{stats.count} sales</span>
          {trend && <Trend {...trend} />}
        </span>
      }
      className="col-span-2 lg:col-span-1"
    />
  )
  if (staffView) return <div className="grid max-w-sm grid-cols-2">{sale}</div>

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {sale}
      <StatCard label="Gross profit" value={<Money amount={stats.profit} />} />
      <StatCard label="Cash sales" value={<Money amount={stats.cash} />} />
      <StatCard
        label="Customer dues"
        value={<Money amount={stats.dues} />}
        className="col-span-2 sm:col-span-1"
      />
    </div>
  )
}
