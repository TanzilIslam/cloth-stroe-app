import { describe, expect, it } from "vitest"

import {
  formatDate,
  formatTaka,
  formatTime,
  shopDay,
  whatsappLink,
} from "@/lib/utils"

describe("formatTaka", () => {
  it("uses lakh grouping and a minus sign", () => {
    expect(formatTaka(125000)).toBe("৳1,25,000")
    expect(formatTaka(-320)).toBe("-৳320")
    expect(formatTaka(812.5)).toBe("৳812.5")
  })
})

describe("shop time (Asia/Dhaka, UTC+6)", () => {
  // 20:30 UTC on the 16th is 02:30 on the 17th in Dhaka
  const lateUtc = new Date("2026-10-16T20:30:00Z")

  it("shopDay uses the Dhaka date", () => {
    expect(shopDay(0, lateUtc)).toBe("2026-10-17")
    expect(shopDay(-1, lateUtc)).toBe("2026-10-16")
  })
  it("formatDate and formatTime use Dhaka time", () => {
    expect(formatDate(lateUtc)).toBe("17 Oct 2026")
    expect(formatTime(lateUtc)).toMatch(/^2:30\s?am$/i)
  })
})

describe("whatsappLink", () => {
  it("turns a BD number into 880… and encodes the message", () => {
    expect(whatsappLink("01711-000001", "Hi there")).toBe(
      "https://wa.me/8801711000001?text=Hi%20there"
    )
  })
})
