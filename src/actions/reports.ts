"use server"

// Reports for the dashboard, stock alerts and the monthly report.
// Day / hour / weekday grouping is in Dhaka time (see db/time.ts).
import { and, eq, gte, inArray, max, sql } from "drizzle-orm"

import { db } from "@/db"
import {
  customers,
  expenses,
  products,
  productVariants,
  saleItems,
  sales,
} from "@/db/schema"
import { daysAgo, local, sum, todayStart, TZ } from "@/db/sql"
import { ActionError, parse, run } from "@/lib/action"
import { ERRORS } from "@/lib/errors"
import { calcReorderQty, daysSince } from "@/lib/calc"
import { requireOwner, requireShop, requireUser } from "@/lib/session"
import type {
  Bestsellers,
  DashboardStats,
  DeadStockRow,
  ID,
  LowStockRow,
  MonthRow,
  NamedValue,
  PeakTimes,
} from "@/types"
import {
  daysSchema,
  idSchema,
  monthsSchema,
  shopIdsSchema,
} from "@/types/validations"

const netSale = sql`${sales.total} - ${sales.discount}`
const itemProfit = sql`(${saleItems.price} - ${saleItems.costSnapshot}) * ${saleItems.qty}`

/** Owner may pass several shops; staff only their own. */
async function allowShops(shopIds: ID[]) {
  const user = await requireUser()
  shopIds = parse(shopIdsSchema, shopIds)
  if (user.role !== "owner" && shopIds.some((id) => id !== user.shopId)) {
    throw new ActionError(ERRORS.notYourShop)
  }
  return user
}

// --- dashboard ---

export async function getDashboard(shopIds: ID[]) {
  return run(async (): Promise<DashboardStats> => {
    const user = await allowShops(shopIds)
    const inToday = and(
      inArray(sales.shopId, shopIds),
      gte(sales.createdAt, todayStart)
    )
    const [[s], [items], [d]] = await Promise.all([
      db
        .select({
          sale: sum(netSale),
          discount: sum(sales.discount),
          cash: sum(
            sql`case when ${sales.method} = 'cash' then ${sales.paid} else 0 end`
          ),
          count: sql<number>`count(*)`.mapWith(Number),
        })
        .from(sales)
        .where(inToday),
      db
        .select({ profit: sum(itemProfit) })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .where(inToday),
      db
        .select({ dues: sum(customers.dueBalance) })
        .from(customers)
        .where(inArray(customers.shopId, shopIds)),
    ])
    const isOwner = user.role === "owner"
    return {
      sale: s.sale,
      profit: isOwner ? items.profit - s.discount : 0, // hidden from staff
      cash: s.cash,
      dues: isOwner ? d.dues : 0,
      count: s.count,
    }
  })
}

/** Today so far vs. the same day last week up to the same time. */
export async function getComparison(shopIds: ID[]) {
  return run(async () => {
    await requireOwner()
    shopIds = parse(shopIdsSchema, shopIds)
    const lastWeekStart = sql`(${todayStart} - interval '7 days')`
    const [row] = await db
      .select({
        today: sum(
          sql`case when ${sales.createdAt} >= ${todayStart} then ${netSale} else 0 end`
        ),
        lastWeek: sum(
          sql`case when ${sales.createdAt} >= ${lastWeekStart} and ${sales.createdAt} <= ${daysAgo(7)} then ${netSale} else 0 end`
        ),
      })
      .from(sales)
      .where(
        and(inArray(sales.shopId, shopIds), gte(sales.createdAt, lastWeekStart))
      )
    return row
  })
}

