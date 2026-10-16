// Shared steps for E2E specs.
import { expect, type Browser, type Page } from "@playwright/test"

import { resetDatabase } from "../../src/db/seed"
import { testDatabaseUrl } from "../test-env"

export const PIN = { owner: "1111", rahim: "2222", karima: "3333" } as const
export const PHONE = { width: 390, height: 844 }
export const TABLET = { width: 820, height: 1180 }
export const LAPTOP = { width: 1280, height: 900 }

/** Fresh seed data (call in test.beforeAll of every spec). */
export const resetDb = () =>
  resetDatabase(testDatabaseUrl(), { runMigrations: true })

/** New isolated browser session (own cookies), optionally from another IP. */
export async function newSession(
  browser: Browser,
  viewport = PHONE,
  ip?: string
) {
  const context = await browser.newContext({
    viewport,
    hasTouch: viewport.width < 1024,
    extraHTTPHeaders: ip ? { "x-forwarded-for": ip } : undefined,
  })
  return context.newPage()
}

/** Types a PIN on the login pad. */
export async function enterPin(page: Page, pin: string) {
  for (const digit of pin) {
    await page.getByRole("button", { name: digit, exact: true }).click()
  }
}

/** Logs in and waits until we've left /login. */
export async function login(page: Page, pin: string) {
  await page.goto("/login")
  await enterPin(page, pin)
  await page.waitForURL((url) => !url.pathname.startsWith("/login"))
}

/** The PIN pad's message (not Next's route announcer, which is also an alert). */
export const pinMessage = (page: Page) => page.locator("p[role=alert]")

export const dialog = (page: Page) => page.getByRole("dialog")

/** Picks an option from a shadcn Select by its accessible name. */
export async function pick(
  page: Page,
  combobox: string,
  option: string | RegExp
) {
  await page.getByRole("combobox", { name: combobox }).click()
  await page.getByRole("option", { name: option }).click()
}

/** Text of a product tile on /sell, e.g. "… 37.5 yard". */
export const tile = (page: Page, name: string | RegExp) =>
  page.getByRole("button", { name })

export async function expectToast(page: Page, text: string | RegExp) {
  await expect(page.getByText(text).first()).toBeVisible()
}
