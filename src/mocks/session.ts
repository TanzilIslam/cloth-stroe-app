// Mock session kept in localStorage. Replaced by the iron-session cookie later.
import type { SessionUser } from "@/types"

const KEY = "mock-session"
const listeners = new Set<() => void>()
let cachedRaw: string | null = null
let cachedUser: SessionUser | null = null

function read(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function getSessionUser(): SessionUser | null {
  const raw = read()
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedUser = raw ? (JSON.parse(raw) as SessionUser) : null
  }
  return cachedUser
}

export function setSessionUser(user: SessionUser | null) {
  try {
    if (user) localStorage.setItem(KEY, JSON.stringify(user))
    else localStorage.removeItem(KEY)
  } catch {
    // storage blocked: session lives only until reload
  }
  listeners.forEach((l) => l())
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
