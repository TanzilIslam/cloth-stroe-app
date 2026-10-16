// Owner-only actions, staff accounts and product rules.
import { describe, expect, it } from "vitest"

import { getUsers } from "@/actions/users"
import { createUser, setUserActive, updateUser } from "@/actions/users"
import {
  createProduct,
  deleteVariant,
  getProducts,
  updateProduct,
} from "@/actions/products"
import { getComparison } from "@/actions/reports"
import type { ProductInput } from "@/types"

import { err, loginAs, ok, PIN, saveSession, useSession } from "./helpers"

const newProduct: ProductInput = {
  shopId: 1,
  name: "Linen Shirt Fabric",
  brand: "",
  category: "Shirt",
  unit: "yard",
  costPrice: 350,
  sellPrice: 500,
  stockQty: 20,
  lowStockAt: 5,
  barcode: null,
  hasVariants: false,
}

describe("owner only", () => {
  it("staff can't manage products, users or owner reports", async () => {
    await loginAs(PIN.rahim)
    expect(err(await createProduct(newProduct))).toBe("Owner only")
    expect(err(await updateProduct(1, { sellPrice: 1 }))).toBe("Owner only")
    expect(err(await getUsers())).toBe("Owner only")
    expect(err(await getComparison([1]))).toBe("Owner only")
  })
})

describe("products", () => {
  it("owner creates a product; empty brand is stored as null", async () => {
    await loginAs(PIN.owner)
    const p = ok(await createProduct(newProduct))
    expect(p).toMatchObject({
      name: "Linen Shirt Fabric",
      brand: null,
      stockQty: 20,
      active: true,
    })
  })

  it("validates prices", async () => {
    await loginAs(PIN.owner)
    expect(err(await createProduct({ ...newProduct, sellPrice: 0 }))).toBe(
      "Sell price must be more than 0"
    )
    expect(err(await createProduct({ ...newProduct, name: "  " }))).toBe(
      "Name is required"
    )
  })

  it("an edit never changes stock", async () => {
    await loginAs(PIN.owner)
    const before = ok(await getProducts(1)).find((p) => p.id === 1)!
    ok(await updateProduct(1, { sellPrice: 950, stockQty: 9999 }))
    const after = ok(await getProducts(1)).find((p) => p.id === 1)!
    expect(after.sellPrice).toBe(950)
    expect(after.stockQty).toBe(before.stockQty)
  })

  it("a variant with stock can't be deleted", async () => {
    await loginAs(PIN.owner)
    expect(err(await deleteVariant(1))).toBe("Variant still has stock")
  })
})

describe("staff accounts", () => {
  it("PINs must be unique", async () => {
    await loginAs(PIN.owner)
    expect(
      err(
        await createUser({
          name: "Salma",
          role: "staff",
          shopId: 2,
          pin: PIN.rahim,
        })
      )
    ).toBe("PIN already used, pick another")
    const u = ok(
      await createUser({ name: "Salma", role: "staff", shopId: 2, pin: "4444" })
    )
    expect(u).toMatchObject({ name: "Salma", role: "staff", active: true })
    expect((await loginAs("4444")).shopId).toBe(2)
  })

  it("owner can't deactivate themselves or remove the last owner", async () => {
    await loginAs(PIN.owner)
    expect(err(await setUserActive(1, false))).toBe(
      "You can't deactivate yourself"
    )
    expect(
      err(
        await updateUser(1, {
          name: "Owner",
          role: "staff",
          shopId: 1,
          pin: null,
        })
      )
    ).toBe("At least one active owner is needed")
  })

  it("a role change applies without a re-login", async () => {
    await loginAs(PIN.rahim)
    const rahim = saveSession()
    expect(err(await getUsers())).toBe("Owner only")

    await loginAs(PIN.owner)
    ok(
      await updateUser(2, {
        name: "Rahim",
        role: "owner",
        shopId: 1,
        pin: null,
      })
    )

    useSession(rahim)
    expect(ok(await getUsers()).length).toBeGreaterThan(0)

    await loginAs(PIN.owner)
    ok(
      await updateUser(2, {
        name: "Rahim",
        role: "staff",
        shopId: 1,
        pin: null,
      })
    )
  })
})
