"use server"

// Owner only: staff accounts on /setup. PINs are unique because the PIN alone
// identifies the user at login.
import { and, asc, count, eq, gt, ne } from "drizzle-orm"

import { db } from "@/db"
import { loginAttempts, users } from "@/db/schema"
import { ActionError, parse, run } from "@/lib/action"
import { ERRORS } from "@/lib/errors"
import { hashPin, requireOwner, verifyPin } from "@/lib/session"
import type { ID, UserInput, UserRow } from "@/types"
import { idSchema, userSchema } from "@/types/validations"

const columns = {
  id: users.id,
  name: users.name,
  role: users.role,
  shopId: users.shopId,
  active: users.active,
}

async function pinTaken(pin: string, exceptId?: ID) {
  const others = await db
    .select({ pinHash: users.pinHash })
    .from(users)
    .where(exceptId ? ne(users.id, exceptId) : undefined)
  for (const u of others) if (await verifyPin(pin, u.pinHash)) return true
  return false
}

/** Throws if the change would leave no active owner. */
async function keepAnOwner(id: ID) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(users)
    .where(
      and(eq(users.role, "owner"), eq(users.active, true), ne(users.id, id))
    )
  if (n === 0) throw new ActionError(ERRORS.needAnOwner)
}

export async function getUsers() {
  return run(async (): Promise<UserRow[]> => {
    await requireOwner()
    return db
      .select(columns)
      .from(users)
      .orderBy(asc(users.role), asc(users.name))
  })
}

export async function createUser(input: UserInput) {
  return run(async (): Promise<UserRow> => {
    await requireOwner()
    const data = parse(userSchema, input)
    if (!data.pin) throw new ActionError(ERRORS.pinRequired)
    if (await pinTaken(data.pin)) throw new ActionError(ERRORS.pinTaken)
    const [row] = await db
      .insert(users)
      .values({
        name: data.name,
        role: data.role,
        shopId: data.shopId,
        pinHash: await hashPin(data.pin),
      })
      .returning(columns)
    return row
  })
}

export async function updateUser(id: ID, input: UserInput) {
  return run(async (): Promise<UserRow> => {
    await requireOwner()
    id = parse(idSchema, id)
    const data = parse(userSchema, input)
    if (data.role !== "owner") await keepAnOwner(id)
    if (data.pin && (await pinTaken(data.pin, id))) {
      throw new ActionError(ERRORS.pinTaken)
    }
    const [row] = await db
      .update(users)
      .set({
        name: data.name,
        role: data.role,
        shopId: data.shopId,
        ...(data.pin ? { pinHash: await hashPin(data.pin) } : {}),
      })
      .where(eq(users.id, id))
      .returning(columns)
    if (!row) throw new ActionError(ERRORS.userNotFound)
    return row
  })
}

/** Deactivated users can't log in; their sales stay. */
export async function setUserActive(id: ID, active: boolean) {
  return run(async (): Promise<UserRow> => {
    const me = await requireOwner()
    id = parse(idSchema, id)
    if (!active) {
      if (id === me.id) throw new ActionError(ERRORS.cantDeactivateSelf)
      await keepAnOwner(id)
    }
    const [row] = await db
      .update(users)
      .set({ active: active === true })
      .where(eq(users.id, id))
      .returning(columns)
    if (!row) throw new ActionError(ERRORS.userNotFound)
    return row
  })
}

/** Devices locked right now after too many wrong PINs. */
export async function getLoginLocks() {
  return run(async () => {
    await requireOwner()
    return db
      .select({ ip: loginAttempts.ip, lockedUntil: loginAttempts.lockedUntil })
      .from(loginAttempts)
      .where(gt(loginAttempts.lockedUntil, new Date()))
  })
}

/** Owner unlock: clears the count for one device. */
export async function unlockLogin(ip: string) {
  return run(async () => {
    await requireOwner()
    await db.delete(loginAttempts).where(eq(loginAttempts.ip, String(ip)))
  })
}
