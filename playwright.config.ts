// End-to-end tests in a real browser against the built app + test database.
// Needs TEST_DATABASE_URL (see .env.test.example). Run: pnpm test:e2e
import { defineConfig, devices } from "@playwright/test"

import { TEST_SESSION_SECRET, testDatabaseUrl } from "./tests/test-env"

const PORT = 3100
const DATABASE_URL = testDatabaseUrl()

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1, // specs share one database and reset it in beforeAll
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm build && pnpm start -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: { DATABASE_URL, SESSION_SECRET: TEST_SESSION_SECRET },
  },
})
