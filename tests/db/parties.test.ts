// Customers, suppliers, dues and payments.
import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import {
  getDues,
  getParties,
  recordPayment,
  saveParty,
  updateParty,
} from "@/actions/parties"
import { db } from "@/db"
import { customers, payments } from "@/db/schema"

import { err, loginAs, ok, PIN } from "./helpers"

const due = async (id: number) =>
  (await db.select().from(customers).where(eq(customers.id, id)))[0].dueBalance

describe("recordPayment (owner)", () => {
  it("receiving from a customer lowers the due and logs a payment", async () => {
    await loginAs(PIN.owner)
    const before = await due(1) // Karim Uddin
    ok(
      await recordPayment({
        shopId: 1,
        partyType: "customer",
        partyId: 1,
        amount: 500,
        method: "cash",
      })
    )
    expect(await due(1)).toBe(before - 500)
    const rows = await db.select().from(payments).where(eq(payments.partyId, 1))
    expect(rows.at(-1)).toMatchObject({
      partyType: "customer",
      amount: 500,
      method: "cash",
    })
  })

  it("can't take more than the balance", async () => {
    await loginAs(PIN.owner)
    const before = await due(1)
    expect(
      err(
        await recordPayment({
          shopId: 1,
          partyType: "customer",
          partyId: 1,
          amount: before + 1,
          method: "cash",
        })
      )
    ).toBe("More than the balance")
    expect(await due(1)).toBe(before)
  })

  it("rejects due as a payment method", async () => {
    await loginAs(PIN.owner)
    expect(
      err(
        await recordPayment({
          shopId: 1,
          partyType: "customer",
          partyId: 1,
          amount: 10,
          method: "due" as "cash",
        })
      )
    ).toBe("Pick cash or bKash")
  })

  it("is owner only", async () => {
    await loginAs(PIN.rahim)
    expect(
      err(
        await recordPayment({
          shopId: 1,
          partyType: "customer",
          partyId: 1,
          amount: 10,
          method: "cash",
        })
      )
    ).toBe("Owner only")
  })
})

describe("getDues", () => {
  it("lists customers and suppliers, oldest first", async () => {
    await loginAs(PIN.owner)
    const rows = ok(await getDues(1))
    expect(rows.map((r) => r.party.name)).toEqual([
      "Karim Uddin",
      "Islampur Fabrics",
    ])
    expect(rows[0].partyType).toBe("customer")
    expect(rows[1].partyType).toBe("supplier")
  })
})

describe("customers and suppliers", () => {
  it("staff can add a customer in their shop; names are trimmed", async () => {
    await loginAs(PIN.rahim)
    const c = ok(
      await saveParty("customer", {
        shopId: 1,
        name: "  Habib  ",
        phone: "01712345678",
      })
    )
    expect(c).toMatchObject({ name: "Habib", dueBalance: 0 })
  })

  it("rejects a bad phone and another shop", async () => {
    await loginAs(PIN.rahim)
    expect(
      err(await saveParty("customer", { shopId: 1, name: "X", phone: "abc" }))
    ).toBe("Phone: digits only")
    expect(err(await getParties("supplier", 2))).toBe("Not your shop")
  })

  it("updateParty edits name and phone only", async () => {
    await loginAs(PIN.owner)
    const s = ok(
      await updateParty("supplier", 1, {
        shopId: 1,
        name: "Islampur Fabrics Ltd",
        phone: "01811000009",
      })
    )
    expect(s).toMatchObject({
      name: "Islampur Fabrics Ltd",
      phone: "01811000009",
    })
    expect("payableBalance" in s && s.payableBalance).toBe(15000)
  })
})
