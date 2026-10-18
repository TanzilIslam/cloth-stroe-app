// POS: sale, partial pay, returns, stock checks and rollback, shop access.
import { count, eq } from "drizzle-orm"
import { beforeEach, describe, expect, it } from "vitest"

import { createSale, getSales, searchProducts } from "@/actions/sales"
import { db } from "@/db"
import {
  customers,
  products,
  productVariants,
  saleItems,
  sales,
} from "@/db/schema"
import { shopDay } from "@/lib/utils"
import type { SaleInput } from "@/types"

import { err, loginAs, ok, PIN } from "./helpers"

const stockOf = async (id: number) =>
  (await db.select().from(products).where(eq(products.id, id)))[0].stockQty
const variantStock = async (id: number) =>
  (await db.select().from(productVariants).where(eq(productVariants.id, id)))[0]
    .stockQty
const saleCount = async () => (await db.select({ n: count() }).from(sales))[0].n

/** A sale for the men's shop with sensible defaults. */
const sale = (over: Partial<SaleInput>): SaleInput => ({
  shopId: 1,
  userId: 2,
  customerId: null,
  items: [],
  discount: 0,
  paid: 0,
  method: "cash",
  ...over,
})

describe("createSale (staff, men's shop)", () => {
  beforeEach(async () => {
    await loginAs(PIN.rahim)
  })

  it("cash sale lowers stock and stores the cost snapshot", async () => {
    const before = await stockOf(1)
    const s = ok(
      await createSale(
        sale({
          userId: 1,
          items: [{ productId: 1, variantId: null, qty: 2.5, price: 900 }],
          paid: 2250,
        })
      )
    )
    expect(s).toMatchObject({
      total: 2250,
      paid: 2250,
      due: 0,
      method: "cash",
      userId: 2,
    }) // session user, not input
    expect(await stockOf(1)).toBe(before - 2.5)
    const [item] = await db
      .select()
      .from(saleItems)
      .where(eq(saleItems.saleId, s.id))
    expect(item).toMatchObject({ qty: 2.5, price: 900, costSnapshot: 650 })
  })

  it("partial pay records the due on the customer", async () => {
    const [c] = await db.select().from(customers).where(eq(customers.id, 2))
    const s = ok(
      await createSale(
        sale({
          customerId: 2,
          items: [{ productId: 5, variantId: null, qty: 3, price: 430 }],
          paid: 1000,
        })
      )
    )
    expect(s).toMatchObject({
      total: 1290,
      paid: 1000,
      due: 290,
      method: "cash",
    })
    const [after] = await db.select().from(customers).where(eq(customers.id, 2))
    expect(after.dueBalance).toBe(c.dueBalance + 290)
  })

  it("a due needs a customer", async () => {
    const n = await saleCount()
    expect(
      err(
        await createSale(
          sale({
            items: [{ productId: 5, variantId: null, qty: 1, price: 430 }],
            paid: 0,
          })
        )
      )
    ).toBe("Pick a customer for the due amount")
    expect(await saleCount()).toBe(n)
  })

  it("not enough stock rolls back the whole sale", async () => {
    const n = await saleCount()
    const before = await stockOf(1)
    const result = await createSale(
      sale({
        items: [
          { productId: 1, variantId: null, qty: 1, price: 900 },
          { productId: 6, variantId: null, qty: 999, price: 400 },
        ],
        paid: 400_500, // 900 + 999 × 400, so no due and the stock check is what fails
      })
    )
    expect(err(result)).toBe("Not enough stock")
    expect(await stockOf(1)).toBe(before) // first item undone
    expect(await saleCount()).toBe(n)
  })

  it("a return (negative qty) adds stock back and refunds cash", async () => {
    const before = await stockOf(3)
    const s = ok(
      await createSale(
        sale({
          items: [{ productId: 3, variantId: null, qty: -1, price: 320 }],
          paid: -320,
        })
      )
    )
    expect(s).toMatchObject({ total: -320, paid: -320, due: 0, method: "cash" })
    expect(await stockOf(3)).toBe(before + 1)
  })

  it("staff can't sell in another shop", async () => {
    expect(
      err(
        await createSale(
          sale({
            shopId: 2,
            items: [{ productId: 9, variantId: null, qty: 1, price: 6500 }],
          })
        )
      )
    ).toBe("Not your shop")
  })

  it("rejects invalid input", async () => {
    expect(err(await createSale(sale({ items: [] })))).toBe("Cart is empty")
    expect(
      err(
        await createSale(
          sale({
            items: [{ productId: 1, variantId: null, qty: 0, price: 900 }],
          })
        )
      )
    ).toBe("Qty can't be 0")
  })

  it("new sales show in today's history with items and staff", async () => {
    const list = ok(await getSales(1, shopDay()))
    expect(list.length).toBeGreaterThan(0)
    const latest = list[0]
    expect(latest.userName).toBe("Rahim")
    expect(latest.items.length).toBeGreaterThan(0)
  })
})

describe("cost price visibility", () => {
  it("staff get cost 0, owner gets the real cost", async () => {
    await loginAs(PIN.rahim)
    const [staffView] = ok(await searchProducts(1, "Suit Fabric Navy"))
    expect(staffView.costPrice).toBe(0)

    await loginAs(PIN.owner)
    const [ownerView] = ok(await searchProducts(1, "Suit Fabric Navy"))
    expect(ownerView.costPrice).toBe(650)
  })
})

describe("variants (women's shop)", () => {
  it("sells from the variant's stock and stops at zero", async () => {
    await loginAs(PIN.karima)
    const before = await variantStock(3) // XL · Red
    ok(
      await createSale({
        shopId: 2,
        userId: 3,
        customerId: null,
        items: [{ productId: 7, variantId: 3, qty: before, price: 2600 }],
        discount: 0,
        paid: before * 2600,
        method: "cash",
      })
    )
    expect(await variantStock(3)).toBe(0)

    const again = await createSale({
      shopId: 2,
      userId: 3,
      customerId: null,
      items: [{ productId: 7, variantId: 3, qty: 1, price: 2600 }],
      discount: 0,
      paid: 2600,
      method: "cash",
    })
    expect(err(again)).toMatch(/Not enough stock/)
  })
})
