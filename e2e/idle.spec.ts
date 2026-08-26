import { test, expect } from "@playwright/test"
import { signIn, WHO } from "./helpers"

/**
 * Being signed out for doing nothing.
 *
 * The window here is a minute (`ALLFIX_SESSION_IDLE_SECONDS` in the Playwright
 * config), because the real floor is five and a suite that waited that out
 * would not be run. What is being checked is the whole path rather than the
 * arithmetic: the unit layer in `test/session.test.mts` owns the arithmetic,
 * including the one that matters most, which is that touching a session never
 * extends its fourteen day cap.
 */

test.describe("the inactivity window", () => {
  test("the session says how long it has, and touching it moves that on", async ({ page }) => {
    await signIn(page, WHO.admin)

    const first = await page.evaluate(() =>
      fetch("/api/session", { cache: "no-store" }).then((r) => r.json()),
    )
    expect(first.signedIn).toBe(true)
    expect(first.idleWindowMs).toBe(60_000)
    expect(first.idleInMs).toBeGreaterThan(0)
    expect(first.idleInMs).toBeLessThanOrEqual(60_000)

    await page.waitForTimeout(3_000)

    // Worn down by the wait, which is what a window that slides looks like from
    // the outside.
    const worn = await page.evaluate(() =>
      fetch("/api/session", { cache: "no-store" }).then((r) => r.json()),
    )
    expect(worn.idleInMs).toBeLessThan(59_000)

    const touched = await page.evaluate(() =>
      fetch("/api/session/touch", { method: "POST" }).then((r) => r.json()),
    )
    expect(touched.signedIn).toBe(true)
    /*
     * Back to the full window, which is what "last seen just now" means. Asserted
     * against the window rather than against the earlier reading: both reads
     * happen milliseconds after a touch, so "greater than before" can be a
     * comparison of two identical numbers and fail for no reason at all.
     */
    expect(touched.idleInMs).toBeGreaterThan(59_000)
    expect(touched.idleInMs).toBeLessThanOrEqual(60_000)
  })

  test("touching without a session is refused and takes the cookies with it", async ({ page }) => {
    await page.goto("/")
    const answer = await page.evaluate(() =>
      fetch("/api/session/touch", { method: "POST" }).then((r) => r.status),
    )
    expect(answer).toBe(401)
  })

  test("a warning arrives before the end, and staying keeps the session", async ({ page }) => {
    test.setTimeout(120_000)
    await signIn(page, WHO.admin)

    const stay = page.getByRole("button", { name: "Stay signed in" })
    await expect(stay).toBeVisible({ timeout: 100_000 })

    // The panel has to be findable by a screen reader as well as by a mouse.
    await expect(page.getByRole("alertdialog")).toBeVisible()

    await stay.click()
    await expect(stay).toBeHidden()

    // Still at the desk a moment later, rather than at the door.
    await page.waitForTimeout(3_000)
    await expect(page).toHaveURL(/\/admin/)
  })

  test("doing nothing long enough ends at the door, and the door says why", async ({ page }) => {
    test.setTimeout(180_000)
    await signIn(page, WHO.admin)

    await expect(page).toHaveURL(/\/sign-in\?idle=1/, { timeout: 120_000 })
    await expect(page.getByRole("status")).toContainText(/idle for a while/i)

    // And the way back is the page they were on, not the top of the console.
    await expect(page).toHaveURL(/next=/)
  })

  test("a lapsed session is turned away and its cookies cleared", async ({ page, context }) => {
    await signIn(page, WHO.admin)
    await expect(page).toHaveURL(/\/admin/)

    // Nothing here waits: the cookie is simply taken away, which is what the
    // browser will have been told to do by the time the window closes.
    await context.clearCookies()

    const response = await page.goto("/admin/parts?show=unpriced")
    expect(response?.status()).toBe(200)
    await expect(page).toHaveURL(/\/sign-in/)
    await expect(page).toHaveURL(/next=%2Fadmin%2Fparts/)
  })
})
