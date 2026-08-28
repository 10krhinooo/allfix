import { test, expect } from "@playwright/test"
import { signIn, WHO } from "./helpers"

/**
 * The stock screen, unwired.
 *
 * The suite runs with no service, which is the state this screen has to handle
 * most carefully. Counts are the shop's records rather than this browser's, so
 * with nothing to ask there is genuinely nothing to show, and the screen has to
 * say so rather than draw an empty shelf. "Nothing is on the shelf" and "nobody
 * could ask" are different sentences and only one of them is ever true here.
 */

test.describe("stock", () => {
  test("the counter reaches it and the rail names it", async ({ page }) => {
    await signIn(page, WHO.staff)
    const response = await page.goto("/admin/stock")
    expect(response?.status()).toBe(200)

    const menu = page.getByRole("button", { name: "Open the console menu" })
    if (await menu.isVisible()) await menu.click()
    await expect(page.getByRole("link", { name: /Stock/ })).toBeVisible()
  })

  test("with no service it says nobody could ask, rather than showing an empty shelf", async ({
    page,
  }) => {
    await signIn(page, WHO.staff)
    await page.goto("/admin/stock")
    await expect(page.getByText("No stock service is reachable")).toBeVisible()
    // And no figure anywhere, because every figure it could draw would be made up.
    await expect(page.getByRole("table")).toHaveCount(0)
  })

  test("a customer never reaches it", async ({ page }) => {
    // Turned away by the proxy, which sends a customer to their own account
    // before the route renders at all. So the assertion is where they end up:
    // asking for a status here reads the status of wherever the redirect landed,
    // which is 200 whatever the console was going to say.
    await signIn(page, WHO.customer)
    await page.goto("/admin/stock")
    await expect(page).not.toHaveURL(/\/admin\/stock/)
  })

  test("a trade account does not get it either", async ({ page }) => {
    await signIn(page, WHO.trade)
    await page.goto("/admin/stock")
    await expect(page).not.toHaveURL(/\/admin\/stock/)
  })
})
