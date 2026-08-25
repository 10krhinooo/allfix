import { test, expect } from "@playwright/test"
import { signIn, WHO } from "./helpers"

/**
 * The shop's own settings, and who may change them.
 *
 * The screen is worth testing for two things that are easy to get wrong and
 * invisible when they are: that a member of staff cannot reach it at the URL as
 * well as not seeing it on the rail, and that saving with nowhere to save to
 * says so instead of showing a tick.
 */

test.describe("the settings screen", () => {
  test("an owner sees Settings on the rail and a member of staff does not", async ({ page }) => {
    await signIn(page, WHO.admin)
    const menu = page.getByRole("button", { name: "Open the console menu" })
    if (await menu.isVisible()) await menu.click()
    await expect(page.getByRole("link", { name: /Settings/ })).toBeVisible()

    await page.context().clearCookies()
    await signIn(page, WHO.staff)
    const staffMenu = page.getByRole("button", { name: "Open the console menu" })
    if (await staffMenu.isVisible()) await staffMenu.click()
    await expect(page.getByRole("link", { name: /Settings/ })).toHaveCount(0)
  })

  test("it is refused to staff at the route, not only hidden on the rail", async ({ page }) => {
    await signIn(page, WHO.staff)
    const response = await page.goto("/admin/settings")
    expect(response?.status()).toBe(404)
  })

  test("it says where the settings it is showing came from", async ({ page }) => {
    // No settings service is configured in this suite, and the screen has to
    // say so rather than implying a database behind it.
    await signIn(page, WHO.admin, "/admin/settings")
    await expect(page.getByText(/Read from the environment/)).toBeVisible()
  })

  test("a half typed address is not previewed as a live link", async ({ page }) => {
    await signIn(page, WHO.admin, "/admin/settings")
    await page.getByLabel("Instagram").fill("instagram.com/allfix")
    await expect(page.getByText(/is not a full web address/)).toBeVisible()

    await page.getByLabel("Instagram").fill("https://instagram.com/allfixbykipekee")
    await expect(page.getByText(/is not a full web address/)).toHaveCount(0)
    await expect(page.getByRole("link", { name: "Instagram" })).toBeVisible()
  })

  test("saving with nowhere to save to says so rather than showing a tick", async ({ page }) => {
    await signIn(page, WHO.admin, "/admin/settings")
    await page.getByRole("button", { name: "Save these settings" }).click()
    await expect(page.getByText(/No settings service is configured, so nothing was saved/)).toBeVisible()
  })
})

test("the footer shows no social row until there are accounts to show", async ({ page }) => {
  // Six icons pointing at accounts that do not exist would be a worse footer
  // than one without them.
  await page.goto("/")
  await expect(page.locator("footer a[rel~='me']")).toHaveCount(0)
})
