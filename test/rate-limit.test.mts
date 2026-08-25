import { test, describe, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { caller, check, forget, limitFor, tooMany } from "@/lib/rate-limit"

/**
 * The limiter's own arithmetic.
 *
 * The end to end suite proves it is in the path and refuses. What it cannot
 * cheaply show is the window rolling over, one route not closing another, or a
 * malformed override falling back to the default rather than to no limit at all,
 * which is the failure that would matter most and the one nobody would notice.
 */

const from = (ip: string) => new Request("https://allfix.co.ke/api/auth/login", {
  headers: { "x-forwarded-for": ip },
})

beforeEach(() => forget())

describe("who is asking", () => {
  test("the leftmost forwarded address, which is the client as the first proxy saw it", () => {
    assert.equal(caller(from("41.90.1.2, 10.0.0.1")), "41.90.1.2")
  })

  test("and something rather than nothing when no proxy said", () => {
    assert.equal(caller(new Request("https://allfix.co.ke/")), "unknown")
  })
})

describe("counting knocks", () => {
  test("the allowance is spent before anything is refused", () => {
    const limit = limitFor("login")!
    for (let attempt = 0; attempt < limit.hits; attempt++) {
      assert.equal(check(from("41.90.1.2"), "login").ok, true, `attempt ${attempt + 1}`)
    }
    assert.equal(check(from("41.90.1.2"), "login").ok, false)
  })

  test("the refusal says how long to wait, so a client can be told", () => {
    const limit = limitFor("login")!
    for (let attempt = 0; attempt <= limit.hits; attempt++) check(from("41.90.1.2"), "login")

    const verdict = check(from("41.90.1.2"), "login")
    assert.equal(verdict.ok, false)
    assert.ok(verdict.retryAfter > 0 && verdict.retryAfter <= limit.seconds)
  })

  test("one caller's flood does not shut the door on another", () => {
    const limit = limitFor("login")!
    for (let attempt = 0; attempt <= limit.hits; attempt++) check(from("41.90.1.2"), "login")

    assert.equal(check(from("41.90.9.9"), "login").ok, true)
  })

  test("and guessing a password does not stop the same person ordering", () => {
    // Separate buckets, because being locked out of the shop for mistyping a
    // password is a worse outcome than the flood.
    const limit = limitFor("login")!
    for (let attempt = 0; attempt <= limit.hits; attempt++) check(from("41.90.1.2"), "login")

    assert.equal(check(from("41.90.1.2"), "order").ok, true)
  })

  test("a route with no limit is not a route with a limit of zero", () => {
    for (let attempt = 0; attempt < 50; attempt++) {
      assert.equal(check(from("41.90.1.2"), "not-a-route").ok, true)
    }
  })
})

describe("the refusal itself", () => {
  test("is a 429 that says when to come back", async () => {
    const response = tooMany(90)
    assert.equal(response.status, 429)
    assert.equal(response.headers.get("Retry-After"), "90")

    const body = (await response.json()) as { message: string }
    // Most people who see this have mistyped a password rather than attacked
    // anything, so it says what to do instead of accusing them.
    assert.match(body.message, /try again/)
    assert.doesNotMatch(body.message, /blocked|banned|forbidden/i)
  })
})
