// Pure business math, shared by mocks and (later) Server Actions.

const DAY = 24 * 60 * 60 * 1000

/** Suggested reorder: cover last 30 days of sales, at least 2× the low level. */
export function calcReorderQty(
  soldLast30: number,
  stock: number,
  lowAt: number
) {
  const target = Math.max(soldLast30, lowAt * 2)
  return Math.max(0, Math.ceil(target - stock))
}

/** Whole days between a date and now. */
export function daysSince(date: Date, now = new Date()) {
  return Math.floor((now.getTime() - date.getTime()) / DAY)
}

/** Start of today (local time). */
export function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
