"use server"

// POS: product search, recent products, create sale (stock + due in one transaction).
import { and, desc, eq, gte, ilike, inArray, lt, or, sql } from "drizzle-orm"

import { db } from "@/db"
import { forUser, withVariants } from "@/db/products"
import {
  customers,
  products,
  productVariants,
  saleItems,
  sales,
  users,
} from "@/db/schema"
import { dayStart } from "@/db/time"
import { ActionError, parse, run } from "@/lib/action"
import { requireShop } from "@/lib/session"
import type { ID, SaleDetail, SaleInput } from "@/types"
import {
  daySchema,
  idSchema,
  limitSchema,
  saleSchema,
  searchSchema,
} from "@/types/validations"

export async function searchProducts(shopId: ID, query: string) {
  return run(async () => {
    const user = await requireShop(parse(idSchema, shopId))
    const q = parse(searchSchema, query).trim()
    if (!q) return []
    const like = `%${q}%`
    const rows = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.shopId, shopId),
          eq(products.active, true),
          or(
            eq(products.barcode, q),
            ilike(products.name, like),
            ilike(products.brand, like),
            ilike(products.category, like)
          )
        )
      )
      .limit(30)
    return forUser(user, await withVariants(rows))
  })
}

/** Most recently sold products first, then the rest. */
export async function getRecentProducts(shopId: ID, limit = 12) {
  return run(async () => {
    const user = await requireShop(parse(idSchema, shopId))
    limit = parse(limitSchema, limit)
    const lastSold = sql`(SELECT max(${saleItems.id}) FROM ${saleItems} WHERE ${saleItems.productId} = ${products.id})`
    const rows = await db
      .select()
      .from(products)
      .where(and(eq(products.shopId, shopId), eq(products.active, true)))
      .orderBy(sql`${lastSold} DESC NULLS LAST`, products.id)
      .limit(limit)
    return forUser(user, await withVariants(rows))
  })
}

export async function createSale(raw: SaleInput) {
  return run(async () => {
    const input = parse(saleSchema, raw)
    const user = await requireShop(input.shopId)

    const total = input.items.reduce((s, i) => s + i.qty * i.price, 0)
    const net = total - input.discount
    const refund = net < 0
    const paid = refund ? net : Math.min(Math.max(0, input.paid), net)
    const due = refund ? 0 : net - paid
    const method = refund
      ? "cash"
      : paid === 0 && net > 0
        ? "due"
        : input.method
    if (due > 0 && !input.customerId)
      throw new ActionError("Pick a customer for the due amount")

    return db.transaction(async (tx) => {
      if (input.customerId) {
        const [c] = await tx
          .select({ id: customers.id })
          .from(customers)
          .where(
            and(
              eq(customers.id, input.customerId),
              eq(customers.shopId, input.shopId)
            )
          )
        if (!c) throw new ActionError("Customer not found")
      }

      const [sale] = await tx
        .insert(sales)
        .values({
          shopId: input.shopId,
          userId: user.id, // from the session, never the client
          customerId: input.customerId,
          total,
          discount: input.discount,
          paid,
          due,
          method,
        })
        .returning()

      for (const item of input.items) {
        // Atomic stock update: fails if the shop doesn't have enough
        const [product] = await tx
          .update(products)
          .set({
            stockQty: item.variantId
              ? products.stockQty
              : sql`${products.stockQty} - ${item.qty}`,
          })
          .where(
            and(
              eq(products.id, item.productId),
              eq(products.shopId, input.shopId),
              item.variantId
                ? undefined
                : sql`${products.stockQty} >= ${item.qty}`
            )
          )
          .returning({ costPrice: products.costPrice, name: products.name })
        if (!product) throw new ActionError("Not enough stock")

        if (item.variantId) {
          const [variant] = await tx
            .update(productVariants)
            .set({ stockQty: sql`${productVariants.stockQty} - ${item.qty}` })
            .where(
              and(
                eq(productVariants.id, item.variantId),
                eq(productVariants.productId, item.productId),
                sql`${productVariants.stockQty} >= ${item.qty}`
              )
            )
            .returning({ id: productVariants.id })
          if (!variant)
            throw new ActionError(`Not enough stock: ${product.name}`)
        }

        await tx.insert(saleItems).values({
          saleId: sale.id,
          productId: item.productId,
          variantId: item.variantId,
          qty: item.qty,
          price: item.price,
          costSnapshot: product.costPrice,
        })
      }

      if (due > 0 && input.customerId) {
        await tx
          .update(customers)
          .set({ dueBalance: sql`${customers.dueBalance} + ${due}` })
          .where(eq(customers.id, input.customerId))
      }

      return sale
    })
  })
}

/** One day's sales (shop time), newest first, with items, staff and customer. */
export async function getSales(shopId: ID, day: string) {
  return run(async (): Promise<SaleDetail[]> => {
    await requireShop(parse(idSchema, shopId))
    day = parse(daySchema, day)
    const rows = await db
      .select({
        sale: sales,
        userName: users.name,
        customerName: customers.name,
      })
      .from(sales)
      .innerJoin(users, eq(sales.userId, users.id))
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .where(
        and(
          eq(sales.shopId, shopId),
          gte(sales.createdAt, dayStart(day)),
          lt(sales.createdAt, dayStart(day, 1))
        )
      )
      .orderBy(desc(sales.createdAt))
    if (rows.length === 0) return []

    const items = await db
      .select({
        saleId: saleItems.saleId,
        productName: products.name,
        unit: products.unit,
        size: productVariants.size,
        color: productVariants.color,
        qty: saleItems.qty,
        price: saleItems.price,
      })
      .from(saleItems)
      .innerJoin(products, eq(saleItems.productId, products.id))
      .leftJoin(productVariants, eq(saleItems.variantId, productVariants.id))
      .where(
        inArray(
          saleItems.saleId,
          rows.map((r) => r.sale.id)
        )
      )
      .orderBy(saleItems.id)

    return rows.map((r) => ({
      ...r.sale,
      userName: r.userName,
      customerName: r.customerName,
      items: items
        .filter((i) => i.saleId === r.sale.id)
        .map((i) => ({
          productName: i.productName,
          variant: [i.size, i.color].filter(Boolean).join(" · ") || null,
          unit: i.unit,
          qty: i.qty,
          price: i.price,
        })),
    }))
  })
}
