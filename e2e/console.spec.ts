import { test, expect } from "@playwright/test"
import { signIn, WHO } from "./helpers"

/**
 * The back of the shop: the counter console, and the trade desk beside it.
 *
 * The console is where a price changes, so the assertions worth having are
 * about who may change one and what the console refuses to save.
 */

test.describe("the counter console", () => {
  test("an admin sees People and a member of staff does not", async ({ page }) => {
    await signIn(page, WHO.admin)
    const menu = page.getByRole("button", { name: "Open the console menu" })
    if (await menu.isVisible()) await menu.click()
    await expect(page.getByRole("link", { name: /People/ })).toBeVisible()

    await page.context().clearCookies()
    await signIn(page, WHO.staff)
    const staffMenu = page.getByRole("button", { name: "Open the console menu" })
    if (await staffMenu.isVisible()) await staffMenu.click()
    await expect(page.getByRole("link", { name: /People/ })).toHaveCount(0)
  })

  test("People is refused to staff at the route, not only hidden on the rail", async ({ page }) => {
    // Hiding a link is presentation. The gate is the thing.
    //
    // A 404 at the same URL rather than a redirect, and deliberately so: a
    // redirect tells somebody who guessed the address that the screen exists
    // and they are simply not allowed on it.
    await signIn(page, WHO.staff)
    const response = await page.goto("/admin/people")
    expect(response?.status()).toBe(404)
  })

  test("every console screen opens for an admin", async ({ page }) => {
    await signIn(page, WHO.admin)
    for (const path of ["/admin", "/admin/parts", "/admin/enquiries", "/admin/people", "/admin/profile"]) {
      const response = await page.goto(path)
      expect(response?.status(), path).toBe(200)
      await expect(page).toHaveURL(new RegExp(path.replace(/\//g, "\\/") + "$"))
    }
  })

  test("the old price and shot paths still land on the worksheet", async ({ page }) => {
    await signIn(page, WHO.admin)
    await page.goto("/admin/prices")
    await expect(page).toHaveURL(/\/admin\/parts/)
    await page.goto("/admin/shots")
    await expect(page).toHaveURL(/\/admin\/parts\?show=unshot/)
  })

  test("signing out closes the door behind you", async ({ page }) => {
    await signIn(page, WHO.admin)
    await expect(page).toHaveURL(/\/admin$/)

    const menu = page.getByRole("button", { name: "Open the console menu" })
    if (await menu.isVisible()) await menu.click()
    await page.getByRole("button", { name: /Sign out/i }).click()

    // The button clears the cookie and then navigates, so the landing is what
    // says it finished. Asking for /admin before that races the request.
    await expect(page).toHaveURL(/\/sign-in/)

    await page.goto("/admin")
    await expect(page).toHaveURL(/\/sign-in/)
  })
})

test.describe("the trade desk", () => {
  test("every screen opens for a trade account", async ({ page }) => {
    await signIn(page, WHO.trade)
    for (const path of ["/trade/account", "/trade/account/orders", "/trade/account/quotes", "/trade/account/profile"]) {
      const response = await page.goto(path)
      expect(response?.status(), path).toBe(200)
    }
  })

  test("a trade account cannot reach the console", async ({ page }) => {
    await signIn(page, WHO.trade)
    await page.goto("/admin/parts")
    await expect(page).toHaveURL(/\/trade\/account$/)
  })

  test("the trade pitch stays public, only the desk behind it is gated", async ({ page }) => {
    const response = await page.goto("/trade")
    expect(response?.status()).toBe(200)
  })
})
