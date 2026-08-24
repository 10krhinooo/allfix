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
  test("the basket is always in the header, and counts what is in it", async ({ page }) => {
    await page.goto("/")
    // Always there. A basket that appears only once something is in it is one a
    // first time visitor never learns the shop has.
    await expect(page.getByRole("link", { name: "Basket, empty" })).toBeVisible()

    await addToBasket(page, RUNNERS)
    await expect(page.getByRole("link", { name: /Basket, 1 part/ })).toBeVisible()
  })

  test("a part goes from the product page to the basket to checkout", async ({ page }) => {
    await addToBasket(page, RUNNERS)

    // The button becomes the way onward rather than a toast that fades and takes
    // the next step with it.
    await page.getByRole("link", { name: "Go to basket" }).click()
    await expect(page).toHaveURL(/\/cart$/)
    await expect(page.getByRole("heading", { name: "Your basket" })).toBeVisible()

    await page.getByRole("link", { name: "Go to checkout" }).click()

    // Straight through. Nobody is asked to invent a password to buy a bracket.
    await expect(page).toHaveURL(/\/checkout$/)
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible()
  })

  test("somebody without an account can buy", async ({ page }) => {
    await addToBasket(page, RUNNERS)
    await page.goto("/checkout")

    await page.getByRole("radio", { name: /Pay on collection/ }).click()
    await page.getByLabel("Your name").fill("Grace Mutiso")
    await page.getByLabel("Phone for this order").fill("0726 903 447")
    await page.getByRole("button", { name: "Place the order" }).click()

    await expect(page.getByText(/^Order AF-/)).toBeVisible()
    // No account to find it on, so the reference is what they keep.
    await expect(page.getByText(/Keep that reference/)).toBeVisible()
  })

  test("a guest is asked for the two things the counter cannot do without", async ({ page }) => {
    await addToBasket(page, RUNNERS)
    await page.goto("/checkout")
    await expect(page.getByLabel("Your name")).toBeVisible()
    await expect(page.getByLabel("Phone for this order")).toHaveAttribute("required", "")
  })

  test("signing in offers a saved address instead of typing one", async ({ page }) => {
    await addToBasket(page, RUNNERS)
    await signIn(page, WHO.customer, "/checkout")
    await expect(page.getByLabel("Your name")).toHaveCount(0)
    await expect(page.getByRole("radio", { name: /Home/ })).toBeVisible()
  })

  test("signing in from checkout comes back to checkout", async ({ page }) => {
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

  test("the quantity is set on the product page, not only in the basket", async ({ page }) => {
    // Somebody reading that a runner takes ten to the metre works out that a
    // four metre run needs forty right there. Making them add one and change it
    // on another screen is asking for the same job twice.
    await page.goto(`/product/${RUNNERS}`)
    await page.getByLabel("How many").fill("40")
    await page.getByRole("button", { name: "Add to basket" }).click()

    await expect(page.getByRole("link", { name: /Basket, 1 part/ })).toBeVisible()
    await page.goto("/cart")
    await expect(page.getByLabel("Qty")).toHaveValue("40")
  })

  test("the stepper keeps working on the line already in the basket", async ({ page }) => {
    await addToBasket(page, RUNNERS)
    await page.getByRole("button", { name: "One more" }).click()
    await expect(page.getByLabel("Quantity in your basket")).toHaveValue("2")

    await page.goto("/cart")
    await expect(page.getByLabel("Qty")).toHaveValue("2")
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
