// Dashboard, cash check, stock alerts and the monthly report.
import { describe, expect, it } from "vitest"

import { getExpectedCash } from "@/actions/cash"
import { createExpense } from "@/actions/expenses"
import {
  getDashboard,
  getDeadStock,
  getLowStock,
  getMonthlyReport,
  getPeakTimes,
} from "@/actions/reports"
import { createSale } from "@/actions/sales"

import { loginAs, ok, PIN } from "./helpers"

const sellOneNavy = () =>
  createSale({
    shopId: 1,
    userId: 2,
    customerId: null,
    items: [{ productId: 1, variantId: null, qty: 1, price: 900 }],
    discount: 0,
    paid: 900,
    method: "cash",
  })

describe("getDashboard", () => {
  it("adds a new sale to today's numbers (owner sees profit)", async () => {
    await loginAs(PIN.owner)
    const before = ok(await getDashboard([1]))
    await loginAs(PIN.rahim)
    ok(await sellOneNavy())
    await loginAs(PIN.owner)
    const after = ok(await getDashboard([1]))
    expect(after.sale).toBe(before.sale + 900)
    expect(after.count).toBe(before.count + 1)
    expect(after.cash).toBe(before.cash + 900)
    expect(after.profit).toBe(before.profit + (900 - 650))
  })

  it("hides profit and dues from staff", async () => {
    await loginAs(PIN.rahim)
    const d = ok(await getDashboard([1]))
    expect(d.profit).toBe(0)
    expect(d.dues).toBe(0)
  })
})

describe("getExpectedCash", () => {
  it("counts cash sales in and expenses out", async () => {
    await loginAs(PIN.rahim)
    const before = ok(await getExpectedCash(1))
    ok(await sellOneNavy())
    ok(
      await createExpense({
        shopId: 1,
        category: "bill",
        amount: 200,
        note: null,
      })
    )
    const after = ok(await getExpectedCash(1))
    expect(after.cashSales).toBe(before.cashSales + 900)
    expect(after.expenses).toBe(before.expenses + 200)
  })
})

describe("stock alerts", () => {
  it("low stock lists products at or under their level", async () => {
    await loginAs(PIN.rahim)
    const rows = ok(await getLowStock(1))
    const names = rows.map((r) => r.product.name)
    expect(names).toContain("Pant Fabric Khaki")
    expect(names).toContain("Suit Fabric Black")
    expect(rows.every((r) => r.reorderQty >= 0)).toBe(true)
  })

  it("dead stock lists items not sold for 60+ days", async () => {
    await loginAs(PIN.rahim)
    const rows = ok(await getDeadStock(1))
    expect(rows.map((r) => r.product.name)).toContain("Shirt Fabric Check")
  })
})

describe("owner reports", () => {
  it("peak times have 12 hours and 7 days", async () => {
    await loginAs(PIN.owner)
    const p = ok(await getPeakTimes([1, 2]))
    expect(p.hours).toHaveLength(12)
    expect(p.days.map((d) => d.label)).toEqual([
      "Sat",
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
    ])
  })

  it("monthly net profit = gross - expenses", async () => {
    await loginAs(PIN.owner)
    const rows = ok(await getMonthlyReport([1]))
    expect(rows.length).toBeGreaterThan(0)
    for (const r of rows) expect(r.net).toBeCloseTo(r.gross - r.expenses, 2)
  })
})
