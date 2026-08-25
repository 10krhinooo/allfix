import { test, expect } from "@playwright/test"
import { signIn, WHO } from "./helpers"

/**
 * Every public page, and the things that make them worth having.
 *
 * The old site's failure was not that a page was ugly: it was that a page said
 * nothing a customer could act on, or said "KES 0", or linked somewhere that
 * did not exist. So these check what a page can do rather than that it renders.
 */

const PUBLIC_PAGES = [
  ["/", /Curtains that hang properly/i],
  ["/systems", /rail/i],
  ["/shop", /./],
  ["/build", /Build a rail/i],
  ["/services", /./],
  ["/book", /./],
  ["/trade", /./],
  ["/privacy", /Privacy/i],
  ["/terms", /Terms/i],
  ["/cart", /basket/i],
] as const

test.describe("the storefront", () => {
  for (const [path, heading] of PUBLIC_PAGES) {
    test(`${path} opens and has a heading`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      await expect(page.locator("h1")).toContainText(heading)
    })
  }

  test("no page offers a link to a route that does not exist", async ({ page }) => {
    // The rule CLAUDE.md exists to protect: a call to action pointing nowhere.
    await page.goto("/")
    const hrefs = await page.locator("a[href^='/']").evaluateAll((links) =>
      Array.from(new Set(links.map((link) => (link as HTMLAnchorElement).getAttribute("href")!))),
    )
    for (const href of hrefs) {
      const response = await page.request.get(href)
      expect(response.status(), `${href} is linked from the home page`).toBeLessThan(400)
    }
  })

  test("a price is never rendered as KES 0", async ({ page }) => {
    // The exact bug that left the old store unable to sell.
    for (const path of ["/shop", "/systems/20", "/product/20-track"]) {
      await page.goto(path)
      await expect(page.getByText(/KES\s*0(?!\d)/)).toHaveCount(0)
    }
  })

  test("an unpriced part asks rather than showing a figure", async ({ page }) => {
    await page.goto("/shop?buy=0")
    await expect(page.getByText(/on request/i).first()).toBeVisible()
  })
})

test.describe("browsing by what you already own", () => {
  test("a system page lists the parts that fit it", async ({ page }) => {
    await page.goto("/systems/20")
    await expect(page.locator("h1")).toContainText("#20")
    await expect(page.getByRole("link", { name: /#20 Track/i }).first()).toBeVisible()
  })

  test("the shop filters in the browser and the URL follows", async ({ page }) => {
    await page.goto("/shop")
    await expect(page.locator("a[href^='/product/']").first()).toBeVisible()

    // A facet is a radio, and on a phone the whole set is behind a drawer that
    // slides in, so the control has to be waited for rather than assumed.
    const filters = page.getByRole("button", { name: /^Filters/ })
    if (await filters.isVisible()) await filters.click()

    // The input is visually hidden behind a styled marker, which is the point of
    // the pattern, so the label is what a person actually clicks.
    // The facet set is rendered twice, once for the sidebar and once for the
    // drawer, so the visible one is the one to click on either viewport.
    const rods = page.locator("label:visible").filter({ hasText: /^Rods/ }).first()
    await expect(rods).toBeVisible()
    await rods.click()

    // The URL mirrors the state through history.replaceState rather than a
    // navigation, and it is debounced, so it arrives shortly after the click.
    await expect(page).toHaveURL(/family=rod/, { timeout: 10_000 })
  })

  test("a shared shop link opens on the same view", async ({ page }) => {
    await page.goto("/shop?family=rod&sort=price-asc")
    await expect(page).toHaveURL(/family=rod/)
    await expect(page.locator("h1")).toBeVisible()
  })

  test("an unknown filter value is dropped rather than emptying the grid", async ({ page }) => {
    await page.goto("/shop?system=not-a-system")
    await expect(page.getByText(/nothing/i)).toHaveCount(0)
  })
})

test.describe("the curtain", () => {
  test("does not wipe between two shop pages", async ({ page }) => {
    // A curtain between a product and the part list it belongs to is a
    // performance in the way of the next page.
    await page.goto("/shop")

    // A card links to the same product twice: the photo, and the title with a
    // stretched pseudo-element over the whole tile. The stretched one is what a
    // person actually hits, so it is what the test hits.
    const href = await page.locator("a[href^='/product/']").first().getAttribute("href")
    await page.locator(`a[href="${href}"]`).last().click()

    await expect(page).toHaveURL(/\/product\//)
    await expect(page.locator(".curtain-leaf")).toHaveCount(0)
  })

  test("is still the front page's own arrival", async ({ page }) => {
    const response = await page.goto("/")
    expect(response?.status()).toBe(200)
    await expect(page.locator("h1")).toBeVisible()
  })

  test("draws the crossing from the console out to the shop", async ({ page }) => {
    // The one navigation that is a genuine change of place: the back of the
    // shop to the front of it. It used to arrive on a jump cut, because the
    // wipe decided whether a document was fresh by asking whether its own
    // template had mounted, and coming out of a desk it never had.
    //
    // The hero is marked as already seen, so the wipe owns this arrival rather
    // than the reveal. The two can never both play, which is the other half of
    // the rule and is why the hero hides itself when it is not its turn.
    await page.addInitScript(() => sessionStorage.setItem("allfix-curtain-seen", "1"))
    await signIn(page, WHO.staff)
    await expect(page).toHaveURL(/\/admin$/)

    // On a phone the rail is a drawer, and the way out is inside it.
    const menu = page.getByRole("button", { name: "Open the console menu" })
    if (await menu.isVisible()) await menu.click()
    await page.getByRole("link", { name: "The shop", exact: true }).click()
    await page.waitForURL("**/")

    // The runners are the wipe's own: the hero draws a rail and a motor, and
    // this draws neither.
    await expect(page.locator(".page-curtain-runners").first()).toBeVisible()

    // And it takes itself off the page rather than parking there.
    await expect(page.locator(".page-curtain-runners")).toHaveCount(0, { timeout: 4000 })
    await expect(page.locator("h1")).toBeVisible()
  })
})

test.describe("what search engines and old links see", () => {
  test("the sitemap and robots are served", async ({ page }) => {
    for (const path of ["/sitemap.xml", "/robots.txt"]) {
      const response = await page.request.get(path)
      expect(response.status()).toBe(200)
    }
  })

  test("every legacy WordPress URL lands somewhere real", async ({ page }) => {
    const legacy = [
      "/curtain-rails",
      "/motorised-rails",
      "/curtain-rods",
      "/finials",
      "/rings",
      "/tie-backs",
      "/end-cups",
      "/rail-accessories",
      "/rods-accessories",
    ]
    for (const path of legacy) {
      const response = await page.request.get(path)
      expect(response.status(), `${path} should redirect to a live route`).toBe(200)
      expect(response.url()).not.toContain(path)
    }
  })

  test("the storefront carries its structured data", async ({ page }) => {
    await page.goto("/")
    const schema = await page.locator('script[type="application/ld+json"]').first().textContent()
    expect(schema).toContain("HardwareStore")
  })

  test("the console and the account are kept out of search results", async ({ page }) => {
    await page.goto("/sign-in")
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/)
  })
})
