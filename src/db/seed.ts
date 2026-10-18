// Seeds the database with demo data from seed-data.ts (2 shops, 3 users,
// products, 70 days of sales). Wipes existing data first.
// Run: pnpm db:seed (seed-cli.ts; PINs: owner 1111, staff 2222 / 3333)
// Tests call resetDatabase() to start each file from the same data.
import bcrypt from "bcryptjs"
import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"

import * as s from "./schema"
import * as data from "./seed-data"

const TABLES = [
  "shops",
  "users",
  "products",
  "product_variants",
  "customers",
  "suppliers",
  "sales",
  "sale_items",
  "purchases",
  "expenses",
  "payments",
  "cash_counts",
]

/** Optionally migrates, then wipes and loads the demo data. */
export async function resetDatabase(
  url: string,
  { runMigrations = false } = {}
) {
  const pool = new Pool({ connectionString: url })
  const db = drizzle(pool, { schema: s, casing: "snake_case" })

  /** Insert in chunks to stay under the Postgres parameter limit. */
  async function insertAll<T extends object>(
    table: Parameters<typeof db.insert>[0],
    rows: T[]
  ) {
    for (let i = 0; i < rows.length; i += 500) {
      await db.insert(table).values(rows.slice(i, i + 500) as never)
    }
  }

  try {
    if (runMigrations) await migrate(db, { migrationsFolder: "drizzle" })

    await db.execute(sql`
      TRUNCATE login_attempts, cash_counts, payments, expenses, purchases, sale_items,
        sales, suppliers, customers, product_variants, products, users, shops
      RESTART IDENTITY CASCADE
    `)

    await insertAll(s.shops, data.shops)
    await insertAll(
      s.users,
      data.users.map((u) => ({ ...u, pinHash: bcrypt.hashSync(u.pinHash, 10) }))
    )
    await insertAll(s.products, data.products)
    await insertAll(s.productVariants, data.variants)
    await insertAll(s.customers, data.customers)
    await insertAll(s.suppliers, data.suppliers)
    await insertAll(s.sales, data.sales)
    await insertAll(s.saleItems, data.saleItems)
    await insertAll(s.purchases, data.purchases)
    await insertAll(s.expenses, data.expenses)

    // Explicit ids were inserted: move each sequence past the max id
    for (const t of TABLES) {
      await db.execute(
        sql.raw(
          `SELECT setval(pg_get_serial_sequence('${t}', 'id'), COALESCE((SELECT MAX(id) FROM ${t}), 0) + 1, false)`
        )
      )
    }

    return {
      products: data.products.length,
      sales: data.sales.length,
      expenses: data.expenses.length,
    }
  } finally {
    await pool.end()
  }
}
