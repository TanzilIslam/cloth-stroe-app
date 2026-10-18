// Database tests: Server Actions against a real test Postgres.
// Needs TEST_DATABASE_URL (see .env.test.example). Run: pnpm test:db
import { defineConfig } from "vitest/config"

import { alias } from "./vitest.config"

export default defineConfig({
  resolve: { alias },
  test: {
    include: ["tests/db/**/*.test.ts"],
    environment: "node",
    setupFiles: ["tests/db/setup.ts"],
    fileParallelism: false, // one database, files run one at a time
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
})
