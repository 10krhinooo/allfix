import { test, expect } from "@playwright/test"
import { WHO, signIn } from "./helpers"

/**
 * The configurator, which is the shop's differentiating feature and the direct
 * answer to the compatibility problem the SKUs expose.
 */
test.describe("building a rail", () => {
  test("the bracket changes when the mount does", async ({ page }) => {
    await page.goto("/build?system=20")
    await expect(page.getByText("#20 Single Ceiling Bracket", { exact: true })).toBeVisible()

    await page.getByRole("button", { name: "Wall", exact: true }).click()
    await expect(page.getByText("#20 Single Wall Bracket", { exact: true })).toBeVisible()
    // And it is the single, not the double: the double is for the double rail.
    await expect(page.getByText("#20 Double Ceiling Bracket", { exact: true })).toHaveCount(0)
  })

  test("a quantity can be set by hand and the rule keeps running underneath", async ({ page }) => {
    await page.goto("/build?system=20&width=4.2")

    const brackets = page.locator("li", { hasText: "#20 Single Ceiling Bracket" })
      .locator('input[type="number"]')
    const before = await brackets.inputValue()

    await brackets.fill("12")
    await brackets.blur()
    await expect(page.getByText(/Yours\. We worked out/)).toBeVisible()

    // Widening the window moves everything nobody has spoken for, and leaves
    // the overridden line where it was put.
    await page.getByRole("button", { name: "Reset all" }).click()
    await expect(brackets).toHaveValue(before)
  })

  test("a saved window reopens from the query string", async ({ page }) => {
    await page.goto("/build?system=20&width=4.2&panels=2&mount=wall&runners=12&brackets=2")
    await expect(page.getByRole("spinbutton", { name: "Window width in metres" }))
      .toHaveValue("4.2")
  })

  test("a signed out visitor is asked who they are", async ({ page }) => {
    await page.goto("/build?system=20&width=3.6")
    await page.getByRole("button", { name: "Send it through the site" }).click()

    await expect(page.getByText("Your name")).toBeVisible()
    await expect(page.getByText("Sending as")).toHaveCount(0)
  })

  test("a signed in customer is not asked for details the shop already holds", async ({ page }) => {
    await signIn(page, WHO.customer)
    await page.goto("/build?system=20&width=3.6")
    await page.getByRole("button", { name: "Send it through the site" }).click()

    // What it will carry, rather than three fields asking for it again.
    await expect(page.getByText("Sending as")).toBeVisible()
    await expect(page.getByText("0733 265 741")).toBeVisible()
    await expect(page.getByText("Your name")).toHaveCount(0)

    // And the way out, with the number already in it, for a list going
    // somewhere that is not theirs.
    await page.getByRole("button", { name: "Use different details" }).click()
    await expect(page.getByRole("textbox", { name: "Phone number" }))
      .toHaveValue("0733 265 741")
  })
})
