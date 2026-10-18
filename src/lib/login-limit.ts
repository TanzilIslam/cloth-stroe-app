// PIN attempt limit, per device (IP): 5 wrong PINs within 15 minutes locks
// that device for 15 minutes. Stored in Postgres so every server instance
// sees the same count.
import "server-only"

import { eq, sql } from "drizzle-orm"
import { headers } from "next/headers"

import { db } from "@/db"
import { loginAttempts } from "@/db/schema"

import { ActionError } from "./action"
import { ERRORS } from "./errors"

export const MAX_FAILURES = 5
export const WINDOW_MIN = 15
export const LOCK_MIN = 15

/** Client IP from the proxy headers (Vercel sets x-forwarded-for). */
export async function clientIp() {
  const h = await headers()
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local"
  )
}

function lockedMessage(until: Date) {
  const min = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 60000))
  return ERRORS.tooManyPins(min)
}

/** Throws if this device is locked right now. */
export async function assertNotLocked(ip: string) {
  const [row] = await db
    .select()
    .from(loginAttempts)
    .where(eq(loginAttempts.ip, ip))
  if (row?.lockedUntil && row.lockedUntil > new Date()) {
    throw new ActionError(lockedMessage(row.lockedUntil))
  }
}

/** Counts a wrong PIN; throws the lock message when this one hits the limit. */
export async function recordFailure(ip: string) {
  // One atomic upsert: restart the window if it expired, else count up,
  // and set the lock when the count reaches the limit.
  const fresh = sql`${loginAttempts.firstAt} < now() - make_interval(mins => ${WINDOW_MIN})`
  const failures = sql`case when ${fresh} then 1 else ${loginAttempts.failures} + 1 end`
  const [row] = await db
    .insert(loginAttempts)
    .values({ ip, failures: 1 })
    .onConflictDoUpdate({
      target: loginAttempts.ip,
      set: {
        failures,
        firstAt: sql`case when ${fresh} then now() else ${loginAttempts.firstAt} end`,
        lockedUntil: sql`case when ${failures} >= ${MAX_FAILURES} then now() + make_interval(mins => ${LOCK_MIN}) else null end`,
      },
    })
    .returning()
  if (row.lockedUntil) throw new ActionError(lockedMessage(row.lockedUntil))
}

export async function clearFailures(ip: string) {
  await db.delete(loginAttempts).where(eq(loginAttempts.ip, ip))
}
