import { test, expect } from "@playwright/test"

/**
 * The rod half of the shop, and the axis it browses on.
 *
 * Rails have had a page per system all along. Rods had nothing between `/shop`
 * and a product, so seventy four parts were reachable only by working a filter
 * and no search engine was ever given a page to rank. These check the thing
 * that made the pages worth building: a finish is a place you can arrive at,
 * link to, and leave from with the parts that go together.
 */

const FINISHES = ["Antique brass", "Antique copper", "Antique black", "Antique silver"]

test.describe("rod finishes", () => {
  test("every finish is on the picker and reaches its own page", async ({ page }) => {
    await page.goto("/ranges")
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/by the finish/i)

    for (const name of FINISHES) {
      await expect(page.getByRole("link", { name: new RegExp(name, "i") })).toBeVisible()
    }

    await page.getByRole("link", { name: /antique brass/i }).click()
    await expect(page).toHaveURL(/\/ranges\/antique-brass$/)
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/antique brass/i)
  })

  test("the count in the header is the count of the list beneath it", async ({ page }) => {
    await page.goto("/ranges/antique-brass")

    const stated = Number(
      await page.getByRole("term").filter({ hasText: /^Parts$/ }).locator("+ dd").innerText(),
    )
    expect(stated).toBeGreaterThan(0)

    // Every part on the page is a card in one of the component sections, so the
    // figure and the list under it can never disagree without this failing.
    const cards = await page.locator("main a[href^='/product/']").count()
    expect(cards).toBe(stated)
  })

  test("the pole comes before the things that hold it up", async ({ page }) => {
    await page.goto("/ranges/antique-brass")

    const jumps = page.getByRole("navigation", { name: /part types in this finish/i })
    const first = await jumps.getByRole("link").first().getAttribute("href")
    expect(first).toBe("#rod")
  })

  test("a bore lands on the shop with the finish and the size already chosen", async ({ page }) => {
    await page.goto("/ranges/antique-brass")
    await page.getByRole("link", { name: "19mm", exact: true }).click()

    await expect(page).toHaveURL(/\/shop\/rod\?range=antique-brass&diameter=19/)

    const count = async () => {
      // "16 products of 208" once a filter is on, so the count is read off the
      // front rather than matched whole.
      const text = await page.getByText(/^\d+ products?\b/).first().innerText()
      return Number(text.split(" ")[0])
    }
    const bored = await count()
    expect(bored).toBeGreaterThan(0)

    // The browser filters in memory, so a URL that parsed proves nothing on its
    // own: what proves it is that the same finish without a bore shows more.
    await page.goto("/shop/rod?range=antique-brass")
    expect(await count()).toBeGreaterThan(bored)
  })

  test("a rod's breadcrumb goes to its finish rather than to a filtered shop", async ({ page }) => {
    await page.goto("/ranges/antique-brass")
    await page.locator("main a[href^='/product/']").first().click()

    await page
      .getByRole("navigation", { name: /breadcrumb/i })
      .getByRole("link", { name: /antique brass/i })
      .click()
    await expect(page).toHaveURL(/\/ranges\/antique-brass$/)
  })

  test("the finishes are in the sitemap, which is what makes them pages", async ({ request }) => {
    const body = await (await request.get("/sitemap.xml")).text()
    expect(body).toContain("/ranges")
    for (const slug of ["antique-brass", "antique-copper", "antique-black", "antique-silver"]) {
      expect(body).toContain(`/ranges/${slug}`)
    }
  })
})
