// Stock: owner vs staff views, alerts, restock, products, variants, expenses.
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

test.describe("owner", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(LAPTOP)
    await login(page, PIN.owner)
    await page.getByRole("link", { name: "Stock", exact: true }).click()
    await expect(page).toHaveURL(/\/stock$/)
  })

  test("sees cost prices and the add-product button", async ({ page }) => {
    await expect(page.getByRole("columnheader", { name: "Cost" })).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Add product" })
    ).toBeVisible()
  })

  test("alerts show low and dead stock; restock pre-fills qty and cost", async ({
    page,
  }) => {
    await page.getByRole("tab", { name: /Alerts/ }).click()
    const panel = page.getByRole("tabpanel")
    await expect(panel).toContainText("Pant Fabric Khaki")
    await expect(panel).toContainText("Suit Fabric Black")
    await expect(panel).toContainText("Shirt Fabric Check") // dead stock

    await panel
      .getByRole("listitem")
      .filter({ hasText: "Pant Fabric Khaki" })
      .getByRole("button", { name: "Stock in" })
      .click()
    await expect(dialog(page).getByLabel("Cost / unit ৳")).toHaveValue("280")
    await expect(dialog(page).getByLabel(/Qty/)).not.toHaveValue("")
    await dialog(page).getByLabel("Paid now ৳").fill("1000")
    await dialog(page).getByRole("button", { name: "Save stock in" }).click()
    await expectToast(page, "Stock added")
  })

  test("adds a product", async ({ page }) => {
    await page.getByRole("button", { name: "Add product" }).click()
    const d = dialog(page)
    await d.getByLabel("Name").fill("Linen Shirt Fabric")
    await d.getByLabel("Category").fill("Shirt")
    await d.getByLabel("Sell price ৳").fill("500")
    await d.getByLabel("Cost price ৳").fill("350")
    await d.getByLabel("Opening stock").fill("20")
    await d.getByRole("button", { name: "Add product" }).click()
    await expectToast(page, "Product added")
    await expect(
      page.getByRole("row").filter({ hasText: "Linen Shirt Fabric" })
    ).toContainText("20")
  })

  test("adds a variant to a dress (women's shop)", async ({ page }) => {
    await page.getByRole("combobox", { name: "Shop" }).click()
    await page.getByRole("option", { name: "Women's Shop" }).click()
    await page.getByRole("row").filter({ hasText: "Lawn Three-Piece" }).click()
    await dialog(page).getByPlaceholder("Size").fill("S")
    await dialog(page).getByPlaceholder("Color").fill("Pink")
    await dialog(page).getByRole("button", { name: "Add", exact: true }).click()
    await expect(dialog(page).getByText("S · Pink")).toBeVisible()
  })
})

test.describe("staff", () => {
  test("no cost column, no add-product, stock in without cost", async ({
    browser,
  }) => {
    const page = await newSession(browser)
    await login(page, PIN.rahim)
    await page.getByRole("link", { name: "Stock", exact: true }).click()
    await expect(
      page.getByRole("columnheader", { name: "Product" })
    ).toBeVisible()
    await expect(page.getByRole("columnheader", { name: "Cost" })).toHaveCount(
      0
    )
    await expect(page.getByRole("button", { name: "Add product" })).toHaveCount(
      0
    )

    const row = page.getByRole("row").filter({ hasText: "Suit Fabric Black" })
    await expect(row).toContainText("6 yard")
    await page.getByRole("button", { name: "Stock in" }).click()
    await page.getByRole("combobox", { name: "Product" }).click()
    await page.getByRole("option", { name: "Suit Fabric Black" }).click()
    await expect(dialog(page).getByLabel("Cost / unit ৳")).toHaveCount(0)
    await dialog(page).getByLabel(/Qty/).fill("10")
    await dialog(page).getByRole("button", { name: "Save stock in" }).click()
    await expectToast(page, "Stock added")
    await expect(row).toContainText("16 yard")
  })

  test("adds an expense but can't delete it", async ({ browser }) => {
    const page = await newSession(browser)
    await login(page, PIN.rahim)
    await page.getByRole("button", { name: "Expense" }).click()
    await page.getByRole("button", { name: "Tailor" }).click()
    for (const d of "500")
      await dialog(page).getByRole("button", { name: d, exact: true }).click()
    await page.getByRole("button", { name: "Save expense" }).click()
    await expectToast(page, "Expense saved")
    await expect(dialog(page)).toContainText("Tailor")
    await expect(
      page.getByRole("button", { name: "Delete expense" })
    ).toHaveCount(0)
  })
})
