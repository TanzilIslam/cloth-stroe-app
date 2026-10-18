// Client cache of the logged-in user. Loads once from the session cookie
// (getMe) and is updated after login, logout and shop switch.
import { getMe } from "@/api"
import type { SessionUser } from "@/types"

const listeners = new Set<() => void>()
let user: SessionUser | null | undefined = undefined // undefined = not loaded
let loading = false

function emit() {
  listeners.forEach((l) => l())
}

function load() {
  if (loading) return
  loading = true
  getMe()
    .then((u) => setSessionUser(u))
    .catch(() => setSessionUser(null))
    .finally(() => (loading = false))
}

export function getSessionUser() {
  return user
}

export function setSessionUser(next: SessionUser | null) {
  user = next
  emit()
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener)
  if (user === undefined) load()
  return () => listeners.delete(listener)
}
