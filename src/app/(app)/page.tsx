"use client"

// Owner dashboard: today's numbers with the weekly trend, bestsellers, peak times, alerts.
// "Both" adds up the two shops. Staff see today's sale only.
import { useState } from "react"

import { AlertsCard } from "@/components/dashboard/alerts-card"
import { Bestsellers } from "@/components/dashboard/bestsellers"
import { PeakTimes } from "@/components/dashboard/peak-times"
import { TodaySummary } from "@/components/dashboard/today-summary"
import { PageHeader } from "@/components/layout/page-header"
import { LoadError, Loading, queryStatus } from "@/components/shared/load-state"
import { cn } from "@/lib/utils"
import { useQuery } from "@/hooks/use-query"
import { useSession } from "@/hooks/use-session"
import {
  getBestsellers,
  getComparison,
  getDashboard,
  getDues,
  getLowStock,
  getPeakTimes,
} from "@/api"
import { useShops } from "@/hooks/use-shops"

export default function DashboardPage() {
  const user = useSession()!
  const [both, setBoth] = useState(false)
  const shops = useShops()
  const isOwner = user.role === "owner"
  const shopIds =
    isOwner && both && shops.length ? shops.map((s) => s.id) : [user.shopId]
  const key = shopIds.join(",")

  const stats = useQuery(() => getDashboard(shopIds), [key])
  const comparison = useQuery(() => getComparison(shopIds), [key])
  const best = useQuery(() => getBestsellers(shopIds), [key])
  const peaks = useQuery(() => getPeakTimes(shopIds), [key])
  const lowStock = useQuery(
    () => Promise.all(shopIds.map(getLowStock)).then((r) => r.flat()),
    [key]
  )
  const dues = useQuery(
    () => Promise.all(shopIds.map(getDues)).then((r) => r.flat()),
    [key]
  )

  const status = queryStatus(stats, comparison, best, peaks, lowStock, dues)
  const shopName = both
    ? "Both shops"
    : shops.find((s) => s.id === user.shopId)?.name

  if (!isOwner) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Today" subtitle={shopName} />
        {stats.data && <TodaySummary stats={stats.data} staffView />}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Dashboard"
        subtitle={shopName}
        actions={
          <div
            className="flex rounded-lg bg-secondary p-1 text-sm"
            role="group"
            aria-label="Scope"
          >
            {[
              { label: "This shop", value: false },
              { label: "Both", value: true },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                aria-pressed={both === o.value}
                onClick={() => setBoth(o.value)}
                className={cn(
                  "rounded-md px-3 py-1 pointer-coarse:min-h-11",
                  both === o.value
                    ? "bg-card font-medium shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        }
      />

      {status.error ? (
        <LoadError onRetry={status.retry} />
      ) : stats.loading ? (
        <Loading />
      ) : (
        <>
          {stats.data && (
            <TodaySummary stats={stats.data} trend={comparison.data} />
          )}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="flex flex-col gap-4 lg:col-span-2">
              {peaks.data && <PeakTimes data={peaks.data} />}
            </div>
            <div className="flex flex-col gap-4">
              {best.data && <Bestsellers data={best.data} />}
              <AlertsCard
                lowStock={lowStock.data ?? []}
                dues={dues.data ?? []}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
