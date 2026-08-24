import { defineConfig, devices } from "@playwright/test"

/**
 * End to end, against a real build.
 *
 * These exist because the interesting parts of this storefront cannot be checked
 * any other way. A session is an HttpOnly cookie, so no script can put one in
 * place; a basket is in localStorage, so the server never sees one; and the
 * three desks are told apart by a redirect that only happens in a browser. Unit
 * tests cannot reach any of that.
 *
 * Run against `next start` rather than `next dev`, so what is tested is what
 * would be deployed: dev builds pages on demand and forgives things production
 * does not.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : [["list"]],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3210",
    trace: "retain-on-failure",
  },

  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // The shop's customers are on phones. A flow that only works at 1440 is a
    // flow that does not work.
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],

  webServer: {
    // The seeded password is set here rather than read from `.env.local`, so the
    // suite behaves the same on a machine that has never had one.
    command: "ALLFIX_SEED_PASSWORD=allfix npm run start -- --port 3210",
    url: "http://127.0.0.1:3210",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
