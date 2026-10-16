import { test, expect } from "@playwright/test"
import { signIn, WHO } from "./helpers"

/**
 * The counter's own orders screen.
 *
 * Most of this shop's orders never came through the checkout: they arrive over
 * the counter, in a WhatsApp thread, or on the phone, and until there was a way
 * to key one in they lived in a paper book. So the assertions worth having are
 * that every order is on one screen whatever way it arrived, that the channel is
 * visible and filterable, and that the door is the counter's rather than
 * anybody's.
 *
 * Without an order service there is nothing to show, and the screen says so
 * rather than drawing an empty list, which would tell the counter there is
 * nothing to pack. That is the case CI runs, so it is the case asserted here.
 */

test.describe("the orders desk", () => {
  test("staff can open it and a customer cannot", async ({ page }) => {
    await signIn(page, WHO.staff)
    await page.waitForURL(/\/admin/)
    const open = await page.goto("/admin/orders")
    expect(open?.status()).toBe(200)
    await expect(page.locator("h1")).toContainText("Orders")

    // Cleared rather than clicked: the rail and the profile screen both carry a
    // sign out, and this test is about the door rather than about either button.
    await page.context().clearCookies()

    await signIn(page, WHO.customer)
    await page.goto("/admin/orders")
    // Turned away at the console door by the proxy, before the screen renders at
    // all, so what a customer ends up looking at is their own account. The
    // notFound inside the page is the second gate and is for a role that has the
    // console without this screen, which is why it is checked by the assertion
    // on `capabilities` rather than from a browser: no such role exists today,
    // and writing one into the roster to test it would be testing the test.
    await expect(page).not.toHaveURL(/\/admin\/orders/)
    await expect(page).toHaveURL(/\/account/)
  })

  test("it is on the rail for the counter", async ({ page }) => {
    await signIn(page, WHO.staff)
    await page.waitForURL(/\/admin/)
    await expect(page.getByRole("link", { name: /^Orders/ }).first()).toBeVisible()
  })

  test("with no service it says so, over the top of the orders it is standing in with", async ({
    page,
  }) => {
    // An empty orders screen and an unreachable one look identical and mean
    // opposite things. One says there is nothing to pack. The screen now draws
    // stand-in orders so there is something to work against before the service
    // is hosted, so what is asserted is the sentence that keeps them honest.
    await signIn(page, WHO.staff)
    await page.waitForURL(/\/admin/)
    await page.goto("/admin/orders")

    await expect(page.getByText(/No order service is reachable/i)).toBeVisible()
    await expect(page.getByText(/Nothing moved here is kept/)).toBeVisible()
  })
})

/**
 * Finding an order again, without an account.
 *
 * The checkout ends by telling somebody to keep their reference, and until this
 * screen there was nowhere to use one. Both halves are asked for on purpose: a
 * reference is a short sequence, and the phone number the order was placed on
 * is what makes it somebody's own order rather than anybody's.
 *
 * Unwired there are no records to search, and the screen says exactly that
 * rather than answering "not found", which would be a lie about a reference
 * that may well be real. That is the case CI runs, so it is the case asserted.
 */
test.describe("finding an order", () => {
  test("it asks for both halves before it will look", async ({ page }) => {
    await page.goto("/orders")
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/find your order/i)

    const find = page.getByRole("button", { name: /find my order/i })
    await expect(find).toBeDisabled()

    await page.getByLabel("Your reference").fill("AF-2327")
    await expect(find).toBeDisabled()

    await page.getByLabel("The number it was placed on").fill("0712345678")
    await expect(find).toBeEnabled()
  })

  test("with no records it says so, rather than saying not found", async ({ page }) => {
    await page.goto("/orders")
    await page.getByLabel("Your reference").fill("AF-2327")
    await page.getByLabel("The number it was placed on").fill("0712345678")
    await page.getByRole("button", { name: /find my order/i }).click()

    // Filtered, because Next's own route announcer is an empty alert on every page.
    await expect(
      page.getByRole("alert").filter({ hasText: /not connected to them yet/i }),
    ).toBeVisible()
  })

  test("nobody's order is worth indexing", async ({ page }) => {
    await page.goto("/orders")
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    )
  })

  test("the reference typed goes with the question to WhatsApp", async ({ page }) => {
    await page.goto("/orders")
    await page.getByLabel("Your reference").fill("af-2327")

    const asking = page.getByRole("link", { name: /ask on whatsapp/i })
    await expect(asking).toHaveAttribute("href", /AF-2327/)
  })
})
