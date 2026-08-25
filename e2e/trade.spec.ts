import { test, expect } from "@playwright/test"
import { addToBasket, signIn, WHO } from "./helpers"

/**
 * The trade side of the shop: the rate, the bulk list and the proforma.
 *
 * A tier is worth testing end to end for one reason above all others. It is the
 * only figure on the site that differs by who is looking, and the failure that
 * matters is not a wrong layout but a wrong number: a rate shown to somebody who
 * does not have one, or a rate shown and then not charged.
 */

/** KES 100 each, which makes 80 at the advertised 20%. */
const BRACKET = "20-single-wall-bracket"

test.describe("the trade rate", () => {
  test("a signed out visitor is quoted list and told nothing about a rate", async ({ page }) => {
    await page.goto(`/product/${BRACKET}`)
    await expect(page.getByText("KES 100").first()).toBeVisible()
    await expect(page.getByText("off list")).toHaveCount(0)
  })

  test("a customer account is still retail", async ({ page }) => {
    // A tier belongs to an account, and a shopper's account is not one.
    await signIn(page, WHO.customer)
    await page.goto(`/product/${BRACKET}`)
    await expect(page.getByText("KES 100").first()).toBeVisible()
    await expect(page.getByText("off list")).toHaveCount(0)
  })

  test("a trade account sees its own rate against the list price", async ({ page }) => {
    await signIn(page, WHO.trade)
    await page.goto(`/product/${BRACKET}`)
    await expect(page.getByText("20% off list")).toBeVisible()
    await expect(page.getByText("KES 80", { exact: true })).toBeVisible()
  })

  test("the basket and the checkout are priced at the same rate the page quoted", async ({
    page,
  }) => {
    // The number a customer decides on has to be the number they are asked for.
    // Two screens quoting two figures is the bug this whole model exists to
    // prevent.
    await signIn(page, WHO.trade)
    await addToBasket(page, BRACKET)

    await page.goto("/cart")
    await expect(page.getByText("At 20% off list, against KES 100 list.")).toBeVisible()

    await page.goto("/checkout")
    await expect(page.getByText("Priced at 20% off list, on your account.")).toBeVisible()
  })

  test("an order placed on a trade account comes back at the trade figure", async ({ page }) => {
    await signIn(page, WHO.trade)
    await addToBasket(page, BRACKET)
    await page.goto("/checkout")
    await page.getByRole("button", { name: "Place the order" }).click()

    await expect(page.getByText(/^Order AF-/)).toBeVisible()
    // The figure on the confirmation is the server's own, and it is the trade
    // one rather than the list one.
    await expect(page.getByText("KES 80", { exact: true })).toBeVisible()
  })

  test("a proforma is one of the ways a trade account may settle", async ({ page }) => {
    await signIn(page, WHO.trade)
    await addToBasket(page, BRACKET)
    await page.goto("/checkout")
    await expect(page.getByText("Proforma invoice", { exact: true })).toBeVisible()

    await page.context().clearCookies()
    await addToBasket(page, BRACKET)
    await page.goto("/checkout")
    await expect(page.getByText("Proforma invoice", { exact: true })).toHaveCount(0)
  })
})

test.describe("bulk entry on a system page", () => {
  test("several parts go into the basket in one action", async ({ page }) => {
    await page.goto("/systems/20")
    await page.getByRole("button", { name: /Open the list of/ }).click()

    await page.getByLabel("How many #20 Runners").fill("40")
    await page.getByLabel("How many #20 Single Wall Bracket").fill("12")
    await page.getByRole("button", { name: /Add 2 parts to the basket/ }).click()

    await expect(page.getByText("2 parts are in your basket")).toBeVisible()

    // Found by SKU rather than by position: the basket keeps the order the
    // parts were added in, and the list on the page is in assembly order.
    await page.goto("/cart")
    const line = (sku: string) => page.getByRole("listitem").filter({ hasText: sku })
    await expect(line("RL#20_004").getByLabel("Qty")).toHaveValue("40")
    await expect(line("RL#20_006").getByLabel("Qty")).toHaveValue("12")
  })

  test("a blank row is not an order for one", async ({ page }) => {
    // Most rows on this list are meant to stay empty, so the button has nothing
    // to add until a quantity is typed.
    await page.goto("/systems/20")
    await page.getByRole("button", { name: /Open the list of/ }).click()
    await expect(page.getByRole("button", { name: /Add parts to the basket/ })).toBeDisabled()
  })

  test("the bulk list is priced at the trade rate for a trade account", async ({ page }) => {
    await signIn(page, WHO.trade)
    await page.goto("/systems/20")
    await page.getByRole("button", { name: /Open the list of/ }).click()
    await expect(page.getByRole("columnheader", { name: "Your rate" })).toBeVisible()
  })
})

test.describe("the proforma", () => {
  test("a priced quote prints one, on the shop's letterhead", async ({ page }) => {
    await signIn(page, WHO.trade, "/trade/account/quotes")
    await page.getByRole("link", { name: "Proforma for transfer" }).first().click()

    await expect(page).toHaveURL(/\/trade\/account\/quotes\/AF-Q-1180\/proforma$/)
    await expect(page.getByText("Proforma invoice", { exact: true })).toBeVisible()
    await expect(page.getByText("Against quote")).toBeVisible()
    await expect(page.getByText("AF-Q-1180")).toBeVisible()
  })

  test("a quote still being priced has no sheet to print", async ({ page }) => {
    await signIn(page, WHO.trade)
    const response = await page.goto("/trade/account/quotes/AF-Q-1176/proforma")
    expect(response?.status()).toBe(404)
  })

  test("somebody else's quote is not found rather than refused", async ({ page }) => {
    await signIn(page, WHO.trade)
    const response = await page.goto("/trade/account/quotes/AF-Q-9999/proforma")
    expect(response?.status()).toBe(404)
  })
})
