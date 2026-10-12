// Today's sale, gross profit, cash and dues. Staff see sale only.
import { Money } from "@/components/shared/money"
import { StatCard } from "@/components/shared/stat-card"
import type { DashboardStats } from "@/types"

interface TodaySummaryProps {
  stats: DashboardStats
  staffView?: boolean
}

export function TodaySummary({ stats, staffView }: TodaySummaryProps) {
  const sale = (
    <StatCard
      label="Today's sale"
      value={<Money amount={stats.sale} />}
      hint={`${stats.count} sales`}
    />
  )
  if (staffView) return <div className="max-w-xs">{sale}</div>

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {sale}
      <StatCard label="Gross profit" value={<Money amount={stats.profit} />} />
      <StatCard label="Cash sales" value={<Money amount={stats.cash} />} />
      <StatCard label="Customer dues" value={<Money amount={stats.dues} />} />
    </div>
  )
}
