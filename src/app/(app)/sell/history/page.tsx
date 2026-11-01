"use client"

// Sales history: pick a day, see totals and every sale; tap one for details.
// View only: mistakes are fixed with Return mode on /sell.
import { useState } from "react"

import { PageHeader } from "@/components/layout/page-header"
import { SaleDetail } from "@/components/sell/sale-detail"
import { SaleList } from "@/components/sell/sale-list"
import { LoadError, Loading } from "@/components/shared/load-state"
import { Money } from "@/components/shared/money"
import { StatCard } from "@/components/shared/stat-card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getSales } from "@/api"
import { useQuery } from "@/hooks/use-query"
import { useSession } from "@/hooks/use-session"
import { shopDay } from "@/lib/utils"
import { PAYMENT_LABELS, type SaleDetail as SaleDetailData } from "@/types"

export default function SalesHistoryPage() {
  const user = useSession()!
  const today = shopDay()
  const [picked, setDay] = useState(today)
  const day = picked > today ? today : picked
  const sales = useQuery(() => getSales(user.shopId, day), [user.shopId, day])
  const [selected, setSelected] = useState<SaleDetailData | null>(null)

  const rows = sales.data ?? []
  const sum = (pick: (s: SaleDetailData) => number) =>
    rows.reduce((a, s) => a + pick(s), 0)
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Sales history"
        actions={
          <Input
            type="date"
            aria-label="Date"
            className="w-auto"
            value={day}
            max={today}
            onChange={(e) => e.target.value && setDay(e.target.value)}
          />
        }
      />

      {sales.error ? (
        <LoadError onRetry={sales.reload} />
      ) : sales.loading ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Sales"
              value={<Money amount={sum((s) => s.total - s.discount)} />}
              hint={`${rows.length} sales`}
            />
            <StatCard
              label={PAYMENT_LABELS.cash}
              value={
                <Money
                  amount={sum((s) => (s.method === "cash" ? s.paid : 0))}
                />
              }
            />
            <StatCard
              label={PAYMENT_LABELS.bKash}
              value={
                <Money
                  amount={sum((s) => (s.method === "bKash" ? s.paid : 0))}
                />
              }
            />
            <StatCard
              label={PAYMENT_LABELS.due}
              value={<Money amount={sum((s) => s.due)} />}
            />
          </div>
          <SaleList sales={rows} onSelect={setSelected} />
        </>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[95svh] max-w-sm overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sale details</DialogTitle>
          </DialogHeader>
          {selected && <SaleDetail sale={selected} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
