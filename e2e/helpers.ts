import { expect, type Page } from "@playwright/test"

/** Every seeded account opens with this. Set by the web server in the config. */
export const PASSWORD = "allfix"

export const WHO = {
  admin: "hafsah@allfix.co.ke",
  staff: "counter@allfix.co.ke",
  trade: "njoroge@interiors.co.ke",
  customer: "p.ochieng@gmail.com",
  suspended: "old.counter@allfix.co.ke",
}

/**
 * Through the door, the way a person goes through it.
 *
 * Deliberately not by setting the cookie directly: the redirect that decides
 * which desk somebody lands on is the thing most worth testing, and shortcutting
 * the sign in would skip it.
 */
export async function signIn(page: Page, email: string, next?: string) {
  await page.goto(next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD)
  await page.getByRole("button", { name: "Sign in" }).click()
}

/** Puts a part in the basket through the product page, as a customer would. */
export async function addToBasket(page: Page, slug: string) {
  await page.goto(`/product/${slug}`)
  const add = page.getByRole("button", { name: "Add to basket" })
  await expect(add).toBeVisible()
  await add.click()
}
