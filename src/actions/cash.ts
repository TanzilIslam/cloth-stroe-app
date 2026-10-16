"use server"

// Cash check: today's cash flows (expected) vs. counted cash.
import { and, desc, eq, gte, lt, sql } from "drizzle-orm"

import { db } from "@/db"
import { cashCounts, expenses, payments, purchases, sales } from "@/db/schema"
import { todayStart } from "@/db/time"
import { parse, run } from "@/lib/action"
import { requireShop } from "@/lib/session"
import type { CashSummary, ID } from "@/types"
import { cashCountSchema, idSchema } from "@/types/validations"

const total = (col: unknown) =>
  sql<number>`coalesce(sum(${col}), 0)`.mapWith(Number)

export async function getExpectedCash(shopId: ID) {
  return run(async (): Promise<CashSummary> => {
    await requireShop(parse(idSchema, shopId))
    const [[s], [cin], [cout], [e], [p], [last]] = await Promise.all([
      db
        .select({ v: total(sales.paid) })
        .from(sales)
        .where(
          and(
            eq(sales.shopId, shopId),
            eq(sales.method, "cash"),
            gte(sales.createdAt, todayStart)
          )
        ),
      db
        .select({ v: total(payments.amount) })
        .from(payments)
        .where(
          and(
            eq(payments.shopId, shopId),
            eq(payments.partyType, "customer"),
            eq(payments.method, "cash"),
            gte(payments.date, todayStart)
          )
        ),
      db
        .select({ v: total(payments.amount) })
        .from(payments)
        .where(
          and(
            eq(payments.shopId, shopId),
            eq(payments.partyType, "supplier"),
            eq(payments.method, "cash"),
            gte(payments.date, todayStart)
          )
        ),
      db
        .select({ v: total(expenses.amount) })
        .from(expenses)
        .where(
          and(eq(expenses.shopId, shopId), gte(expenses.date, todayStart))
        ),
      db
        .select({ v: total(purchases.paid) })
        .from(purchases)
        .where(
          and(
            eq(purchases.shopId, shopId),
            gte(purchases.createdAt, todayStart)
          )
        ),
      // Opening cash defaults to the last count from a previous day
      db
        .select({ v: cashCounts.counted })
        .from(cashCounts)
        .where(
          and(eq(cashCounts.shopId, shopId), lt(cashCounts.date, todayStart))
        )
        .orderBy(desc(cashCounts.date))
        .limit(1),
    ])
    return {
      cashSales: s.v,
      cashIn: cin.v,
      expenses: e.v,
      cashOut: cout.v + p.v,
      lastCounted: last?.v ?? null,
    }
  })
}

export async function saveCashCount(input: {
  shopId: ID
  expected: number
  counted: number
}) {
  return run(async () => {
    input = parse(cashCountSchema, input)
    const user = await requireShop(input.shopId)
    const [row] = await db
      .insert(cashCounts)
      .values({
        shopId: input.shopId,
        userId: user.id,
        expected: input.expected,
        counted: input.counted,
        diff: input.counted - input.expected,
      })
      .returning()
    return row
  })
}

export async function getCashCounts(shopId: ID) {
  return run(async () => {
    await requireShop(parse(idSchema, shopId))
    return db
      .select()
      .from(cashCounts)
      .where(eq(cashCounts.shopId, shopId))
      .orderBy(desc(cashCounts.date))
      .limit(30)
  })
}
