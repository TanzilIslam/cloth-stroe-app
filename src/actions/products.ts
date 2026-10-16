"use server"

// Products and variants. Reads: shop users (cost hidden for staff). Writes: owner only.
import { and, asc, count, eq } from "drizzle-orm"

import { db } from "@/db"
import { forUser, withVariants } from "@/db/products"
import { products, productVariants, saleItems, shops } from "@/db/schema"
import { ActionError, run } from "@/lib/action"
import { requireOwner, requireShop, requireUser } from "@/lib/session"
import type { ID, ProductInput, VariantInput } from "@/types"

function validate(input: Partial<ProductInput>) {
  if (input.name !== undefined && !input.name.trim())
    throw new ActionError("Name is required")
  if (input.category !== undefined && !input.category.trim())
    throw new ActionError("Category is required")
  if (input.sellPrice !== undefined && input.sellPrice <= 0)
    throw new ActionError("Sell price must be more than 0")
  if (
    (input.costPrice ?? 0) < 0 ||
    (input.stockQty ?? 0) < 0 ||
    (input.lowStockAt ?? 0) < 0
  ) {
    throw new ActionError("Numbers can't be negative")
  }
}

export async function getProducts(shopId: ID) {
  return run(async () => {
    const user = await requireShop(shopId)
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.shopId, shopId))
      .orderBy(asc(products.id))
    return forUser(user, await withVariants(rows))
  })
}

export async function getProduct(id: ID) {
  return run(async () => {
    const user = await requireUser()
    const [row] = await db.select().from(products).where(eq(products.id, id))
    if (!row) return null
    await requireShop(row.shopId)
    const [p] = forUser(user, await withVariants([row]))
    return p
  })
}

export async function createProduct(input: ProductInput) {
  return run(async () => {
    await requireOwner()
    validate(input)
    const [shop] = await db
      .select()
      .from(shops)
      .where(eq(shops.id, input.shopId))
    if (!shop) throw new ActionError("Shop not found")
    const [row] = await db
      .insert(products)
      .values({ ...input, stockQty: input.hasVariants ? 0 : input.stockQty })
      .returning()
    return row
  })
}

export async function updateProduct(id: ID, input: Partial<ProductInput>) {
  return run(async () => {
    await requireOwner()
    validate(input)
    // shopId, stock and hasVariants never change through an edit
    const fields = {
      name: input.name?.trim(),
      brand: input.brand,
      category: input.category?.trim(),
      unit: input.unit,
      costPrice: input.costPrice,
      sellPrice: input.sellPrice,
      lowStockAt: input.lowStockAt,
      barcode: input.barcode,
    }
    const [row] = await db
      .update(products)
      .set(fields)
      .where(eq(products.id, id))
      .returning()
    if (!row) throw new ActionError("Product not found")
    return row
  })
}

export async function toggleProductActive(id: ID) {
  return run(async () => {
    await requireOwner()
    const [row] = await db.select().from(products).where(eq(products.id, id))
    if (!row) throw new ActionError("Product not found")
    const [updated] = await db
      .update(products)
      .set({ active: !row.active })
      .where(eq(products.id, id))
      .returning()
    return updated
  })
}

export async function saveVariant(input: VariantInput) {
  return run(async () => {
    await requireOwner()
    if (!input.size?.trim() && !input.color?.trim())
      throw new ActionError("Add a size or color")
    const fields = {
      size: input.size?.trim() || null,
      color: input.color?.trim() || null,
    }
    if (input.id) {
      const [row] = await db
        .update(productVariants)
        .set(fields)
        .where(eq(productVariants.id, input.id))
        .returning()
      if (!row) throw new ActionError("Variant not found")
      return row
    }
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, input.productId))
    if (!product?.hasVariants) throw new ActionError("Product has no variants")
    const [row] = await db
      .insert(productVariants)
      .values({ productId: input.productId, ...fields })
      .returning()
    return row
  })
}

export async function deleteVariant(id: ID) {
  return run(async () => {
    await requireOwner()
    const [v] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, id))
    if (!v) return
    if (v.stockQty !== 0) throw new ActionError("Variant still has stock")
    const [{ n }] = await db
      .select({ n: count() })
      .from(saleItems)
      .where(and(eq(saleItems.variantId, id)))
    if (n > 0) throw new ActionError("Variant has sales, can't delete")
    await db.delete(productVariants).where(eq(productVariants.id, id))
  })
}
