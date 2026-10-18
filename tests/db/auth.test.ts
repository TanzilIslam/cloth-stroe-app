// Login, session, deactivation and the PIN attempt limit.
import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import { getMe, login, logout } from "@/actions/auth"
import { getProducts } from "@/actions/products"
import { getLoginLocks, setUserActive, unlockLogin } from "@/actions/users"
import { db } from "@/db"
import { loginAttempts } from "@/db/schema"

import { err, loginAs, ok, PIN, saveSession, useSession } from "./helpers"
import { jar, request } from "./request"

describe("login", () => {
  it("logs in with a correct PIN and sets the session cookie", async () => {
    const user = await loginAs(PIN.owner)
    expect(user).toMatchObject({ id: 1, role: "owner", shopId: 1 })
    expect(jar.has("shop_session")).toBe(true)
    expect(ok(await getMe())).toMatchObject({ id: 1 })
  })

  it("returns null for a wrong PIN", async () => {
    jar.clear()
    request.ip = "10.0.0.2"
    expect(ok(await login("9876"))).toBeNull()
    expect(jar.has("shop_session")).toBe(false)
  })

  it("logout clears the session", async () => {
    await loginAs(PIN.rahim)
    ok(await logout())
    expect(ok(await getMe())).toBeNull()
    expect(err(await getProducts(1))).toBe("Please log in again")
  })
})

describe("deactivated users", () => {
  it("are logged out at once and can't log in again", async () => {
    await loginAs(PIN.rahim)
    const rahim = saveSession()
    expect(ok(await getProducts(1)).length).toBeGreaterThan(0)

    await loginAs(PIN.owner)
    ok(await setUserActive(2, false))

    useSession(rahim)
    expect(err(await getProducts(1))).toBe("Please log in again")
    expect(ok(await getMe())).toBeNull()

    jar.clear()
    expect(ok(await login(PIN.rahim))).toBeNull()

    await loginAs(PIN.owner)
    ok(await setUserActive(2, true))
  })
})

describe("PIN attempt limit", () => {
  const A = "203.0.113.7"
  const B = "198.51.100.9"

  it("locks a device after 5 wrong PINs, even for the right PIN", async () => {
    jar.clear()
    request.ip = A
    for (let i = 0; i < 4; i++) expect(ok(await login("0000"))).toBeNull()
    expect(err(await login("0000"))).toMatch(/Too many wrong PINs/)
    expect(err(await login(PIN.owner))).toMatch(/Too many wrong PINs/)
  })

  it("does not lock other devices", async () => {
    expect((await loginAs(PIN.owner, B)).id).toBe(1)
  })

  it("owner sees the locked device and can unlock it", async () => {
    await loginAs(PIN.owner, B)
    const locks = ok(await getLoginLocks())
    expect(locks.map((l) => l.ip)).toContain(A)

    ok(await unlockLogin(A))
    expect((await loginAs(PIN.owner, A)).id).toBe(1)
  })

  it("a correct PIN clears earlier failures", async () => {
    jar.clear()
    request.ip = "192.0.2.50"
    for (let i = 0; i < 3; i++) await login("0000")
    await loginAs(PIN.owner, "192.0.2.50")
    const rows = await db
      .select()
      .from(loginAttempts)
      .where(eq(loginAttempts.ip, "192.0.2.50"))
    expect(rows).toHaveLength(0)
  })
})
