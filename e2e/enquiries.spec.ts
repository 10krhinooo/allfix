import { test, expect } from "@playwright/test"
import type { Page } from "@playwright/test"
import { signIn, WHO } from "./helpers"

/**
 * The enquiry pipeline, from the form to the counter.
 *
 * The whole argument for taking an enquiry through the site rather than only on
 * WhatsApp is that it leaves a record somebody other than the phone's owner can
 * pick up. That argument is only true if the enquiry actually arrives, so the
 * test that matters walks both ends: fill the form on the shop, then open the
 * console and find it in the queue with the reference the customer was given.
 *
 * The store behind it is localStorage until the backend is deployed, which is
 * why these run in one browser context rather than two.
 */

async function book(page: Page, fields: { name: string; phone: string; email?: string }) {
  await page.goto("/book")
  await page.getByLabel("Your name").fill(fields.name)
  await page.getByLabel("Phone number").fill(fields.phone)
  if (fields.email) await page.getByLabel("Email, if you use one").fill(fields.email)
  await page.getByLabel("Area or town").fill("Kileleshwa")
  await page.getByRole("button", { name: "Book through the site" }).click()
}

test.describe("booking a visit", () => {
  test("a booking is taken and answers with a reference", async ({ page }) => {
    await book(page, { name: "Wanjiru Kamau", phone: "0722 418 093" })

    await expect(page.getByText("We have your request.")).toBeVisible()
    await expect(page.getByText(/AF-\d+/)).toBeVisible()
    // The site cannot honour a slot nobody at the counter has looked at, so it
    // must not say it has. This wording is the promise the shop can keep.
    await expect(page.getByText(/Nothing is in the diary yet/)).toBeVisible()
  })

  test("a signed in customer books without retyping who they are", async ({ page }) => {
    // The counter still gets a name and a number on the enquiry. It just does
    // not get them by asking somebody who signed in a moment ago.
    await signIn(page, WHO.customer)
    await page.goto("/book")

    await expect(page.getByText("Sending as")).toBeVisible()
    await expect(page.getByText("0733 265 741")).toBeVisible()
    await expect(page.getByLabel("Your name")).toHaveCount(0)

    await page.getByLabel("Area or town").fill("Kasarani")
    await page.getByRole("button", { name: /Book/i }).first().click()

    await expect(page.getByText("We have your request.")).toBeVisible()
    await expect(page.getByText(/AF-\d+/)).toBeVisible()
    // Rung back on the number the account carries, without it being typed.
    await expect(page.getByText(/0733 265 741/).first()).toBeVisible()
  })

  test("a booking without a phone number is refused, and keeps what was typed", async ({ page }) => {
    await page.goto("/book")
    await page.getByLabel("Your name").fill("Grace Mutiso")
    await page.getByLabel("Area or town").fill("Syokimau")
    await page.getByRole("button", { name: "Book through the site" }).click()

    await expect(page.getByRole("alert").filter({ hasText: "phone number" })).toBeVisible()
    // Somebody has just been up a ladder with a tape measure. Losing that to a
    // refusal is the one outcome worth engineering against.
    await expect(page.getByLabel("Your name")).toHaveValue("Grace Mutiso")
    await expect(page.getByLabel("Area or town")).toHaveValue("Syokimau")
  })

  test("an address that is not one is caught beside the field", async ({ page }) => {
    await book(page, { name: "Hassan Ali", phone: "0759 118 602", email: "hassan.at.example" })

    await expect(page.getByRole("alert").filter({ hasText: "does not look right" })).toBeVisible()
    await expect(page.getByText(/AF-\d+/)).toHaveCount(0)
  })

  test("an address given is said back, so it is obvious where the reference went", async ({
    page,
  }) => {
    await book(page, {
      name: "Wanjiru Kamau",
      phone: "0722 418 093",
      email: "wanjiru@example.com",
    })

    await expect(page.getByText(/sent that reference to wanjiru@example.com/)).toBeVisible()
  })

  test("the email is optional, and leaving it out books just the same", async ({ page }) => {
    await book(page, { name: "Peter Ochieng", phone: "0733 265 741" })

    await expect(page.getByText(/AF-\d+/)).toBeVisible()
    await expect(page.getByText(/sent that reference to/)).toHaveCount(0)
  })
})

