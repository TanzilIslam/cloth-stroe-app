// Shared SQL snippets: sums and shop-local time (Bangladesh, UTC+6).
// Vercel runs in UTC, so all day boundaries are computed in SQL with this zone.
import { sql, type SQL } from "drizzle-orm"

import { SHOP_TZ } from "@/lib/config"

/** The shop time zone as a SQL literal, e.g. 'Asia/Dhaka'. */
export const TZ = sql.raw(`'${SHOP_TZ}'`)

/** Start of today in Dhaka, as a timestamptz. */
export const todayStart = sql`(date_trunc('day', now() AT TIME ZONE ${TZ}) AT TIME ZONE ${TZ})`

/** Now minus N days. */
export const daysAgo = (days: number) =>
  sql`(now() - make_interval(days => ${days}))`

/** A timestamptz column / expression read in Dhaka local time. */
export const local = (col: SQL | unknown) => sql`(${col} AT TIME ZONE ${TZ})`

/** Start of a "YYYY-MM-DD" day in Dhaka, plus `addDays`. */
export const dayStart = (day: string, addDays = 0) =>
  sql`((${day}::date + ${addDays}::int)::timestamp AT TIME ZONE ${TZ})`

/** sum(expr) as a JS number, 0 when there are no rows. */
export const sum = (expr: unknown) =>
  sql<number>`coalesce(sum(${expr}), 0)`.mapWith(Number)
