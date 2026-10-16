// Unit tests: pure logic, no database. Run: pnpm test
import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

export const alias = {
  "@": fileURLToPath(new URL("./src", import.meta.url)),
  // "server-only" throws outside React Server Components; tests run in Node
  "server-only": fileURLToPath(
    new URL("./tests/server-only-stub.ts", import.meta.url)
  ),
}

export default defineConfig({
  resolve: { alias },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
})
