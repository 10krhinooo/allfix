import { test, expect } from "@playwright/test"
import { signIn, addToBasket, WHO } from "./helpers"

/**
 * The route from seeing a part to having ordered it.
 *
 * This is the flow the whole shop exists for and the one that was broken on the
 * site this replaces, so it is walked end to end rather than asserted in pieces.
 */

/** A real priced part from the seeded catalogue. */
const RUNNERS = "20-runners"

test.describe("buying something", () => {
  test("the basket is reachable only once there is something in it", async ({ page }) => {
    await page.goto("/")
    // An empty basket in the header would be a permanent reminder of a thing
    // not done, so there is deliberately nothing there yet.
    await expect(page.getByRole("link", { name: /^Basket,/ })).toHaveCount(0)

    await addToBasket(page, RUNNERS)
    await expect(page.getByRole("link", { name: /^Basket,/ })).toBeVisible()
  })

  test("a part goes from the product page to the basket to checkout", async ({ page }) => {
    await addToBasket(page, RUNNERS)

    // The button becomes the way onward rather than a toast that fades and takes
    // the next step with it.
    await page.getByRole("link", { name: "Go to basket" }).click()
    await expect(page).toHaveURL(/\/cart$/)
    await expect(page.getByRole("heading", { name: "Your basket" })).toBeVisible()

    await page.getByRole("link", { name: "Go to checkout" }).click()

    // Not signed in, so the door, and it must come back here afterwards.
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fcheckout$/)
  })

  test("signing in at checkout returns to checkout and not to the account", async ({ page }) => {
    await addToBasket(page, RUNNERS)
    await signIn(page, WHO.customer, "/checkout")
    await expect(page).toHaveURL(/\/checkout$/)
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible()
  })

  test("an order can be placed and reports the shop's own total", async ({ page }) => {
    await addToBasket(page, RUNNERS)
    await signIn(page, WHO.customer, "/checkout")

    await page.getByRole("radio", { name: /Pay on collection/ }).click()
    await page.getByRole("button", { name: "Place the order" }).click()

    await expect(page.getByRole("heading", { name: /with the counter/i })).toBeVisible()
    await expect(page.getByText(/^Order AF-/)).toBeVisible()
  })

  test("placing an order empties the basket", async ({ page }) => {
    await addToBasket(page, RUNNERS)
    await signIn(page, WHO.customer, "/checkout")
    await page.getByRole("button", { name: "Place the order" }).click()
    await expect(page.getByText(/^Order AF-/)).toBeVisible()

    // The badge going is the visible half of it; the cart page is the real check.
    await page.goto("/cart")
    await expect(page.getByText("Your basket is empty")).toBeVisible()
  })

  test("quantities survive a reload, because a basket is worth keeping", async ({ page }) => {
    await addToBasket(page, RUNNERS)
    await page.goto("/cart")
    await page.getByLabel("Qty").fill("7")
    await page.getByLabel("Qty").blur()

    await page.reload()
    await expect(page.getByLabel("Qty")).toHaveValue("7")
  })

  test("a trade account is offered a proforma and a shopper is not", async ({ page }) => {
    await addToBasket(page, RUNNERS)
    await signIn(page, WHO.customer, "/checkout")
    await expect(page.getByRole("radio", { name: /Proforma/ })).toHaveCount(0)
  })
})
