// Runs before every DB test file: point the app at the test database, fake
// next/headers, and reset the data so each file starts from the seed.
import { afterAll, beforeAll, vi } from "vitest"

import { resetDatabase } from "@/db/seed"

import { TEST_SESSION_SECRET, testDatabaseUrl } from "../test-env"

const url = testDatabaseUrl()
process.env.DATABASE_URL = url
process.env.SESSION_SECRET = TEST_SESSION_SECRET

vi.mock("next/headers", async () => {
  const { jar, request } = await import("./request")
  return {
    cookies: async () => ({
      get: (name: string) =>
        jar.has(name) ? { name, value: jar.get(name)! } : undefined,
      has: (name: string) => jar.has(name),
      set: (name: string, value: string) => void jar.set(name, value),
      delete: (name: string) => void jar.delete(name),
    }),
    headers: async () => new Headers({ "x-forwarded-for": request.ip }),
  }
})

beforeAll(async () => {
  await resetDatabase(url, { runMigrations: true }) // migrate is a no-op when up to date
})

afterAll(async () => {
  const { db } = await import("@/db")
  await db.$client.end()
})
