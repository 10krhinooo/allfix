import { test, expect, type Page } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { signIn, WHO } from "./helpers"

/**
 * The pass a keyboard and a screen reader make over this shop.
 *
 * Automated checking catches perhaps half of what matters, and it catches
 * exactly the half that regresses silently: a contrast ratio nudged by a token
 * change, a heading level skipped in a refactor, a control that lost its name
 * when an icon replaced its text. So this is a floor rather than a certificate,
 * and the tests below it are the things a person actually has to do, which axe
 * cannot check: tab to the content, work a menu without a mouse, and be told
 * when something changed.
 *
 * Everything here runs with reduced motion asked for, which is a real user
 * setting and also the only way the measurements mean anything: the auth sheet
 * and the console rise in on an opacity transition, and a contrast check taken
 * mid-animation is a check of a colour nobody ever sees.
 *
 * Serious and critical only. Axe's "minor" findings on a page like this are
 * mostly advice about landmark naming that would make the markup worse to
 * satisfy, and a suite that fails on advice stops being read.
 */

test.use({ contextOptions: { reducedMotion: "reduce" } })

async function violations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()

  return results.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  )
}

const PUBLIC = [
  ["the front page", "/"],
  ["the systems index", "/systems"],
  ["a system", "/systems/20"],
  ["the shop", "/shop"],
  ["a product", "/product/20-runners"],
  ["the configurator", "/build"],
  ["the services index", "/services"],
  ["a service", "/services/installation"],
  ["booking", "/book"],
  ["trade", "/trade"],
  ["the basket", "/cart"],
  ["checkout", "/checkout"],
  ["the door", "/sign-in"],
  ["registration", "/auth/register"],
]

for (const [what, path] of PUBLIC) {
  test(`${what} has nothing serious wrong with it`, async ({ page }) => {
    await page.goto(path)
    const found = await violations(page)
    expect(found.map((one) => `${one.id} on ${one.nodes.length}`)).toEqual([])
  })
}

test("the desks are checked too, behind the door", async ({ page }) => {
  // A staff screen worked all day is worth as much care as a shop page, and it
  // is the one nobody outside the shop ever files a complaint about.
  await signIn(page, WHO.admin)
  // Orders was built in phase 3 and never added here, which is exactly how a
  // sweep quietly stops covering the console: the list is hand kept, so a new
  // screen is only checked if somebody remembers to name it.
  for (const path of [
    "/admin",
    "/admin/parts",
    "/admin/parts/new",
    "/admin/parts/20-runners",
    "/admin/orders",
    "/admin/stock",
    "/admin/enquiries",
    "/admin/settings",
  ]) {
    await page.goto(path)
    const found = await violations(page)
    expect(found.map((one) => `${path}: ${one.id}`)).toEqual([])
  }
})

test.describe("what a person actually has to do", () => {
  test("the first tab reaches the page rather than the whole header", async ({ page }) => {
    // Without this a keyboard user tabs through the entire navigation on every
    // page before reaching a word of what they came for.
    await page.goto("/shop")
    await page.keyboard.press("Tab")

    const focused = page.locator(":focus")
    await expect(focused).toHaveText(/skip to/i)

    await page.keyboard.press("Enter")
    await expect(page.locator("#content")).toBeVisible()
  })

  test("the menu on a phone opens, closes on Escape and hands focus back", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 })
    await page.goto("/")

    const trigger = page.getByRole("button", { name: "Open the menu" })
    await trigger.click()
    await expect(page.locator("#mobile-nav").getByRole("link", { name: "All parts" })).toBeVisible()

    await page.keyboard.press("Escape")
    await expect(page.getByRole("button", { name: "Open the menu" })).toBeFocused()
  })

  test("a refusal is announced rather than only coloured", async ({ page }) => {
    // A filled form rather than an empty one: an empty one is caught by the
    // browser's own required-field validation, which announces itself. What is
    // worth checking is the shop's refusal, which is ours to announce.
    await page.goto("/auth/register")
    await page.getByLabel("Your name").fill("Grace Mutiso")
    await page.getByLabel("Email").fill(`a11y-${Date.now()}@example.com`)
    await page.getByLabel("Password", { exact: true }).fill("Tumbili-Rafiki-88")
    await page.getByRole("button", { name: "Open an account" }).click()

    // Announced, not only red: an outline says nothing to somebody who cannot
    // see it.
    await expect(page.locator("[role='alert']").first()).toBeVisible()
  })

  test("a status that changes is announced rather than only drawn", async ({ page }) => {
    await page.goto("/book")
    await expect(page.locator("[aria-live], [role='status']").first()).toHaveCount(1)
  })
})
