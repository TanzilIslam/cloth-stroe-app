// Server Action result wrapper. Expected errors (validation, auth) come back
// as { ok: false, error } so the message reaches the UI in production;
// unexpected errors still throw.
import "server-only"

import type { Result } from "./result"

export type { Result }

/** Throw this for errors the user should see. */
export class ActionError extends Error {}

export async function run<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (e) {
    if (e instanceof ActionError) return { ok: false, error: e.message }
    throw e
  }
}
