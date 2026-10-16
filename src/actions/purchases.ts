"use server"

// Stock in: stock, cost price and supplier balance change in one transaction.
// Staff can't set cost or paid: last cost is used and paid is 0.
import { and, desc, eq, isNull, sql } from "drizzle-orm"

import { db, type Tx } from "@/db"
import { products, productVariants, purchases, suppliers } from "@/db/schema"
import { ActionError, parse, run } from "@/lib/action"
import { ERRORS } from "@/lib/errors"
import { roundMoney } from "@/lib/calc"
import { requireOwner, requireShop } from "@/lib/session"
import { variantLabel } from "@/lib/utils"
import type { ID, PurchaseInput, PurchaseRow } from "@/types"
import { idSchema, purchaseSchema } from "@/types/validations"

async function lastCost(
  q: Tx | typeof db,
  productId: ID,
  variantId: ID | null
) {
  const [last] = await q
    .select({ cost: purchases.cost })
    .from(purchases)
    .where(
      and(
        eq(purchases.productId, productId),
        variantId
          ? eq(purchases.variantId, variantId)
          : isNull(purchases.variantId)
      )
    )
    .orderBy(desc(purchases.id))
    .limit(1)
  if (last) return last.cost
  const [p] = await q
    .select({ cost: products.costPrice })
    .from(products)
    .where(eq(products.id, productId))
  return p?.cost ?? 0
}

/** Owner only: cost is hidden from staff. */
export async function getLastCost(productId: ID, variantId: ID | null = null) {
  return run(async () => {
    await requireOwner()
    return lastCost(
      db,
      parse(idSchema, productId),
      parse(idSchema.nullable(), variantId)
    )
  })
}

export async function createPurchase(input: PurchaseInput) {
  return run(async () => {
    input = parse(purchaseSchema, input)
    const user = await requireShop(input.shopId)
    const isOwner = user.role === "owner"
    const paid = isOwner ? Math.max(0, input.paid) : 0

    return db.transaction(async (tx) => {
      const [product] = await tx
        .select()
        .from(products)
        .where(
          and(
            eq(products.id, input.productId),
            eq(products.shopId, input.shopId)
          )
        )
      if (!product) throw new ActionError(ERRORS.productNotFound)
      if (product.hasVariants && !input.variantId)
        throw new ActionError(ERRORS.pickVariant)

      const [supplier] = await tx
        .select({ id: suppliers.id })
        .from(suppliers)
        .where(
          and(
            eq(suppliers.id, input.supplierId),
            eq(suppliers.shopId, input.shopId)
          )
        )
      if (!supplier) throw new ActionError(ERRORS.pickSupplier)

      const cost =
        isOwner && input.cost !== null && input.cost >= 0
          ? input.cost
          : await lastCost(tx, product.id, input.variantId)

      if (paid > roundMoney(input.qty * cost)) {
        throw new ActionError(ERRORS.paidMoreThanTotal)
      }

      const [row] = await tx
        .insert(purchases)
        .values({
          shopId: input.shopId,
          supplierId: input.supplierId,
          productId: product.id,
          variantId: input.variantId,
          qty: input.qty,
          cost,
          paid,
        })
        .returning()

      if (input.variantId) {
        const [v] = await tx
          .update(productVariants)
          .set({ stockQty: sql`${productVariants.stockQty} + ${input.qty}` })
          .where(
            and(
              eq(productVariants.id, input.variantId),
              eq(productVariants.productId, product.id)
            )
          )
          .returning({ id: productVariants.id })
        if (!v) throw new ActionError(ERRORS.variantNotFound)
        await tx
          .update(products)
          .set({ costPrice: cost })
          .where(eq(products.id, product.id))
      } else {
        await tx
          .update(products)
          .set({
            stockQty: sql`${products.stockQty} + ${input.qty}`,
            costPrice: cost,
          })
          .where(eq(products.id, product.id))
      }

      await tx
        .update(suppliers)
        .set({
          payableBalance: sql`${suppliers.payableBalance} + ${roundMoney(input.qty * cost - paid)}`,
        })
        .where(eq(suppliers.id, input.supplierId))

      return row
    })
  })
}

/** Last 100 stock-ins with names. Staff don't see cost or paid. */
export async function getPurchases(shopId: ID) {
  return run(async (): Promise<PurchaseRow[]> => {
    const user = await requireShop(parse(idSchema, shopId))
    const rows = await db
      .select({
        purchase: purchases,
        productName: products.name,
        unit: products.unit,
        size: productVariants.size,
        color: productVariants.color,
        supplierName: suppliers.name,
      })
      .from(purchases)
      .innerJoin(products, eq(purchases.productId, products.id))
      .innerJoin(suppliers, eq(purchases.supplierId, suppliers.id))
      .leftJoin(productVariants, eq(purchases.variantId, productVariants.id))
      .where(eq(purchases.shopId, shopId))
      .orderBy(desc(purchases.createdAt))
      .limit(100)
    const isOwner = user.role === "owner"
    return rows.map((r) => ({
      ...r.purchase,
      cost: isOwner ? r.purchase.cost : 0,
      paid: isOwner ? r.purchase.paid : 0,
      productName: r.productName,
      unit: r.unit,
      variant: variantLabel(r) || null,
      supplierName: r.supplierName,
    }))
  })
}
