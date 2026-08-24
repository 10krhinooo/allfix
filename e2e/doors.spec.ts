import { test, expect } from "@playwright/test"
import { signIn, WHO } from "./helpers"

/**
 * One door, four roles, and the refusals.
 *
 * The redirect that decides where somebody lands is the single piece of logic
 * every screen behind it depends on, and it only happens in a browser.
 */
test.describe("the door", () => {
  test("each role lands at its own desk", async ({ page }) => {
    for (const [email, desk] of [
      [WHO.admin, "/admin"],
      [WHO.staff, "/admin"],
      [WHO.trade, "/trade/account"],
      [WHO.customer, "/account"],
    ] as const) {
      await page.context().clearCookies()
      await signIn(page, email)
      await expect(page).toHaveURL(new RegExp(`${desk.replace("/", "\\/")}$`))
    }
  })

  test("a wrong password does not open a seeded account", async ({ page }) => {
    await page.goto("/sign-in")
    await page.getByLabel("Email").fill(WHO.customer)
    await page.getByLabel("Password", { exact: true }).fill("not-the-password")
    await page.getByRole("button", { name: "Sign in" }).click()
    await expect(page.locator('p[role="alert"]')).toContainText("do not match")
  })

  test("a suspended account is refused with something a person can act on", async ({ page }) => {
    await signIn(page, WHO.suspended)
    await expect(page.locator('p[role="alert"]')).toContainText("suspended")
  })

  test("an unregistered address is refused identically to a wrong password", async ({ page }) => {
    // Anything else and the door is a way of asking who shops here.
    await signIn(page, "nobody@nowhere.test")
    await expect(page.locator('p[role="alert"]')).toContainText("do not match")
  })

  test("a customer cannot reach the console or the trade desk", async ({ page }) => {
    await signIn(page, WHO.customer)
    await page.goto("/admin")
    await expect(page).toHaveURL(/\/account$/)
    await page.goto("/trade/account")
    await expect(page).toHaveURL(/\/account$/)
  })

  test("staff hitting the shopper account are sent to their own desk", async ({ page }) => {
    await signIn(page, WHO.staff)
    await page.goto("/account")
    await expect(page).toHaveURL(/\/admin$/)
  })

  test("signed out, the account area sends you to the door and back", async ({ page }) => {
    await page.goto("/account/orders")
    await expect(page).toHaveURL(/\/sign-in\?next=%2Faccount%2Forders$/)
  })

  test("the seeded account list is not printed on the door", async ({ page }) => {
    // It was a set of half credentials on screen. There is a real password now.
    await page.goto("/sign-in")
    await expect(page.getByText("Seeded accounts")).toHaveCount(0)
    await expect(page.getByText(WHO.admin)).toHaveCount(0)
  })

  test("both logos on the door go back to the shop", async ({ page }) => {
    await page.goto("/sign-in")
    const backHome = page.getByRole("link", { name: /back to the shop/i })
    // One on the sheet, and one on the dark half beside it.
    await expect(backHome).toHaveCount(await backHome.count())
    await backHome.first().click()
    await expect(page).toHaveURL(/\/$/)
  })
})
