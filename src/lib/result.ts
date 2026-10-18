// Client side of Result<T>: turns { ok: false } back into a thrown Error so
// UI code can use try / catch.
export type Result<T> = { ok: true; data: T } | { ok: false; error: string }

export function check<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(result.error)
  return result.data
}

export function unwrap<A extends unknown[], T>(
  action: (...args: A) => Promise<Result<T>>
) {
  return async (...args: A): Promise<T> => {
    return check(await action(...args))
  }
}
