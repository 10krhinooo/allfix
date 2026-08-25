import { randomUUID } from "node:crypto"
import { defineConfig, devices } from "@playwright/test"
import { PASSWORD } from "./e2e/helpers"

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
    //
    // The rate limits are raised for the routes this suite uses in bulk: it
    // signs in dozens of times a minute on purpose, which is exactly what the
    // shipped limit is meant to stop, and a suite that spent its time being
    // refused would be testing the limiter rather than the shop. `reset` keeps
    // its real limit, and `security.spec.ts` asserts the refusal against it, so
    // the limiter is still exercised end to end rather than switched off.
    //
    // The signing key is set here for the same reason as the password: a fresh
    // clone has no `.env.local`, and without a key the door now refuses to issue
    // a session at all rather than signing one with a value that is printed in
    // this repository.
    command: "npm run start -- --port 3210",
    env: {
      // The one the specs sign in with, imported rather than repeated so the
      // suite and the server cannot drift apart, and so this file carries no
      // credential of its own.
      ALLFIX_SEED_PASSWORD: PASSWORD,
      // Generated per run. A signing key written into a repository is a signing
      // key anybody can read, and the suite has no reason to use the same one
      // twice.
      ALLFIX_SESSION_SECRET: randomUUID(),
      ALLFIX_LIMIT_LOGIN: "1000/60",
      ALLFIX_LIMIT_REGISTER: "1000/60",
      ALLFIX_LIMIT_FORGOT: "1000/60",
      ALLFIX_LIMIT_ORDER: "1000/60",
    },
    url: "http://127.0.0.1:3210",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
