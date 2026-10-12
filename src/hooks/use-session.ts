"use client"

// Current user. undefined = still loading (server render), null = logged out.
import { useSyncExternalStore } from "react"

import { getSessionUser, subscribeSession } from "@/mocks/session"
import type { SessionUser } from "@/types"

export function useSession(): SessionUser | null | undefined {
  return useSyncExternalStore(subscribeSession, getSessionUser, () => undefined)
}
