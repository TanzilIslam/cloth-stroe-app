// Server environment, validated once. Fails fast with a clear message when a
// required setting is missing (checked at server start in instrumentation.ts).
import { z } from "zod"

const schema = z.object({
  DATABASE_URL: z
    .string("DATABASE_URL is missing")
    .regex(/^postgres(ql)?:\/\//, "DATABASE_URL must start with postgresql://"),
  SESSION_SECRET: z
    .string("SESSION_SECRET is missing")
    .min(32, "SESSION_SECRET must be 32+ characters"),
})

export type Env = z.infer<typeof schema>

let cached: Env | undefined

export function env(): Env {
  if (cached) return cached
  const result = schema.safeParse(process.env)
  if (!result.success) {
    const problems = result.error.issues.map((i) => `- ${i.message}`).join("\n")
    throw new Error(`Invalid environment (see .env.example):\n${problems}`)
  }
  cached = result.data
  return cached
}
