import { describe, expect, it } from "vitest"

import { calcReorderQty, daysSince } from "@/lib/calc"

describe("calcReorderQty", () => {
  it("covers the last 30 days of sales", () => {
    expect(calcReorderQty(30, 5, 10)).toBe(25)
  })
  it("orders at least up to 2× the low level when sales are slow", () => {
    expect(calcReorderQty(0, 3, 10)).toBe(17)
  })
  it("never goes below 0 and rounds up", () => {
    expect(calcReorderQty(5, 50, 10)).toBe(0)
    expect(calcReorderQty(10.2, 0, 1)).toBe(11)
  })
})

describe("daysSince", () => {
  it("counts whole days", () => {
    const now = new Date("2026-10-16T12:00:00Z")
    expect(daysSince(new Date("2026-10-06T12:00:00Z"), now)).toBe(10)
    expect(daysSince(new Date("2026-10-16T01:00:00Z"), now)).toBe(0)
  })
})
