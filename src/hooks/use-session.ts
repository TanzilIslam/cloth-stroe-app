"use client"

// Current user. undefined = loading, null = logged out.
import { useSyncExternalStore } from "react"

import { getSessionUser, subscribeSession } from "@/lib/session-store"
import type { SessionUser } from "@/types"

export function useSession(): SessionUser | null | undefined {
  return useSyncExternalStore(subscribeSession, getSessionUser, () => undefined)
}
