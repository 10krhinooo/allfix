import { test, expect } from "@playwright/test"

/**
 * The way in, and the way back in.
 *
 * The registration and reset screens are the ones a customer meets when
 * something has already gone wrong, so what they say matters more than usual.
 */

test.describe("opening an account", () => {
  test("the strength meter reports every fault at once", async ({ page }) => {
    await page.goto("/auth/register")
    await page.getByLabel("Your name").fill("Peter Ochieng")
    await page.getByLabel("Email").fill("p.ochieng@example.com")
    await page.getByLabel("Password", { exact: true }).fill("allfix")

    // Short, one character class, and the shop's own name. All three at once,
    // rather than one revealed after the last is fixed. Read off the meter
    // itself: the phrase also appears as the strength label above the list.
    const meter = page.locator("#password-meter")
    await expect(meter).toContainText("Use at least 10 characters.")
    await expect(meter).toContainText("Mix at least two of")
    await expect(meter).toContainText("Avoid common words and the shop's name.")
  })

  test("a name in the password is refused", async ({ page }) => {
    await page.goto("/auth/register")
    await page.getByLabel("Your name").fill("Peter Ochieng")
    await page.getByLabel("Password", { exact: true }).fill("ochieng-rails-99")
    await expect(page.locator("#password-meter"))
      .toContainText("Do not use your name or email address")
  })

  test("a strong password is told so", async ({ page }) => {
    await page.goto("/auth/register")
    await page.getByLabel("Password", { exact: true }).fill("Kilimani7Gate")
    await expect(page.locator("#password-meter")).toContainText("Strong")
  })

  test("the password can be shown, and showing it does not rename the field", async ({ page }) => {
    // The toggle used to sit inside the label, so the field announced itself as
    // "Password Show" and changed its own name on every press.
    await page.goto("/auth/register")
    const field = page.getByLabel("Password", { exact: true })
    await field.fill("Kilimani7Gate")
    await expect(field).toHaveAttribute("type", "password")
    await page.getByRole("button", { name: "Show" }).click()
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text")
  })
})

test.describe("recovering a password", () => {
  test("the answer is the same for a registered address and an unknown one", async ({ page }) => {
    const said: string[] = []
    for (const email of ["p.ochieng@gmail.com", "nobody@nowhere.test"]) {
      await page.goto("/auth/forgot")
      await page.getByLabel("Email").fill(email)
      await page.getByRole("button", { name: /Send me a reset link/ }).click()
      said.push((await page.getByText(/reset link is on its way/i).textContent()) ?? "")
    }
    expect(said[0]).toBe(said[1])
  })

  test("a reset link with no token says so and offers another", async ({ page }) => {
    await page.goto("/auth/reset")
    await expect(page.getByText(/incomplete/i)).toBeVisible()
    await expect(page.getByRole("link", { name: /Ask for a new link/ })).toBeVisible()
  })

  test("a spent verification link is explained rather than 400ing", async ({ page }) => {
    await page.goto("/auth/verify?token=not-a-real-token")
    await expect(page.getByRole("heading", { name: /did not work/i })).toBeVisible()
  })

  test("the door offers both ways out", async ({ page }) => {
    await page.goto("/sign-in")
    await expect(page.getByRole("link", { name: /Forgotten your password/ })).toBeVisible()
    await expect(page.getByRole("link", { name: /Open an account/ })).toBeVisible()
  })
})
