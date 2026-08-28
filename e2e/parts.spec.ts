import { test, expect } from "@playwright/test"
import { signIn, WHO } from "./helpers"

/**
 * Adding and altering a part, unwired.
 *
 * The suite runs with no service, which is the state these screens have to
 * handle most carefully: the catalogue is the shop's records rather than this
 * browser's, so with nothing to ask there is nowhere for a change to go. Saying
 * that plainly is the whole assertion. A screen that showed a tick and dropped
 * the change is exactly the fault this work exists to fix.
 */

test.describe("adding a part", () => {
  test("the counter reaches the form and it teaches the code rules", async ({ page }) => {
    await signIn(page, WHO.staff)
    const response = await page.goto("/admin/parts/new")
    expect(response?.status()).toBe(200)

    // The rules are not guessable, and the alternative to saying them is
    // finding them one refusal at a time.
    await expect(page.getByText(/A rail code starts/)).toBeVisible()
    await expect(page.getByText(/what kind of part it is comes out of the name/i)).toBeVisible()
  })

  test("nothing can be added without a code and a name", async ({ page }) => {
    await signIn(page, WHO.staff)
    await page.goto("/admin/parts/new")
    const add = page.getByRole("button", { name: "Add the part" })
    await expect(add).toBeDisabled()

    await page.getByLabel("Product code").fill("RL#20_099")
    await expect(add).toBeDisabled()

    await page.getByLabel("Name", { exact: true }).fill("#20 Test Bracket")
    await expect(add).toBeEnabled()
  })

  test("with no service it says so rather than showing a tick", async ({ page }) => {
    await signIn(page, WHO.staff)
    await page.goto("/admin/parts/new")
    await page.getByLabel("Product code").fill("RL#20_099")
    await page.getByLabel("Name", { exact: true }).fill("#20 Test Bracket")
    await page.getByRole("button", { name: "Add the part" }).click()

    // Next's own route announcer is also role=alert, so this names the message
    // rather than the role.
    await expect(page.getByText(/nothing was saved/)).toBeVisible()
    // And it stays on the form, with what was typed still in it.
    await expect(page).toHaveURL(/\/admin\/parts\/new/)
    await expect(page.getByLabel("Name", { exact: true })).toHaveValue("#20 Test Bracket")
  })

  test("a customer never reaches it", async ({ page }) => {
    await signIn(page, WHO.customer)
    await page.goto("/admin/parts/new")
    await expect(page).not.toHaveURL(/\/admin\/parts/)
  })
})

test.describe("altering a part", () => {
  test("the code cannot change, because everything points at it", async ({ page }) => {
    await signIn(page, WHO.staff)
    const response = await page.goto("/admin/parts/20-runners")
    expect(response?.status()).toBe(200)

    await expect(page.getByLabel("Product code")).toBeDisabled()
    await expect(page.getByLabel("Name", { exact: true })).toHaveValue(/#20/)
  })

  test("retiring is offered to the counter and removing is not", async ({ page }) => {
    // The split matters. Retiring is reversible and is counter work; removing
    // cannot be undone and is the owner's.
    await signIn(page, WHO.staff)
    await page.goto("/admin/parts/20-runners")
    await expect(page.getByRole("button", { name: "Retire it" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Remove" })).toHaveCount(0)

    await page.context().clearCookies()
    await signIn(page, WHO.admin)
    await page.goto("/admin/parts/20-runners")
    await expect(page.getByRole("button", { name: "Remove" })).toBeVisible()
  })

  test("removing asks first, because it cannot be undone", async ({ page }) => {
    await signIn(page, WHO.admin)
    await page.goto("/admin/parts/20-runners")
    await page.getByRole("button", { name: "Remove" }).click()
    await expect(page.getByRole("button", { name: "Yes, remove it" })).toBeVisible()
    await page.getByRole("button", { name: "Keep it" }).click()
    await expect(page.getByRole("button", { name: "Yes, remove it" })).toHaveCount(0)
  })
})
