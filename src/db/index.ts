// Database client: node-postgres pool + Drizzle.
// Works with Neon (pooled connection string) and a local Postgres.
import "server-only"

import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "./schema"

const globalForDb = globalThis as unknown as { pool?: Pool }

// Reuse one pool across hot reloads in dev
const pool =
  globalForDb.pool ??
  new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool

export const db = drizzle(pool, { schema, casing: "snake_case" })
export type Db = typeof db
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0]
