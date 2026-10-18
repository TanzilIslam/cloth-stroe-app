import { describe, expect, it } from "vitest"

import {
  expenseSchema,
  partySchema,
  paymentSchema,
  pinSchema,
  productSchema,
  purchaseSchema,
  saleSchema,
  shopIdsSchema,
  userSchema,
  variantSchema,
} from "@/types/validations"

/** First error message, or "OK". */
const check = (
  schema: {
    safeParse: (v: unknown) => {
      success: boolean
      error?: { issues: { message: string }[] }
    }
  },
  value: unknown
) => {
  const r = schema.safeParse(value)
  return r.success ? "OK" : r.error!.issues[0].message
}

const sale = {
  shopId: 1,
  userId: 2,
  customerId: null,
  items: [{ productId: 1, variantId: null, qty: 2.5, price: 900 }],
  discount: 0,
  paid: 2250,
  method: "cash",
}

const product = {
  shopId: 1,
  name: " Linen ",
  brand: "",
  category: "Shirt",
  unit: "yard",
  costPrice: 300,
  sellPrice: 500,
  stockQty: 10,
  lowStockAt: 5,
  barcode: null,
  hasVariants: false,
}

describe("saleSchema", () => {
  it("accepts a normal sale and a return", () => {
    expect(check(saleSchema, sale)).toBe("OK")
    expect(
      check(saleSchema, {
        ...sale,
        items: [{ ...sale.items[0], qty: -1 }],
        paid: -900,
      })
    ).toBe("OK")
  })
  it("rejects bad carts", () => {
    expect(check(saleSchema, { ...sale, items: [] })).toBe("Cart is empty")
    expect(
      check(saleSchema, { ...sale, items: [{ ...sale.items[0], qty: 0 }] })
    ).toBe("Qty can't be 0")
    expect(check(saleSchema, { ...sale, discount: -5 })).toBe(
      "Discount can't be negative"
    )
    expect(check(saleSchema, { ...sale, shopId: "1" })).not.toBe("OK")
    expect(check(saleSchema, { ...sale, method: "card" })).not.toBe("OK")
  })
})

describe("productSchema", () => {
  it("trims text and turns empty optional text into null", () => {
    expect(productSchema.parse(product)).toMatchObject({
      name: "Linen",
      brand: null,
    })
  })
  it("needs a name, a price above 0 and a known unit", () => {
    expect(check(productSchema, { ...product, name: "  " })).toBe(
      "Name is required"
    )
    expect(check(productSchema, { ...product, sellPrice: 0 })).toBe(
      "Sell price must be more than 0"
    )
    expect(check(productSchema, { ...product, costPrice: -1 })).toBe(
      "Cost price can't be negative"
    )
    expect(check(productSchema, { ...product, unit: "kg" })).not.toBe("OK")
  })
})

describe("other inputs", () => {
  it("pin is exactly 4 digits", () => {
    expect(check(pinSchema, "1234")).toBe("OK")
    expect(check(pinSchema, "12a4")).toBe("PIN must be 4 digits")
    expect(check(pinSchema, "12345")).toBe("PIN must be 4 digits")
  })
  it("variant needs a size or a color", () => {
    expect(check(variantSchema, { productId: 7, size: " ", color: null })).toBe(
      "Add a size or color"
    )
    expect(check(variantSchema, { productId: 7, size: "M", color: null })).toBe(
      "OK"
    )
  })
  it("purchase qty must be above 0", () => {
    const p = {
      shopId: 1,
      supplierId: 1,
      productId: 1,
      variantId: null,
      qty: -1,
      cost: null,
      paid: 0,
    }
    expect(check(purchaseSchema, p)).toBe("Qty must be more than 0")
  })
  it("phone is digits only", () => {
    expect(check(partySchema, { shopId: 1, name: "A", phone: "abc" })).toBe(
      "Phone: digits only"
    )
    expect(check(partySchema, { shopId: 1, name: "A", phone: "" })).toBe("OK")
  })
  it("payment is cash or bKash and above 0", () => {
    const pay = {
      shopId: 1,
      partyType: "customer",
      partyId: 1,
      amount: 10,
      method: "cash",
    }
    expect(check(paymentSchema, pay)).toBe("OK")
    expect(check(paymentSchema, { ...pay, method: "due" })).toBe(
      "Pick cash or bKash"
    )
    expect(check(paymentSchema, { ...pay, amount: 0 })).toBe(
      "Amount must be more than 0"
    )
  })
  it("expense needs a known category", () => {
    expect(
      check(expenseSchema, {
        shopId: 1,
        category: "food",
        amount: 10,
        note: null,
      })
    ).toBe("Pick a category")
  })
  it("user PIN may be null on edit", () => {
    expect(
      check(userSchema, { name: "Salma", role: "staff", shopId: 2, pin: null })
    ).toBe("OK")
    expect(
      check(userSchema, { name: "Salma", role: "staff", shopId: 2, pin: "44" })
    ).toBe("PIN must be 4 digits")
  })
  it("reports need at least one shop", () => {
    expect(check(shopIdsSchema, [])).toBe("Pick a shop")
  })
})
