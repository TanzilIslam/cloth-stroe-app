"use server"

// Expenses: any shop user can add; only the owner can delete.
import { and, desc, eq, gte } from "drizzle-orm"

import { db } from "@/db"
import { expenses } from "@/db/schema"
import { todayStart } from "@/db/sql"
import { parse, run } from "@/lib/action"
import { requireOwner, requireShop } from "@/lib/session"
import type { ExpenseInput, ID } from "@/types"
import { expenseSchema, fromDateSchema, idSchema } from "@/types/validations"

export async function createExpense(input: ExpenseInput) {
  return run(async () => {
    input = parse(expenseSchema, input)
    await requireShop(input.shopId)
    const [row] = await db.insert(expenses).values(input).returning()
    return row
  })
}

/** Newest first. `from` limits to that time onward. */
export async function getExpenses(shopId: ID, from?: Date) {
  return run(async () => {
    from = parse(fromDateSchema, from)
    await requireShop(parse(idSchema, shopId))
    return db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.shopId, shopId),
          from ? gte(expenses.date, from) : undefined
        )
      )
      .orderBy(desc(expenses.date))
  })
}

export async function getTodayExpenses(shopId: ID) {
  return run(async () => {
    await requireShop(parse(idSchema, shopId))
    return db
      .select()
      .from(expenses)
      .where(and(eq(expenses.shopId, shopId), gte(expenses.date, todayStart)))
      .orderBy(desc(expenses.date))
  })
}

export async function deleteExpense(id: ID) {
  return run(async () => {
    await requireOwner()
    id = parse(idSchema, id)
    await db.delete(expenses).where(eq(expenses.id, id))
  })
}
