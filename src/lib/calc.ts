// Pure business math, shared by Server Actions and the UI.

const DAY = 24 * 60 * 60 * 1000

/** Rounds money (or qty) to 2 decimals: 2.5 × 325.3 → 813.25, no float drift. */
export function roundMoney(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

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
