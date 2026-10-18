// Shared product reads used by several action files.
import "server-only"

import { inArray } from "drizzle-orm"

import type { Product, ProductWithVariants, SessionUser } from "@/types"

import { db } from "."
import { productVariants } from "./schema"

/** Attach variants to products in one query. */
export async function withVariants(
  rows: Product[]
): Promise<ProductWithVariants[]> {
  if (rows.length === 0) return []
  const vs = await db
    .select()
    .from(productVariants)
    .where(
      inArray(
        productVariants.productId,
        rows.map((p) => p.id)
      )
    )
  return rows.map((p) => ({
    ...p,
    variants: vs.filter((v) => v.productId === p.id),
  }))
}

/** Staff never receive cost prices. */
export function forUser<T extends Product>(user: SessionUser, rows: T[]): T[] {
  return user.role === "owner"
    ? rows
    : rows.map((p) => ({ ...p, costPrice: 0 }))
}
