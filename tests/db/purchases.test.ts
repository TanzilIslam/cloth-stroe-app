// Stock in: stock, cost and supplier balance; staff can't set cost or paid.
import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import { createPurchase, getLastCost, getPurchases } from "@/actions/purchases"
import { db } from "@/db"
import { products, productVariants, suppliers } from "@/db/schema"

import { err, loginAs, ok, PIN } from "./helpers"

const product = async (id: number) =>
  (await db.select().from(products).where(eq(products.id, id)))[0]
const payable = async (id: number) =>
  (await db.select().from(suppliers).where(eq(suppliers.id, id)))[0]
    .payableBalance

describe("createPurchase", () => {
  it("owner: stock, cost price and supplier balance change together", async () => {
    await loginAs(PIN.owner)
    const before = await product(6)
    const owed = await payable(1)
    ok(
      await createPurchase({
        shopId: 1,
        supplierId: 1,
        productId: 6,
        variantId: null,
        qty: 10,
        cost: 290,
        paid: 1000,
      })
    )
    const after = await product(6)
    expect(after.stockQty).toBe(before.stockQty + 10)
    expect(after.costPrice).toBe(290)
    expect(await payable(1)).toBe(owed + 10 * 290 - 1000)
  })

  it("staff: cost and paid are ignored (last cost, paid 0)", async () => {
    await loginAs(PIN.rahim)
    const owed = await payable(1)
    const row = ok(
      await createPurchase({
        shopId: 1,
        supplierId: 1,
        productId: 1,
        variantId: null,
        qty: 5,
        cost: 999,
        paid: 5000,
      })
    )
    expect(row.cost).toBe(650) // last stock-in cost from the seed
    expect(row.paid).toBe(0)
    expect(await payable(1)).toBe(owed + 5 * 650)
    expect((await product(1)).costPrice).toBe(650)
  })

  it("staff can't read cost prices", async () => {
    await loginAs(PIN.rahim)
    expect(err(await getLastCost(1, null))).toBe("Owner only")
  })

  it("supplier must belong to the shop", async () => {
    await loginAs(PIN.owner)
    expect(
      err(
        await createPurchase({
          shopId: 1,
          supplierId: 2,
          productId: 1,
          variantId: null,
          qty: 1,
          cost: 600,
          paid: 0,
        })
      )
    ).toBe("Pick a supplier")
  })

  it("variant products need a variant, and stock goes to that variant", async () => {
    await loginAs(PIN.karima)
    expect(
      err(
        await createPurchase({
          shopId: 2,
          supplierId: 2,
          productId: 7,
          variantId: null,
          qty: 2,
          cost: null,
          paid: 0,
        })
      )
    ).toBe("Pick a variant")

    const [v] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, 1))
    ok(
      await createPurchase({
        shopId: 2,
        supplierId: 2,
        productId: 7,
        variantId: 1,
        qty: 3,
        cost: null,
        paid: 0,
      })
    )
    const [after] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, 1))
    expect(after.stockQty).toBe(v.stockQty + 3)
  })

  it("rejects a qty of 0 or less", async () => {
    await loginAs(PIN.owner)
    expect(
      err(
        await createPurchase({
          shopId: 1,
          supplierId: 1,
          productId: 1,
          variantId: null,
          qty: 0,
          cost: 600,
          paid: 0,
        })
      )
    ).toBe("Qty must be more than 0")
  })
})

describe("getPurchases", () => {
  it("hides cost and paid from staff", async () => {
    await loginAs(PIN.rahim)
    const staffRows = ok(await getPurchases(1))
    expect(staffRows.length).toBeGreaterThan(0)
    expect(staffRows.every((r) => r.cost === 0 && r.paid === 0)).toBe(true)

    await loginAs(PIN.owner)
    const ownerRows = ok(await getPurchases(1))
    expect(ownerRows.some((r) => r.cost > 0)).toBe(true)
    expect(ownerRows[0]).toHaveProperty("supplierName")
  })
})
