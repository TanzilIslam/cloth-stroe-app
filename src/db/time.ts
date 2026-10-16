// Shop-local time (Bangladesh, UTC+6) for "today", hours and weekdays.
// Vercel runs in UTC, so all day boundaries are computed in SQL with this zone.
import { sql, type SQL } from "drizzle-orm"

export const TZ = "Asia/Dhaka"

/** Start of today in Dhaka, as a timestamptz. */
export const todayStart = sql`(date_trunc('day', now() AT TIME ZONE 'Asia/Dhaka') AT TIME ZONE 'Asia/Dhaka')`

/** Now minus N days. */
export const daysAgo = (days: number) =>
  sql`(now() - make_interval(days => ${days}))`

/** A timestamptz column / expression read in Dhaka local time. */
export const local = (col: SQL | unknown) =>
  sql`(${col} AT TIME ZONE 'Asia/Dhaka')`
