// CLI for `pnpm db:seed`: wipes DATABASE_URL and loads the demo data.
// Kept apart from seed.ts so tests can import resetDatabase() without import.meta.
import { resetDatabase } from "./seed"

resetDatabase(process.env.DATABASE_URL!)
  .then((n) =>
    console.log(
      `Seeded: ${n.products} products, ${n.sales} sales, ${n.expenses} expenses`
    )
  )
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
