"use client"

// Owner only: dues + payments, this month's expenses, cash count, monthly report.
import { Wallet } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useOpenExpenseSheet } from "@/components/layout/expense-sheet"
import { PageHeader } from "@/components/layout/page-header"
import { useConfirm } from "@/components/shared/confirm-dialog"
import { LoadError, Loading, queryStatus } from "@/components/shared/load-state"
import { CashCountForm } from "@/components/hisab/cash-count-form"
import { DuesList } from "@/components/hisab/dues-list"
import { EXPENSE_META } from "@/components/hisab/expense-meta"
import { ExpenseList } from "@/components/hisab/expense-list"
import { MonthlyReport } from "@/components/hisab/monthly-report"
import {
  PaymentForm,
  type PaymentValues,
} from "@/components/hisab/payment-form"
import { Money } from "@/components/shared/money"
import { StatCard } from "@/components/shared/stat-card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAction } from "@/hooks/use-action"
import { useQuery } from "@/hooks/use-query"
import { useSession } from "@/hooks/use-session"
import {
  deleteExpense,
  getCashCounts,
  getDues,
  getExpectedCash,
  getExpenses,
  getMonthlyReport,
  recordPayment,
  saveCashCount,
} from "@/api"
import { useShops } from "@/hooks/use-shops"
import { formatDate } from "@/lib/utils"
import { EXPENSE_CATEGORIES, type DueRow } from "@/types"

const monthStart = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export default function HisabPage() {
  const user = useSession()!
  const shopId = user.shopId
  const shops = useShops()
  const shopName = shops.find((s) => s.id === shopId)?.name ?? ""

  const dues = useQuery(() => getDues(shopId), [shopId])
  const expenses = useQuery(() => getExpenses(shopId, monthStart()), [shopId])
  const cash = useQuery(() => getExpectedCash(shopId), [shopId])
  const counts = useQuery(() => getCashCounts(shopId), [shopId])
  const report = useQuery(() => getMonthlyReport([shopId]), [shopId])

  const status = queryStatus(dues, expenses, cash, counts, report)
  const [settling, setSettling] = useState<DueRow | null>(null)
  const [confirm, confirmDialog] = useConfirm()
  const openExpense = useOpenExpenseSheet()
  const removeExpense = useAction(deleteExpense, {
    success: "Expense deleted",
    onDone: () => {
      expenses.reload()
      cash.reload()
    },
  })

  const dueRows = dues.data ?? []
  const owedToUs = dueRows
    .filter((r) => r.partyType === "customer")
    .reduce((a, r) => a + r.amount, 0)
  const weOwe = dueRows
    .filter((r) => r.partyType === "supplier")
    .reduce((a, r) => a + r.amount, 0)
  const monthExpenses = expenses.data ?? []
  const expenseTotal = monthExpenses.reduce((a, e) => a + e.amount, 0)

  async function settle(values: PaymentValues) {
    if (!settling) return
    await recordPayment({
      shopId,
      partyType: settling.partyType,
      partyId: settling.party.id,
      ...values,
    })
    toast.success(
      settling.partyType === "customer" ? "Payment received" : "Supplier paid"
    )
    setSettling(null)
    dues.reload()
    cash.reload()
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Hisab"
        subtitle={shopName}
        actions={
          <Button variant="outline" onClick={openExpense}>
            <Wallet /> Add expense
          </Button>
        }
      />

      {status.error && <LoadError onRetry={status.retry} />}
      {dues.loading && <Loading />}

      <Tabs defaultValue="dues" className={dues.loading ? "hidden" : undefined}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="dues">Dues</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="cash">Cash</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>

        <TabsContent value="dues" className="mt-3 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 lg:max-w-md">
            <StatCard
              label="Customers owe us"
              value={<Money amount={owedToUs} />}
            />
            <StatCard
              label="We owe suppliers"
              value={<Money amount={weOwe} />}
            />
          </div>
          <DuesList rows={dueRows} shopName={shopName} onSettle={setSettling} />
        </TabsContent>

        <TabsContent value="expenses" className="mt-3 flex flex-col gap-3">
          {expenses.loading && <Loading />}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard
              label="This month"
              value={<Money amount={expenseTotal} />}
            />
            {EXPENSE_CATEGORIES.map((c) => (
              <StatCard
                key={c}
                label={EXPENSE_META[c].label}
                value={
                  <Money
                    amount={monthExpenses
                      .filter((e) => e.category === c)
                      .reduce((a, e) => a + e.amount, 0)}
                  />
                }
              />
            ))}
          </div>
          <ExpenseList
            expenses={monthExpenses}
            empty="No expenses this month"
            onDelete={async (id) => {
              const ok = await confirm({
                title: "Delete this expense?",
                message:
                  "It will be removed from the month's list and all reports.",
                confirmLabel: "Delete",
                danger: true,
              })
              if (ok) await removeExpense.run(id)
            }}
          />
        </TabsContent>

        <TabsContent value="cash" className="mt-3 grid gap-6 lg:grid-cols-2">
          {cash.loading && <Loading />}
          {cash.data && (
            <CashCountForm
              key={counts.data?.length ?? 0}
              summary={cash.data}
              onSubmit={async (values) => {
                const row = await saveCashCount({ shopId, ...values })
                toast[row.diff === 0 ? "success" : "warning"](
                  row.diff === 0
                    ? "Cash matched"
                    : `Cash ${row.diff < 0 ? "short" : "over"}`
                )
                counts.reload()
                cash.reload()
              }}
            />
          )}
          <section>
            <h3 className="mb-2 font-semibold">Past counts</h3>
            <ul className="flex flex-col divide-y surface text-sm">
              {(counts.data ?? []).length === 0 && (
                <li className="p-3 text-muted-foreground">No counts yet</li>
              )}
              {(counts.data ?? []).map((c) => (
                <li key={c.id} className="flex justify-between gap-3 p-3">
                  <span>{formatDate(c.date)}</span>
                  <span>
                    <Money amount={c.counted} /> ·{" "}
                    <span className={c.diff === 0 ? "" : "text-destructive"}>
                      {c.diff === 0 ? (
                        "matched"
                      ) : (
                        <>
                          diff <Money amount={c.diff} />
                        </>
                      )}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </TabsContent>

        <TabsContent value="report" className="mt-3">
          {report.loading ? (
            <Loading />
          ) : (
            <MonthlyReport rows={report.data ?? []} />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!settling} onOpenChange={(o) => !o && setSettling(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {settling?.partyType === "customer" ? "Receive from" : "Pay"}{" "}
              {settling?.party.name}
            </DialogTitle>
            <DialogDescription>{settling?.party.phone}</DialogDescription>
          </DialogHeader>
          {settling && <PaymentForm row={settling} onSubmit={settle} />}
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </div>
  )
}
