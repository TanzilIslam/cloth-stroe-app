// Seeds the database with demo data from seed-data.ts (2 shops, 3 users,
// products, 70 days of sales). Wipes existing data first.
// Run: pnpm db:seed   (PINs: owner 1111, staff 2222 / 3333)
import bcrypt from "bcryptjs"
import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as data from "./seed-data"
import * as s from "./schema"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
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

async function main() {
  await db.execute(sql`
    TRUNCATE cash_counts, payments, expenses, purchases, sale_items, sales,
      suppliers, customers, product_variants, products, users, shops
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
  for (const t of [
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
  ]) {
    await db.execute(
      sql.raw(
        `SELECT setval(pg_get_serial_sequence('${t}', 'id'), COALESCE((SELECT MAX(id) FROM ${t}), 0) + 1, false)`
      )
    )
  }

  console.log(
    `Seeded: ${data.products.length} products, ${data.sales.length} sales, ${data.expenses.length} expenses`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => pool.end())
