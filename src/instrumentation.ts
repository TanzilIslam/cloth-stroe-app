// Runs once when a server instance starts: check required env vars so a
// missing setting fails at startup instead of on the first request.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { env } = await import("./lib/env")
    env()
  }
}