export async function getBestsellers(shopIds: ID[], days = 30) {
  return run(async (): Promise<Bestsellers> => {
    await requireOwner()
    shopIds = parse(shopIdsSchema, shopIds)
    days = parse(daysSchema, days)
    const top = async (
      key:
        typeof products.name | typeof products.brand | typeof products.category
    ) => {
      const value = sum(sql`${saleItems.qty} * ${saleItems.price}`)
      const rows = await db
        .select({ label: key, value })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .innerJoin(products, eq(saleItems.productId, products.id))
        .where(
          and(
            inArray(sales.shopId, shopIds),
            gte(sales.createdAt, daysAgo(days)),
            sql`${key} is not null`
          )
        )
        .groupBy(key)
        .orderBy(sql`2 desc`)
        .limit(5)
      return rows as NamedValue[]
    }
    const [p, b, c] = await Promise.all([
      top(products.name),
      top(products.brand),
      top(products.category),
    ])
    return { products: p, brands: b, categories: c }
  })
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const hourLabel = (h: number) => `${h % 12 || 12}${h < 12 ? "a" : "p"}`

export async function getPeakTimes(shopIds: ID[], days = 30) {
  return run(async (): Promise<PeakTimes> => {
    await requireOwner()
    shopIds = parse(shopIdsSchema, shopIds)
    days = parse(daysSchema, days)
    const where = and(
      inArray(sales.shopId, shopIds),
      gte(sales.createdAt, daysAgo(days))
    )
    const hourExpr =
      sql<number>`extract(hour from ${local(sales.createdAt)})`.mapWith(Number)
    const dowExpr =
      sql<number>`extract(dow from ${local(sales.createdAt)})`.mapWith(Number)
    const [byHour, byDay] = await Promise.all([
      db
        .select({ k: hourExpr, v: sum(netSale) })
        .from(sales)
        .where(where)
        .groupBy(sql`1`),
      db
        .select({ k: dowExpr, v: sum(netSale) })
        .from(sales)
        .where(where)
        .groupBy(sql`1`),
    ])
    const get = (rows: { k: number; v: number }[], k: number) =>
      rows.find((r) => r.k === k)?.v ?? 0
    return {
      hours: Array.from({ length: 12 }, (_, i) => i + 10).map((h) => ({
        label: hourLabel(h),
        value: get(byHour, h),
      })),
      // Bangladesh week starts Saturday
      days: [6, 0, 1, 2, 3, 4, 5].map((d) => ({
        label: WEEKDAYS[d],
        value: get(byDay, d),
      })),
    }
  })
}

export async function getMonthlyReport(shopIds: ID[], months = 6) {
  return run(async (): Promise<MonthRow[]> => {
    await requireOwner()
    shopIds = parse(shopIdsSchema, shopIds)
    months = parse(monthsSchema, months)
    const from = sql`(date_trunc('month', now() AT TIME ZONE ${TZ}) - make_interval(months => ${months - 1})) AT TIME ZONE ${TZ}`
    const month = (col: unknown) =>
      sql<string>`to_char(${local(col)}, 'YYYY-MM')`
    const [s, i, e] = await Promise.all([
      db
        .select({
          m: month(sales.createdAt),
          sales: sum(netSale),
          discount: sum(sales.discount),
        })
        .from(sales)
        .where(and(inArray(sales.shopId, shopIds), gte(sales.createdAt, from)))
        .groupBy(sql`1`),
      db
        .select({ m: month(sales.createdAt), profit: sum(itemProfit) })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .where(and(inArray(sales.shopId, shopIds), gte(sales.createdAt, from)))
        .groupBy(sql`1`),
      db
        .select({ m: month(expenses.date), amount: sum(expenses.amount) })
        .from(expenses)
        .where(and(inArray(expenses.shopId, shopIds), gte(expenses.date, from)))
        .groupBy(sql`1`),
    ])
    const keys = [...new Set([...s, ...e].map((r) => r.m))].sort().reverse()
    return keys.map((m) => {
      const sale = s.find((r) => r.m === m)
      const gross =
        (i.find((r) => r.m === m)?.profit ?? 0) - (sale?.discount ?? 0)
      const exp = e.find((r) => r.m === m)?.amount ?? 0
      const [y, mo] = m.split("-").map(Number)
      return {
        month: new Date(y, mo - 1, 1).toLocaleDateString("en-GB", {
          month: "short",
          year: "numeric",
        }),
        sales: sale?.sales ?? 0,
        gross,
        expenses: exp,
        net: gross - exp,
      }
    })
  })
}

// --- stock alerts ---

export async function getLowStock(shopId: ID) {
  return run(async (): Promise<LowStockRow[]> => {
    await requireShop(parse(idSchema, shopId))
    const [prods, vars, sold] = await Promise.all([
      db
        .select()
        .from(products)
        .where(and(eq(products.shopId, shopId), eq(products.active, true))),
      db
        .select({ v: productVariants })
        .from(productVariants)
        .innerJoin(products, eq(productVariants.productId, products.id))
        .where(eq(products.shopId, shopId)),
      db
        .select({
          productId: saleItems.productId,
          variantId: saleItems.variantId,
          qty: sum(saleItems.qty),
        })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .where(and(eq(sales.shopId, shopId), gte(sales.createdAt, daysAgo(30))))
        .groupBy(saleItems.productId, saleItems.variantId),
    ])
    const rows: LowStockRow[] = []
    for (const product of prods) {
      const items = product.hasVariants
        ? vars.map((r) => r.v).filter((v) => v.productId === product.id)
        : [null]
      for (const variant of items) {
        const stock = variant ? variant.stockQty : product.stockQty
        // Variants share the product's low level, split across them
        const lowAt = variant
          ? Math.max(1, Math.ceil(product.lowStockAt / items.length))
          : product.lowStockAt
        if (stock > lowAt) continue
        const soldQty = sold
          .filter(
            (r) =>
              r.productId === product.id &&
              (variant === null || r.variantId === variant.id)
          )
          .reduce((a, r) => a + r.qty, 0)
        rows.push({
          product,
          variant,
          stock,
          reorderQty: calcReorderQty(soldQty, stock, lowAt),
        })
      }
    }
    return rows.sort((a, b) => a.stock - b.stock)
  })
}

/** In stock but not sold for 60+ days. */
export async function getDeadStock(shopId: ID) {
  return run(async (): Promise<DeadStockRow[]> => {
    await requireShop(parse(idSchema, shopId))
    const variantStock =
      sql<number>`(SELECT coalesce(sum(${productVariants.stockQty}), 0) FROM ${productVariants} WHERE ${productVariants.productId} = ${products.id})`.mapWith(
        Number
      )
    const lastSold = db
      .select({
        productId: saleItems.productId,
        at: max(sales.createdAt).as("at"),
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .groupBy(saleItems.productId)
      .as("last_sold")
    const rows = await db
      .select({ product: products, variantStock, lastSoldAt: lastSold.at })
      .from(products)
      .leftJoin(lastSold, eq(lastSold.productId, products.id))
      .where(
        and(
          eq(products.shopId, shopId),
          eq(products.active, true),
          sql`(${lastSold.at} is null or ${lastSold.at} < ${daysAgo(60)})`
        )
      )
    return rows
      .map((r) => ({
        product: r.product,
        stock: r.product.hasVariants ? r.variantStock : r.product.stockQty,
        lastSoldAt: r.lastSoldAt ? new Date(r.lastSoldAt) : null,
      }))
      .filter(
        (r) => r.stock > 0 && (!r.lastSoldAt || daysSince(r.lastSoldAt) >= 60)
      )
  })
}