test.describe("a service enquiry", () => {
  test("every service page can take one without leaving the page", async ({ page }) => {
    for (const slug of ["installation", "motorisation", "consultation"]) {
      await page.goto(`/services/${slug}`)
      await expect(page.getByRole("button", { name: "Send through the site" })).toBeVisible()
    }
  })

  test("a motorised enquiry says somebody has to come and look", async ({ page }) => {
    await page.goto("/services/motorisation")
    await page.getByLabel("Your name").fill("Amina Yusuf")
    await page.getByLabel("Phone number").fill("0710 884 220")
    await page.getByRole("button", { name: "Send through the site" }).click()

    await expect(page.getByText("We have your enquiry.")).toBeVisible()
    // Motorisation is not work anybody can price down a phone, and the copy
    // says so rather than promising a figure.
    await expect(page.getByText(/arrange a look at the job/)).toBeVisible()
  })

  test("fitting is quoted from what the customer says, not surveyed", async ({ page }) => {
    await page.goto("/services/installation")
    await page.getByLabel("Your name").fill("Njoroge Interiors")
    await page.getByLabel("Phone number").fill("0748 552 118")
    await page.getByRole("button", { name: "Send through the site" }).click()

    await expect(page.getByText(/talk it through and price it/)).toBeVisible()
  })
})

test.describe("what the counter sees", () => {
  test("an enquiry sent through the site is in the queue with its reference", async ({ page }) => {
    await book(page, {
      name: "Wanjiru Kamau",
      phone: "0722 418 093",
      email: "wanjiru@example.com",
    })
    const reference = (await page.getByText(/AF-\d+/).first().textContent())?.trim() ?? ""
    expect(reference).toMatch(/AF-\d+/)

    await signIn(page, WHO.staff)
    await page.waitForURL(/\/admin/)
    await page.goto("/admin/enquiries")

    // Scoped to the card carrying the reference this run created. Against a real
    // service the queue keeps everything every previous run filed, so anything
    // matched across the whole page finds four Wanjirus and none of them
    // provably the one just sent.
    const card = page.locator("li", { hasText: reference }).first()
    await expect(card.getByText(`${reference} through the site`)).toBeVisible()
    await expect(card.getByText("wanjiru@example.com")).toBeVisible()
    // The counter can answer in writing where there is an address, and in the
    // customer's own channel where there is not.
    await expect(card.getByRole("link", { name: /Reply by email to Wanjiru Kamau/ })).toBeVisible()
  })

  test("the seeded enquiries carry no address and offer no email reply", async ({ page }) => {
    await signIn(page, WHO.staff)
    await page.waitForURL(/\/admin/)
    await page.goto("/admin/enquiries")

    // They came in over WhatsApp and the phone, which is the case the queue has
    // to read well rather than the exception.
    await expect(page.getByRole("link", { name: /Reply on WhatsApp to Grace Mutiso/ })).toBeVisible()
    await expect(page.getByRole("link", { name: /Reply by email to Grace Mutiso/ })).toHaveCount(0)
  })

  test("the queue is not readable by a customer", async ({ page }) => {
    await signIn(page, WHO.customer)
    await page.waitForURL(/\/account/)
    await page.goto("/admin/enquiries")

    // Turned away at the door rather than shown an empty screen: the proxy
    // sends somebody to the desk their role actually owns.
    await expect(page).toHaveURL(/\/account/)
    await expect(page.getByRole("link", { name: /Reply on WhatsApp/ })).toHaveCount(0)
  })
})
