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
  // And wait for the attempt to settle before handing the page back.
  //
  // Without this the click returns while the sign in is still in flight, and a
  // test whose next line is `page.goto` on a gated route races it: the proxy
  // sees no session, redirects to /sign-in, and that redirect is a 200. A test
  // asserting a status then reads 200 whatever the page was going to say, so
  // `expect(response.status()).toBe(404)` failed with a screenshot of the sign
  // in form. It only ever bit the few tests that assert on a status rather than
  // on something visible, because everything else auto-waits, which is why it
  // read as two proforma tests taking turns to be flaky.
  //
  // Settled, not signed in: the door tests hand this a suspended account and an
  // address that was never registered, and both are meant to be turned away. So
  // the wait ends on whichever comes first, the URL leaving the sign in page or
  // the refusal appearing on it, and either one means the request is done.
  const left = page
    .waitForURL((url) => !url.pathname.startsWith("/sign-in"))
    .catch(() => {})
  const refused = page
    .locator('p[role="alert"]')
    .waitFor({ state: "visible" })
    .catch(() => {})
  await Promise.race([left, refused])
}

/** Puts a part in the basket through the product page, as a customer would. */
export async function addToBasket(page: Page, slug: string) {
  await page.goto(`/product/${slug}`)
  const add = page.getByRole("button", { name: "Add to basket" })
  await expect(add).toBeVisible()
  await add.click()
}
