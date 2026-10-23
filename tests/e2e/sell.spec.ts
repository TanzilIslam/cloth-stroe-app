// POS: cash sale, partial pay with a customer, return mode, variants.
import { expect, test } from "@playwright/test"

import {
  dialog,
  expectToast,
  login,
  newSession,
  PIN,
  resetDb,
  TABLET,
  tile,
} from "./helpers"

test.describe.configure({ mode: "serial" })
test.beforeAll(resetDb)

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await login(page, PIN.rahim)
})

test("cash sale: tile → qty → pay lowers stock", async ({ page }) => {
  await expect(tile(page, /Suit Fabric Navy/)).toContainText("40 yard")
  await tile(page, /Suit Fabric Navy/).click()
  await dialog(page).getByRole("button", { name: "2.5", exact: true }).click()
  await page.getByRole("button", { name: /1 item\b/ }).click()
  await page.getByRole("button", { name: /^Pay/ }).click()
  await dialog(page).getByRole("button", { name: "Confirm sale" }).click()
  await expectToast(page, "Sale saved")
  await expect(tile(page, /Suit Fabric Navy/)).toContainText("37.5 yard")
})

test("partial pay leaves a due and needs a customer", async ({ page }) => {
  await tile(page, /Pant Fabric Grey/).click()
  await dialog(page).getByRole("button", { name: "3", exact: true }).click()
  await page.getByRole("button", { name: /1 item\b/ }).click()
  await page.getByRole("button", { name: /^Pay/ }).click()
  for (const d of "1000")
    await dialog(page).getByRole("button", { name: d, exact: true }).click()

  const pay = dialog(page)
  await expect(pay.getByText("Due", { exact: true }).last()).toBeVisible()
  await expect(pay.getByRole("button", { name: "Confirm sale" })).toBeDisabled()

  await pay.getByRole("combobox", { name: "Customer" }).click()
  await page.getByRole("option", { name: /Karim Uddin/ }).click()
  await pay.getByRole("button", { name: "Confirm sale" }).click()
  await expectToast(page, "Sale saved")
})

test("return mode adds stock back and refunds", async ({ page }) => {
  await expect(tile(page, /Shirt Fabric White/)).toContainText("80 yard")
  await page.getByRole("button", { name: /Return mode/ }).click()
  await tile(page, /Shirt Fabric White/).click()
  await dialog(page).getByRole("button", { name: "1", exact: true }).click()
  await page.getByRole("button", { name: /1 item\b/ }).click()
  await page.getByRole("button", { name: /^Refund/ }).click()
  await dialog(page).getByRole("button", { name: "Confirm refund" }).click()
  await expectToast(page, "Refund saved")
  await expect(tile(page, /Shirt Fabric White/)).toContainText("81 yard")
})

test("variants: qty is capped at the variant's stock (tablet)", async ({
  browser,
}) => {
  const page = await newSession(browser, TABLET)
  await login(page, PIN.karima)
  await tile(page, /Lawn Three-Piece/).click()
  await dialog(page)
    .getByRole("button", { name: /XL · Red/ })
    .click()
  await expect(
    dialog(page).getByRole("button", { name: "3", exact: true })
  ).toBeDisabled()
  await dialog(page).getByRole("button", { name: "2", exact: true }).click()
  const cart = page.locator("aside").last()
  await expect(cart).toContainText("Lawn Three-Piece")
  await expect(cart).toContainText("XL · Red")
  await expect(cart).toContainText("৳5,200")
})
