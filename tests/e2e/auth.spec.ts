// Login, role guards, logout, 404 and the PIN attempt limit.
import { expect, test } from "@playwright/test"

import {
  enterPin,
  LAPTOP,
  login,
  newSession,
  PIN,
  pinMessage,
  resetDb,
} from "./helpers"

test.describe.configure({ mode: "serial" })
test.beforeAll(resetDb)

test("logged-out visitors are sent to /login", async ({ page }) => {
  await page.goto("/stock")
  await expect(page).toHaveURL(/\/login$/)
})

test("wrong PIN shows an error", async ({ page }) => {
  await page.goto("/login")
  await enterPin(page, "9999")
  await expect(pinMessage(page)).toHaveText("Wrong PIN, try again")
})

test("staff land on /sell with 3 nav buttons and can't open /hisab", async ({
  page,
}) => {
  await login(page, PIN.rahim)
  await expect(page).toHaveURL(/\/sell$/)
  const nav = page.locator("nav").last()
  await expect(nav).toContainText("Sell")
  await expect(nav).toContainText("Stock")
  await expect(nav).toContainText("Expense")
  await expect(nav).not.toContainText("Hisab")

  await page.goto("/hisab")
  await expect(page).toHaveURL(/\/sell$/)
  await page.goto("/setup")
  await expect(page).toHaveURL(/\/sell$/)
})

test("logout returns to /login", async ({ page }) => {
  await login(page, PIN.rahim)
  await page.getByRole("button", { name: "Logout" }).first().click()
  await expect(page).toHaveURL(/\/login$/)
})

test("owner lands on the dashboard and can switch shop", async ({
  browser,
}) => {
  const page = await newSession(browser, LAPTOP)
  await login(page, PIN.owner)
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText("Today's sale").first()).toBeVisible()

  await page.getByRole("combobox", { name: "Shop" }).click()
  await page.getByRole("option", { name: "Women's Shop" }).click()
  await expect(page.getByRole("combobox", { name: "Shop" })).toHaveText(
    /Women's Shop/
  )
})

test("a logged-in user opening /login goes home; unknown pages 404", async ({
  page,
}) => {
  await login(page, PIN.rahim)
  await page.goto("/login")
  await expect(page).toHaveURL(/\/sell$/)
  const res = await page.goto("/does-not-exist")
  expect(res?.status()).toBe(404)
  await expect(
    page.getByRole("heading", { name: "Page not found" })
  ).toBeVisible()
})

test("5 wrong PINs lock the device; the owner unlocks it", async ({
  browser,
}) => {
  const locked = await newSession(browser, undefined, "203.0.113.7")
  await locked.goto("/login")
  for (let i = 0; i < 4; i++) {
    await enterPin(locked, "0000")
    await expect(pinMessage(locked)).toHaveText("Wrong PIN, try again")
  }
  await enterPin(locked, "0000")
  await expect(pinMessage(locked)).toHaveText(/Too many wrong PINs/)
  await enterPin(locked, PIN.owner)
  await expect(pinMessage(locked)).toHaveText(/Too many wrong PINs/)

  const owner = await newSession(browser, LAPTOP, "198.51.100.9")
  await login(owner, PIN.owner)
  await owner.goto("/setup")
  await expect(owner.getByText("203.0.113.7")).toBeVisible()
  await owner.getByRole("button", { name: "Unlock" }).click()
  await owner
    .getByRole("dialog", { name: "Unlock this device?" })
    .getByRole("button", { name: "Unlock" })
    .click()
  await expect(owner.getByText("Unlocked")).toBeVisible()

  await enterPin(locked, PIN.rahim)
  await expect(locked).toHaveURL(/\/sell$/)
})
