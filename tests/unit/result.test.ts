import { describe, expect, it } from "vitest"

import { check, unwrap } from "@/lib/result"

describe("Result helpers", () => {
  it("check returns data or throws the error message", () => {
    expect(check({ ok: true, data: 5 })).toBe(5)
    expect(() => check({ ok: false, error: "Not enough stock" })).toThrow(
      "Not enough stock"
    )
  })

  it("unwrap turns an action into a throwing function", async () => {
    const action = async (n: number) =>
      n > 0
        ? { ok: true as const, data: n * 2 }
        : { ok: false as const, error: "Too small" }
    const call = unwrap(action)
    await expect(call(2)).resolves.toBe(4)
    await expect(call(0)).rejects.toThrow("Too small")
  })
})
