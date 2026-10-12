// Mock data layer. Function names match docs/function.md so the swap to
// src/actions/ is an import change only.
import type { SessionUser, Shop } from "@/types"

import { shops, users } from "./data"
import { getSessionUser, setSessionUser } from "./session"

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))

// --- auth ---

export async function login(pin: string): Promise<SessionUser | null> {
  await delay()
  const user = users.find((u) => u.pinHash === pin)
  if (!user) return null
  const sessionUser: SessionUser = {
    id: user.id,
    name: user.name,
    role: user.role,
    shopId: user.shopId,
  }
  setSessionUser(sessionUser)
  return sessionUser
}

export async function logout(): Promise<void> {
  setSessionUser(null)
}

// --- shops ---

export async function getShops(): Promise<Shop[]> {
  return shops
}

/** Owner only: switch the active shop in the session. */
export async function switchShop(shopId: number): Promise<void> {
  const user = getSessionUser()
  if (user?.role === "owner") setSessionUser({ ...user, shopId })
}
