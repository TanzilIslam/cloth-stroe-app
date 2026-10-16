// drizzle-kit config: `pnpm db:generate` creates SQL migrations in /drizzle,
// `pnpm db:migrate` applies them to DATABASE_URL.
import { defineConfig } from "drizzle-kit"

try {
  process.loadEnvFile(".env.local")
} catch {
  // no .env.local (e.g. CI / Vercel): use the real environment
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: { url: process.env.DATABASE_URL! },
})
