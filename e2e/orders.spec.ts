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

  test("with no service it says so rather than showing an empty list", async ({ page }) => {
    // An empty orders screen and an unreachable one look identical and mean
    // opposite things. One says there is nothing to pack.
    await signIn(page, WHO.staff)
    await page.waitForURL(/\/admin/)
    await page.goto("/admin/orders")

    await expect(page.getByText(/No order service is reachable/i)).toBeVisible()
  })
})
