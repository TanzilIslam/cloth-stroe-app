// Owner money pages: dashboard, dues + WhatsApp + payment, cash count, report.
import { expect, test } from "@playwright/test"

import {
  dialog,
  expectToast,
  LAPTOP,
  login,
  newSession,
  PIN,
  resetDb,
} from "./helpers"

test.describe.configure({ mode: "serial" })
test.beforeAll(resetDb)

test("dashboard: Both adds the two shops together", async ({ page }) => {
  await page.setViewportSize(LAPTOP)
  await login(page, PIN.owner)
  const sale = page.getByText("Today's sale").locator("..")
  await expect(sale).toBeVisible()
  const count = async () =>
    Number((await sale.innerText()).match(/(\d+) sales/)?.[1] ?? 0)
  const one = await count()
  await page.getByRole("button", { name: "Both" }).click()
  await expect.poll(count).toBeGreaterThanOrEqual(one)
  await expect(page.getByText(/vs\. last/)).toBeVisible()
  await expect(page.getByText("Peak times · 30 days")).toBeVisible()
  await page.getByRole("button", { name: "Brands" }).click()
  await expect(page.getByText(/1\. /).first()).toBeVisible()
})

test("staff see only today's sale on /", async ({ browser }) => {
  const page = await newSession(browser)
  await login(page, PIN.rahim)
  await page.goto("/")
  await expect(page.getByText("Today's sale")).toBeVisible()
  await expect(page.getByText("Gross profit")).toHaveCount(0)
})

test.describe("hisab", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(LAPTOP)
    await login(page, PIN.owner)
    await page.getByRole("link", { name: "Hisab" }).click()
    await expect(page).toHaveURL(/\/hisab$/)
  })

  test("dues are oldest first with a WhatsApp reminder", async ({ page }) => {
    const items = page.getByRole("tabpanel").getByRole("listitem")
    await expect(items.first()).toContainText("Karim Uddin")
    await expect(items.nth(1)).toContainText("Islampur Fabrics")
    const href = await page
      .getByRole("link", { name: /WhatsApp reminder to Karim/ })
      .getAttribute("href")
    expect(decodeURIComponent(href ?? "")).toContain(
      "wa.me/8801711000001?text=Dear Karim Uddin, your due at Men's Shop is ৳2,500"
    )
  })

  test("receiving a payment lowers the due", async ({ page }) => {
    const karim = page
      .getByRole("tabpanel")
      .getByRole("listitem")
      .filter({ hasText: "Karim Uddin" })
    await karim.getByRole("button", { name: "Receive" }).click()
    await dialog(page).getByLabel("Amount ৳").fill("1000")
    await dialog(page).getByRole("button", { name: "Receive payment" }).click()
    await expectToast(page, "Payment received")
    await expect(karim).toContainText("৳1,500")
  })

  test("cash count shows short / over against expected", async ({ page }) => {
    await page.getByRole("tab", { name: "Cash" }).click()
    await expect(page.getByText("Expected in drawer")).toBeVisible()
    await page.getByLabel("Counted cash ৳").fill("999999")
    await expect(page.getByRole("status")).toContainText("Over")
    await page.getByRole("button", { name: "Save cash count" }).click()
    await expect(page.getByText("Past counts").locator("..")).toContainText(
      "diff"
    )
  })

  test("monthly report lists months with net profit", async ({ page }) => {
    await page.getByRole("tab", { name: "Report" }).click()
    const panel = page.getByRole("tabpanel")
    await expect(
      panel.getByRole("columnheader", { name: "Net profit" })
    ).toBeVisible()
    await expect(panel.locator("tbody tr").first()).toBeVisible()
  })
})
