// Sales history, stock-in history (owner vs staff) and staff cash count.
import { expect, test } from "@playwright/test"

import {
  dialog,
  expectToast,
  LAPTOP,
  login,
  newSession,
  PIN,
  resetDb,
  tile,
} from "./helpers"

test.describe.configure({ mode: "serial" })
test.beforeAll(resetDb)

test("a new sale is on top of today's history with its details", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await login(page, PIN.rahim)
  await tile(page, /Pant Fabric Grey/).click()
  await dialog(page).getByRole("button", { name: "2", exact: true }).click()
  await page.getByRole("button", { name: /1 item\b/ }).click()
  await page.getByRole("button", { name: /^Pay/ }).click()
  await dialog(page).getByRole("button", { name: "Confirm sale" }).click()
  await expectToast(page, "Sale saved")

  await page.getByRole("link", { name: "Sales history" }).click()
  await expect(page).toHaveURL(/\/sell\/history$/)
  await expect(page.getByText("Today", { exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "Next day" })).toBeDisabled()

  const first = page.locator("main ul li").first()
  await expect(first).toContainText("Pant Fabric Grey")
  await expect(first).toContainText("৳860")
  await first.getByRole("button").click()
  await expect(dialog(page)).toContainText("2 yard × ৳430")
  await expect(dialog(page)).toContainText("Rahim")
  await page.keyboard.press("Escape")

  await page.getByRole("button", { name: "Previous day" }).click()
  await expect(page.getByText("Yesterday", { exact: true })).toBeVisible()
})

test("stock-in history: owner sees total and paid, staff don't", async ({
  page,
  browser,
}) => {
  await page.setViewportSize(LAPTOP)
  await login(page, PIN.owner)
  await page.getByRole("link", { name: "Stock", exact: true }).click()
  await page.getByRole("button", { name: "Stock in" }).first().click()
  await page.getByRole("combobox", { name: "Product" }).click()
  await page.getByRole("option", { name: "Pant Fabric Grey" }).click()
  await dialog(page).getByLabel(/Qty/).fill("12")
  await dialog(page).getByLabel("Paid now ৳").fill("2000")
  await dialog(page).getByRole("button", { name: "Save stock in" }).click()
  await expectToast(page, "Stock added")

  await page.getByRole("tab", { name: "History" }).click()
  const panel = page.getByRole("tabpanel")
  await expect(panel.getByRole("columnheader", { name: "Paid" })).toBeVisible()
  await expect(panel.locator("tbody tr").first()).toContainText(
    "Pant Fabric Grey"
  )
  await expect(panel.locator("tbody tr").first()).toContainText("৳2,000")

  const staff = await newSession(browser)
  await login(staff, PIN.rahim)
  await staff.getByRole("link", { name: "Stock", exact: true }).click()
  await staff.getByRole("tab", { name: "History" }).click()
  await expect(
    staff.getByRole("tabpanel").getByRole("columnheader", { name: "Qty" })
  ).toBeVisible()
  await expect(
    staff.getByRole("tabpanel").getByRole("columnheader", { name: "Paid" })
  ).toHaveCount(0)
})

test("staff count cash from the Expense sheet", async ({ browser }) => {
  const page = await newSession(browser)
  await login(page, PIN.rahim)
  await page.getByRole("button", { name: "Expense" }).click()
  await page.getByRole("tab", { name: "Count cash" }).click()
  await expect(dialog(page).getByText("Expected in drawer")).toBeVisible()
  await page.getByLabel("Counted cash ৳").fill("100")
  await page.getByRole("button", { name: "Save cash count" }).click()
  await expectToast(page, /Cash (short|over|matched)/)
})
