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
    for (const path of [
      "/admin",
      "/admin/parts",
      "/admin/enquiries",
      "/admin/people",
      "/admin/profile",
    ]) {
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

  test("a stored enquiry from an older browser does not take the console down", async ({
    page,
  }) => {
    // The console's inbox is `localStorage`, standing in for a table the
    // service will own, so what is in it is whatever some earlier build wrote.
    // A record missing two fields this build reads used to throw during render
    // and put the error page over every console screen, for one browser, until
    // somebody cleared it by hand. The person locked out is a member of staff
    // at a counter, and the enquiry is worth less than the console.
    await page.addInitScript(() => {
      localStorage.setItem(
        "allfix-admin-v1",
        JSON.stringify({ enquiries: {}, inbox: [{ id: "x", reference: "AF-Q-1", at: 1 }] }),
      )
    })
    await signIn(page, WHO.staff)

    await page.goto("/admin/enquiries")
    await expect(page.getByRole("heading", { name: "Enquiries", level: 1 })).toBeVisible()
  })

  test("the platform screen belongs to whoever keeps the service, and to nobody else", async ({
    page,
  }) => {
    // The same gate People and Settings have, and for a sharper version of the
    // same reason: this screen names which configuration values a deployment is
    // missing, which is not something whoever is covering the counter on a
    // Saturday should be reading off a screen. Not found rather than refused,
    // so a guess does not confirm the screen exists.
    await signIn(page, WHO.staff)
    expect((await page.goto("/admin/platform"))?.status()).toBe(404)
    await expect(page.getByRole("link", { name: /Platform/ })).toHaveCount(0)
  })

  test("the owner is refused the platform screen as well", async ({ page }) => {
    // The assertion worth having: this is the one screen an ADMIN does not
    // hold. Owning the shop and keeping the service running are the same job
    // here only because nobody has been hired for the second one yet.
    //
    // Its own test rather than a second half of the one above, because signing
    // in twice in one test does not work: `signIn` goes to /sign-in, and the
    // proxy sends an account that already holds a session to its own desk, so
    // the form never renders and the fill times out.
    await signIn(page, WHO.admin)
    expect((await page.goto("/admin/platform"))?.status()).toBe(404)
    await expect(page.getByRole("link", { name: /Platform/ })).toHaveCount(0)
  })

  test("whoever keeps the service lands on it, and gets nothing else", async ({ page }) => {
    await signIn(page, WHO.platform)
    // Straight there, rather than to a dashboard of takings they have no use for.
    await expect(page).toHaveURL(/\/admin\/platform$/)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()

    // The shop's own screens are shut to them for the mirror of the reason the
    // platform is shut to the owner: a migration number is not counter work and
    // a price is not platform work.
    // Parts and Enquiries are named here on purpose. Both used to be gated by
    // the proxy's `console` check alone, which was the same question as "is
    // this staff" until this role existed. One carries every price the shop
    // charges and the other every customer's phone number.
    for (const path of [
      "/admin/parts",
      "/admin/enquiries",
      "/admin/people",
      "/admin/settings",
      "/admin/stock",
      "/admin/orders",
    ]) {
      expect((await page.goto(path))?.status(), path).toBe(404)
    }
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
