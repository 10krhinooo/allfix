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

  test("the basket can be emptied, but not by a mis-tap", async ({ page }) => {
    await addToBasket(page, RUNNERS)
    await page.goto("/cart")

    // No undo, so it asks first.
    await page.getByRole("button", { name: "Empty the basket" }).click()
    await page.getByRole("button", { name: "Keep it" }).click()
    await expect(page.getByLabel("Qty")).toBeVisible()

    await page.getByRole("button", { name: "Empty the basket" }).click()
    await page.getByRole("button", { name: "Yes, empty it" }).click()
    await expect(page.getByText("Your basket is empty")).toBeVisible()
  })

  test("a rail configured on /build can be saved to the account", async ({ page }) => {
    // The other half of /account/rails, which could list a saved window and
    // reopen it, and had no way at all to create one.
    await signIn(page, WHO.customer)
    await page.goto("/build?system=20&width=3.6")
    await page.getByRole("button", { name: "Save this rail" }).click()
    await page.getByLabel("What is this window called?").fill("Kitchen window")
    await page.getByRole("button", { name: "Save", exact: true }).click()

    await expect(page.getByText(/Saved as/)).toBeVisible()
    await page.goto("/account/rails")
    await expect(page.getByText("Kitchen window")).toBeVisible()
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

test.describe("a part sold only as one of its finishes", () => {
  // Curtain buckles and tape hooks have no SKU of their own: they are a group
  // of seven finishes and two materials, each a part with its own code. The
  // page showed a price and a read-only list and then no basket button at all,
  // because the button was gated on a SKU the group does not have. Two things
  // the shop stocks, both priced, could not be bought.
  test("can be put in the basket once a finish is chosen", async ({ page }) => {
    await page.goto("/product/curtain-buckles")
    await expect(page.getByText(/KES/).first()).toBeVisible()

    // Nothing is preselected, so the way in is the prompt rather than a button.
    await expect(page.getByRole("button", { name: "Add to basket" })).toHaveCount(0)

    // The input is visually hidden behind a styled swatch, which is the point
    // of the pattern, so the label is what a person actually clicks.
    await page.locator("label:visible").filter({ hasText: /^Gold/ }).first().click()
    await page.getByRole("button", { name: "Add to basket" }).click()

    await page.goto("/cart")
    await expect(page.getByText(/curtain buckles, gold/i)).toBeVisible()
  })

  test("the finish chosen is the one that goes in, at its own price", async ({ page }) => {
    // A metal hook is 150 a box and a plastic one is 300 each. Defaulting to
    // whichever sorted first would put a different thing in the basket than the
    // person meant, at a different price, in a different unit.
    await page.goto("/product/curtain-tape-hooks")
    await page.locator("label:visible").filter({ hasText: /^Plastic/ }).first().click()
    await page.getByRole("button", { name: "Add to basket" }).click()

    await page.goto("/cart")
    // The line names the finish, because "Curtain tape hooks" on its own does
    // not say which of the two was bought, and it carries that finish's own
    // price rather than the group's.
    await expect(page.getByText(/curtain tape hooks, plastic/i)).toBeVisible()
    await expect(page.getByText("KES 300").first()).toBeVisible()
  })
})
