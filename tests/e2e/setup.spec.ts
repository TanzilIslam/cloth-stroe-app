// Setup page: staff accounts (unique PIN, deactivate), customers, suppliers.
import { expect, test } from "@playwright/test"

import {
  dialog,
  enterPin,
  expectToast,
  LAPTOP,
  login,
  newSession,
  PIN,
  pinMessage,
  resetDb,
} from "./helpers"

test.describe.configure({ mode: "serial" })
test.beforeAll(resetDb)

test.beforeEach(async ({ page }) => {
  await page.setViewportSize(LAPTOP)
  await login(page, PIN.owner)
  await page.getByRole("link", { name: "Setup" }).click()
  await expect(page).toHaveURL(/\/setup$/)
})

test("adding a user needs a unique PIN; the new user can log in", async ({
  page,
  browser,
}) => {
  await page.getByRole("button", { name: "Add user" }).click()
  const d = dialog(page)
  await d.getByLabel("Name").fill("Salma")
  await d.getByRole("combobox").nth(1).click()
  await page.getByRole("option", { name: "Women's Shop" }).click()
  await d.getByLabel(/PIN/).fill(PIN.rahim)
  await d.getByRole("button", { name: "Add user" }).click()
  await expect(d.getByRole("alert")).toHaveText(
    "PIN already used, pick another"
  )

  await d.getByLabel(/PIN/).fill("4444")
  await d.getByRole("button", { name: "Add user" }).click()
  await expectToast(page, "User added")
  await expect(
    page.getByRole("row").filter({ hasText: "Salma" })
  ).toContainText("Women's Shop")

  const salma = await newSession(browser)
  await login(salma, "4444")
  await expect(salma).toHaveURL(/\/sell$/)
})

test("the owner can't deactivate themselves", async ({ page }) => {
  await page.getByRole("row").filter({ hasText: "Owner" }).first().click()
  await expect(
    dialog(page).getByRole("button", { name: /Deactivate/ })
  ).toHaveCount(0)
})

test("deactivating staff logs them out at once", async ({ page, browser }) => {
  const rahim = await newSession(browser)
  await login(rahim, PIN.rahim)

  await page.getByRole("row").filter({ hasText: "Rahim" }).click()
  await dialog(page)
    .getByRole("button", { name: /Deactivate/ })
    .click()
  await expectToast(page, "User deactivated")
  await expect(
    page.getByRole("row").filter({ hasText: "Rahim" })
  ).toContainText("Inactive")

  await rahim.goto("/sell")
  await expect(rahim).toHaveURL(/\/login$/)
  await enterPin(rahim, PIN.rahim)
  await expect(pinMessage(rahim)).toHaveText("Wrong PIN, try again")
})

test("suppliers: add, validate phone, edit; shows up in stock in", async ({
  page,
}) => {
  await page.getByRole("tab", { name: "Suppliers" }).click()
  await page.getByRole("button", { name: "Add supplier" }).click()
  await dialog(page).getByLabel("Name").fill("Mirpur Textiles")
  await dialog(page).getByLabel("Phone").fill("01999000111")
  await dialog(page).getByRole("button", { name: "Add supplier" }).click()
  await expectToast(page, "Supplier added")

  await page
    .getByRole("tabpanel")
    .getByRole("row")
    .filter({ hasText: "Mirpur" })
    .click()
  await dialog(page).getByLabel("Phone").fill("abc")
  await dialog(page).getByRole("button", { name: "Save changes" }).click()
  await expect(dialog(page).getByRole("alert")).toHaveText("Phone: digits only")
  await dialog(page).getByLabel("Phone").fill("01999000222")
  await dialog(page).getByRole("button", { name: "Save changes" }).click()
  await expect(page.getByRole("tabpanel")).toContainText("01999000222")

  await page.getByRole("link", { name: "Stock", exact: true }).click()
  await page.getByRole("button", { name: "Stock in" }).first().click()
  await dialog(page).getByRole("combobox", { name: "Supplier" }).click()
  await expect(
    page.getByRole("option", { name: "Mirpur Textiles" })
  ).toBeVisible()
})

test("customers: add one (name is trimmed)", async ({ page }) => {
  await page.getByRole("tab", { name: "Customers" }).click()
  await page.getByRole("button", { name: "Add customer" }).click()
  await dialog(page).getByLabel("Name").fill("  Habib  ")
  await dialog(page).getByLabel("Phone").fill("01712345678")
  await dialog(page).getByRole("button", { name: "Add customer" }).click()
  await expectToast(page, "Customer added")
  await expect(
    page.getByRole("tabpanel").getByRole("row").filter({ hasText: "Habib" })
  ).toContainText("01712345678")
})
