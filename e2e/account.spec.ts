import { test, expect } from "@playwright/test"
import { signIn, WHO } from "./helpers"

/**
 * The shopper's own area, including the documents they can take away.
 */
test.describe("the account", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, WHO.customer)
    await expect(page).toHaveURL(/\/account$/)
  })

  test("every screen on the rail opens", async ({ page }) => {
    for (const [name, url] of [
      ["Orders", /\/account\/orders$/],
      ["Saved rails", /\/account\/rails$/],
      ["Addresses", /\/account\/addresses$/],
      ["Receipts", /\/account\/documents$/],
    ] as const) {
      await page.goto("/account")

      // The rail is a fixed column on a desktop and a drawer on a phone, so on a
      // phone it has to be opened first. That is the shell working, not a
      // difference worth papering over with a wider viewport.
      const menu = page.getByRole("button", { name: "Open the console menu" })
      if (await menu.isVisible()) await menu.click()

      await page.getByRole("link", { name, exact: false }).first().click()
      await expect(page).toHaveURL(url)
    }
  })

  test("a receipt opens as a document and can be printed", async ({ page }) => {
    await page.goto("/account/documents")
    await page.getByRole("link", { name: "RC-2211" }).click()

    await expect(page.getByText("Billed to")).toBeVisible()
    await expect(page.getByText("AF-2211")).toBeVisible()
    // The lines are the point: a receipt showing only a total is one nobody can
    // check against what arrived.
    await expect(page.getByText("#20 Runners")).toBeVisible()
    await expect(page.getByRole("button", { name: /Download or print/ })).toBeVisible()
  })

  test("a proforma says plainly that it is not a demand for payment", async ({ page }) => {
    await page.goto("/account/documents/PF-2244")
    await expect(page.getByText(/not a demand for payment/i)).toBeVisible()
  })

  test("an order offers the documents it can actually produce", async ({ page }) => {
    await page.goto("/account/orders")

    // AF-2160 was collected and paid at the counter, so it has a receipt and no
    // delivery note: nobody delivered it.
    await expect(page.locator('a[href="/account/orders/AF-2160/receipt"]')).toBeVisible()
    await expect(page.locator('a[href="/account/orders/AF-2160/delivery-note"]')).toHaveCount(0)

    // AF-2211 is on its way to an address and paid, so it has both.
    await expect(page.locator('a[href="/account/orders/AF-2211/receipt"]')).toBeVisible()
    await expect(page.locator('a[href="/account/orders/AF-2211/delivery-note"]')).toBeVisible()

    // AF-2098 was cancelled and refunded. There is nothing to document.
    await expect(page.locator('a[href^="/account/orders/AF-2098/"]')).toHaveCount(0)
  })

  test("a delivery note carries no money at all", async ({ page }) => {
    // It travels with the goods. The rider and whoever signs for it have no
    // business seeing what the customer paid.
    await page.goto("/account/orders/AF-2211/delivery-note")
    await expect(page.getByText("Delivery note")).toBeVisible()
    await expect(page.getByText("#20 Runners")).toBeVisible()
    await expect(page.getByText("Received by")).toBeVisible()
    await expect(page.getByText(/^KES/)).toHaveCount(0)
  })

  test("a document an order cannot produce is not found", async ({ page }) => {
    // AF-2211 is still on its way and paid by M-Pesa, so no invoice is owed.
    const response = await page.goto("/account/orders/AF-2211/invoice")
    expect(response?.status()).toBe(404)

    const madeUp = await page.goto("/account/orders/AF-2211/not-a-document")
    expect(madeUp?.status()).toBe(404)
  })

  test("somebody else's document is not found", async ({ page }) => {
    // Not forbidden: a 403 would confirm the document exists.
    const response = await page.goto("/account/documents/RC-9999")
    expect(response?.status()).toBe(404)
  })

  test("an address can be added and becomes selectable at checkout", async ({ page }) => {
    await page.goto("/account/addresses")
    await page.getByRole("button", { name: "Add an address" }).click()
    await page.getByLabel("What you call it").fill("Site office")
    await page.getByLabel("Who receives it").fill("Peter Ochieng")
    await page.getByLabel("Phone").fill("0733 265 741")
    await page.getByLabel("Street or building").fill("Mombasa Road")
    await page.getByLabel("Estate or area").fill("Syokimau")
    await page.getByRole("button", { name: "Save address" }).click()

    await expect(page.getByText("Site office")).toBeVisible()
  })

  test("a saved rail reopens on its own measurement, not the defaults", async ({ page }) => {
    await page.goto("/account/rails")
    await page.getByRole("link", { name: /Open in the configurator/ }).first().click()

    await expect(page).toHaveURL(/\/build\?/)
    // The seeded sitting room bay is 4.2 m, and the default is 2.
    // The width has a number field and a slider sharing the value, so it is
    // named rather than picked by type.
    await expect(page.getByRole("spinbutton", { name: "Window width in metres" }))
      .toHaveValue("4.2")
  })
})
