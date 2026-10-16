// Shared by DB and E2E tests: loads .env.test and refuses unsafe databases.
export function testDatabaseUrl() {
  try {
    process.loadEnvFile(".env.test")
  } catch {
    // no .env.test: use the real environment
  }
  const url = process.env.TEST_DATABASE_URL
  if (!url)
    throw new Error(
      "Set TEST_DATABASE_URL in .env.test (see .env.test.example)"
    )
  if (!/test/i.test(new URL(url).pathname)) {
    throw new Error(
      "TEST_DATABASE_URL's database name must contain 'test': tests wipe it"
    )
  }
  return url
}

export const TEST_SESSION_SECRET =
  process.env.SESSION_SECRET ?? "test-session-secret-at-least-32-characters"
