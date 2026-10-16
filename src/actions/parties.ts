"use server"

// Customers, suppliers, dues and payments.
import { and, asc, eq, gt, min, sql, type AnyColumn } from "drizzle-orm"

import { db } from "@/db"
import { customers, payments, purchases, sales, suppliers } from "@/db/schema"
import { ActionError, run } from "@/lib/action"
import type { Result } from "@/lib/result"
import { requireOwner, requireShop } from "@/lib/session"
import type {
  Customer,
  DueRow,
  ID,
  PartyInput,
  PartyType,
  PaymentInput,
  Supplier,
} from "@/types"

export async function getParties(
  type: "customer",
  shopId: ID
): Promise<Result<Customer[]>>
export async function getParties(
  type: "supplier",
  shopId: ID
): Promise<Result<Supplier[]>>
export async function getParties(type: PartyType, shopId: ID) {
  return run(async () => {
    await requireShop(shopId)
    const table = type === "customer" ? customers : suppliers
    return db
      .select()
      .from(table)
      .where(eq(table.shopId, shopId))
      .orderBy(asc(table.name))
  })
}

export async function saveParty(
  type: "customer",
  input: PartyInput
): Promise<Result<Customer>>
export async function saveParty(
  type: "supplier",
  input: PartyInput
): Promise<Result<Supplier>>
export async function saveParty(type: PartyType, input: PartyInput) {
  return run(async () => {
    await requireShop(input.shopId)
    const name = input.name.trim()
    if (!name) throw new ActionError("Name is required")
    const values = { shopId: input.shopId, name, phone: input.phone.trim() }
    const table = type === "customer" ? customers : suppliers
    const [row] = await db.insert(table).values(values).returning()
    return row
  })
}

/** Customers who owe us and suppliers we owe, oldest unpaid first. */
export async function getDues(shopId: ID) {
  return run(async (): Promise<DueRow[]> => {
    await requireOwner()
    const custRows = await db
      .select({ party: customers, since: min(sales.createdAt) })
      .from(customers)
      .leftJoin(
        sales,
        and(eq(sales.customerId, customers.id), gt(sales.due, 0))
      )
      .where(and(eq(customers.shopId, shopId), gt(customers.dueBalance, 0)))
      .groupBy(customers.id)
    const suppRows = await db
      .select({ party: suppliers, since: min(purchases.createdAt) })
      .from(suppliers)
      .leftJoin(
        purchases,
        and(
          eq(purchases.supplierId, suppliers.id),
          sql`${purchases.qty} * ${purchases.cost} > ${purchases.paid}`
        )
      )
      .where(and(eq(suppliers.shopId, shopId), gt(suppliers.payableBalance, 0)))
      .groupBy(suppliers.id)

    const rows: DueRow[] = [
      ...custRows.map((r) => ({
        partyType: "customer" as const,
        party: r.party,
        amount: r.party.dueBalance,
        since: r.since,
      })),
      ...suppRows.map((r) => ({
        partyType: "supplier" as const,
        party: r.party,
        amount: r.party.payableBalance,
        since: r.since,
      })),
    ]
    return rows.sort(
      (a, b) => (a.since?.getTime() ?? 0) - (b.since?.getTime() ?? 0)
    )
  })
}

/** Receive from a customer or pay a supplier. Balance + payment in one transaction. */
export async function recordPayment(input: PaymentInput) {
  return run(async () => {
    await requireOwner()
    if (!(input.amount > 0)) throw new ActionError("Amount must be more than 0")
    if (input.method !== "cash" && input.method !== "bKash")
      throw new ActionError("Pick cash or bKash")

    return db.transaction(async (tx) => {
      const where = (
        table: typeof customers | typeof suppliers,
        balance: AnyColumn
      ) =>
        and(
          eq(table.id, input.partyId),
          eq(table.shopId, input.shopId),
          sql`${balance} >= ${input.amount}`
        )
      const [updated] =
        input.partyType === "customer"
          ? await tx
              .update(customers)
              .set({
                dueBalance: sql`${customers.dueBalance} - ${input.amount}`,
              })
              .where(where(customers, customers.dueBalance))
              .returning({ id: customers.id })
          : await tx
              .update(suppliers)
              .set({
                payableBalance: sql`${suppliers.payableBalance} - ${input.amount}`,
              })
              .where(where(suppliers, suppliers.payableBalance))
              .returning({ id: suppliers.id })
      if (!updated) throw new ActionError("More than the balance")

      const [row] = await tx.insert(payments).values(input).returning()
      return row
    })
  })
}
