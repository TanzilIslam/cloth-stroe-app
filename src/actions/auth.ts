"use server"

// Auth + shops: PIN login, session, owner shop switch.
import { asc, eq } from "drizzle-orm"

import { db } from "@/db"
import { shops, users } from "@/db/schema"
import { ActionError, parse, run } from "@/lib/action"
import {
  assertNotLocked,
  clearFailures,
  clientIp,
  recordFailure,
} from "@/lib/login-limit"
import {
  clearSession,
  currentUser,
  requireOwner,
  requireUser,
  setSession,
  verifyPin,
} from "@/lib/session"
import type { SessionUser } from "@/types"
import { idSchema, pinSchema } from "@/types/validations"

/**
 * Returns the user on success, null on a wrong PIN.
 * Fails with a message when the device is locked (too many wrong PINs).
 */
export async function login(pin: string) {
  return run(async (): Promise<SessionUser | null> => {
    const ip = await clientIp()
    await assertNotLocked(ip)
    if (!pinSchema.safeParse(pin).success) {
      await recordFailure(ip)
      return null
    }
    // PIN is the only identifier, so check it against every user (few rows)
    const all = await db.select().from(users).where(eq(users.active, true))
    for (const u of all) {
      if (await verifyPin(pin, u.pinHash)) {
        const user: SessionUser = {
          id: u.id,
          name: u.name,
          role: u.role,
          shopId: u.shopId,
        }
        await setSession(user)
        await clearFailures(ip)
        return user
      }
    }
    await recordFailure(ip)
    return null
  })
}

export async function logout() {
  return run(async () => {
    await clearSession()
  })
}

/** Current user from the session cookie, or null. */
export async function getMe() {
  return run(currentUser)
}

export async function getShops() {
  return run(async () => {
    await requireUser()
    return db.select().from(shops).orderBy(asc(shops.id))
  })
}

/** Owner only: switch the active shop. Returns the updated user. */
export async function switchShop(shopId: number) {
  return run(async () => {
    const user = await requireOwner()
    shopId = parse(idSchema, shopId)
    const [shop] = await db.select().from(shops).where(eq(shops.id, shopId))
    if (!shop) throw new ActionError("Shop not found")
    const next = { ...user, shopId }
    await setSession(next)
    return next
  })
}
