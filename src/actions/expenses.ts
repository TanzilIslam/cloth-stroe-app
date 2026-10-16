"use server"

// Expenses: any shop user can add; only the owner can delete.
import { and, desc, eq, gte } from "drizzle-orm"

import { db } from "@/db"
import { expenses } from "@/db/schema"
import { todayStart } from "@/db/time"
import { ActionError, run } from "@/lib/action"
import { requireOwner, requireShop } from "@/lib/session"
import { EXPENSE_CATEGORIES, type ExpenseInput, type ID } from "@/types"

export async function createExpense(input: ExpenseInput) {
  return run(async () => {
    await requireShop(input.shopId)
    if (!(input.amount > 0)) throw new ActionError("Amount must be more than 0")
    if (!EXPENSE_CATEGORIES.includes(input.category))
      throw new ActionError("Pick a category")
    const [row] = await db
      .insert(expenses)
      .values({ ...input, note: input.note?.trim() || null })
      .returning()
    return row
  })
}

/** Newest first. `from` limits to that time onward. */
export async function getExpenses(shopId: ID, from?: Date) {
  return run(async () => {
    await requireShop(shopId)
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
    await requireShop(shopId)
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
    await db.delete(expenses).where(eq(expenses.id, id))
  })
}
