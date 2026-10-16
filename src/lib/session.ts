// Server session: encrypted cookie (iron-session) holding the logged-in user.
// Every Server Action calls requireUser / requireOwner / requireShop first.
import "server-only"

import bcrypt from "bcryptjs"
import { sealData, unsealData } from "iron-session"
import { cookies } from "next/headers"

import type { ID, SessionUser } from "@/types"

import { ActionError } from "./action"

const COOKIE = "shop_session"
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function secret() {
  const s = process.env.SESSION_SECRET
  if (!s || s.length < 32)
    throw new Error("SESSION_SECRET must be 32+ characters")
  return s
}

export async function getSession(): Promise<SessionUser | null> {
  const cookie = (await cookies()).get(COOKIE)?.value
  if (!cookie) return null
  try {
    const user = await unsealData<Partial<SessionUser>>(cookie, {
      password: secret(),
      ttl: MAX_AGE,
    })
    return user.id ? (user as SessionUser) : null
  } catch {
    return null
  }
}

export async function setSession(user: SessionUser) {
  const sealed = await sealData(user, { password: secret(), ttl: MAX_AGE })
  ;(await cookies()).set(COOKIE, sealed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  })
}

export async function clearSession() {
  ;(await cookies()).delete(COOKIE)
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSession()
  if (!user) throw new ActionError("Please log in again")
  return user
}

export async function requireOwner(): Promise<SessionUser> {
  const user = await requireUser()
  if (user.role !== "owner") throw new ActionError("Owner only")
  return user
}

/** Staff can only touch their own shop; the owner can touch any shop. */
export async function requireShop(shopId: ID): Promise<SessionUser> {
  const user = await requireUser()
  if (user.role !== "owner" && user.shopId !== shopId) {
    throw new ActionError("Not your shop")
  }
  return user
}

export const hashPin = (pin: string) => bcrypt.hash(pin, 10)
export const verifyPin = (pin: string, hash: string) =>
  bcrypt.compare(pin, hash)

/** Name of the session cookie, for the proxy's quick check. */
export const SESSION_COOKIE = COOKIE
