// Helpers for DB tests: log in as a seed user, swap sessions, read results.
import { login } from "@/actions/auth"
import type { Result } from "@/lib/result"

import { jar, request } from "./request"

/** Seed PINs. */
export const PIN = { owner: "1111", rahim: "2222", karima: "3333" } as const

/** Logs in with a PIN (fresh cookie jar) and returns the user. */
export async function loginAs(pin: string, ip = "10.0.0.1") {
  jar.clear()
  request.ip = ip
  const user = ok(await login(pin))
  if (!user) throw new Error(`Login failed for PIN ${pin}`)
  return user
}

/** Copy of the current session cookie, to switch back later. */
export const saveSession = () => new Map(jar)
export function useSession(saved: Map<string, string>) {
  jar.clear()
  saved.forEach((v, k) => jar.set(k, v))
}

/** Unwraps a successful Result, or fails the test with the error. */
export function ok<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(`Expected ok, got error: ${result.error}`)
  return result.data
}

/** Returns the error message of a failed Result. */
export function err(result: Result<unknown>): string {
  if (result.ok) throw new Error("Expected an error, got ok")
  return result.error
}
