import { test, describe, afterEach } from "node:test"
import assert from "node:assert/strict"
import { NoSessionSecret, configuredIdle, open, refresh, seal } from "@/lib/admin/session"
import { PEOPLE } from "@/lib/admin/desk"

/**
 * The signing key's own rules, which decide whether the console has a door.
 *
 * The end to end suite signs in against a server started with a good key, so the
 * cases it cannot reach are the ones worth writing down: a key too short to be
 * one, a key that arrived with a stray newline, and the production refusal that
 * has to stay a refusal. Getting any of these wrong is one character and the
 * failure looks exactly like success, which is the whole reason the key fails
 * closed rather than falling back.
 */

const owner = PEOPLE[0]

const KEY = "0123456789abcdef0123456789abcdef" // exactly the minimum
const SHORT = "0123456789abcdef0123456789abcde" // one short of it

/**
 * Next types `NODE_ENV` as read only, which is right for source and wrong for a
 * test whose whole subject is what changes with it. The cast is here, once,
 * rather than in each test.
 */
const bag = process.env as Record<string, string | undefined>

const set = (name: string, value: string | undefined) => {
  if (value === undefined) delete bag[name]
  else bag[name] = value
}

const env = { ...process.env }
afterEach(() => {
  set("NODE_ENV", env.NODE_ENV)
  set("ALLFIX_SESSION_SECRET", env.ALLFIX_SESSION_SECRET)
  set("ALLFIX_SESSION_IDLE_MINUTES", env.ALLFIX_SESSION_IDLE_MINUTES)
})

/** What is actually inside a token, for the assertions that are about the payload. */
const payloadOf = (token: string) =>
  JSON.parse(Buffer.from(token.split(".")[0]!, "base64url").toString()) as {
    email: string
    exp: number
    seen: number
    idle: number
  }

/**
 * A cookie in the shape this file used to write, signed with the current key.
 *
 * There is no way to ask `seal` for one any more, and that is the case worth
 * covering: every session live at the moment this deploys is one of these.
 */
async function sealLegacy(email: string, exp: number) {
  const body = Buffer.from(JSON.stringify({ email, exp })).toString("base64url")
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(process.env.ALLFIX_SESSION_SECRET!),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body))
  return `${body}.${Buffer.from(signature).toString("base64url")}`
}

const inProduction = (secret?: string) => {
  set("NODE_ENV", "production")
  set("ALLFIX_SESSION_SECRET", secret)
}

describe("what counts as a key", () => {
  test("the minimum length is accepted, and one character less is not", async () => {
    inProduction(KEY)
    assert.ok(await seal(owner))

    inProduction(SHORT)
    await assert.rejects(() => seal(owner), NoSessionSecret)
  })

  test("a short key is refused rather than padded or accepted quietly", async () => {
    inProduction(SHORT)
    const error = await seal(owner).then(
      () => null,
      (thrown: Error) => thrown,
    )
    assert.ok(error instanceof NoSessionSecret)
    // The operator is told which of the two it is, because "not set" would be
    // a wrong answer they would spend the afternoon on.
    assert.match(error.message, new RegExp(`${SHORT.length} characters`))
  })

  test("surrounding whitespace is not part of the key", async () => {
    inProduction(KEY)
    const signed = await seal(owner)

    inProduction(`  ${KEY}\n`)
    const desk = await open(signed)
    assert.equal(desk?.email, owner.email)
  })

  test("whitespace alone is not a key", async () => {
    inProduction("   \n  ")
    await assert.rejects(() => seal(owner), NoSessionSecret)
  })
})

describe("what happens when nobody set one", () => {
  test("production refuses to sign at all", async () => {
    inProduction(undefined)
    await assert.rejects(() => seal(owner), NoSessionSecret)
  })

  test("production refuses to open one too, rather than throwing at the gate", async () => {
    inProduction(KEY)
    const signed = await seal(owner)

    inProduction(undefined)
    assert.equal(await open(signed), null)
  })

  test("outside production a stand-in keeps a bare clone usable", async () => {
    set("NODE_ENV", "development")
    set("ALLFIX_SESSION_SECRET", undefined)
    const signed = await seal(owner)
    assert.equal((await open(signed))?.email, owner.email)
  })
})

describe("a signature is a signature", () => {
  test("a session signed with one key does not open with another", async () => {
    inProduction(KEY)
    const signed = await seal(owner)

    inProduction("ffffffffffffffffffffffffffffffff")
    assert.equal(await open(signed), null)
  })

  test("an edited payload does not survive", async () => {
    inProduction(KEY)
    const signed = await seal(owner)
    const [body, signature] = signed.split(".")

    const forged = Buffer.from(
      JSON.stringify({ email: "p.ochieng@gmail.com", exp: Date.now() + 60_000 }),
    )
      .toString("base64url")
    assert.equal(await open(`${forged}.${signature}`), null)
    assert.ok(body)
  })
})

/**
 * The inactivity window.
 *
 * Four of these are here because getting them wrong is one character and the
 * failure looks like success from the outside. The `exp` case is the sharpest:
 * a re-seal that recomputed the fourteen day cap instead of carrying it across
 * would give a session that is used once a day an unlimited life, and nothing
 * about the console would look any different while it happened.
 */

const MINUTE = 60_000

describe("how long doing nothing lasts", () => {
  test("a session used inside the window opens, and outside it does not", async (context) => {
    context.mock.timers.enable({ apis: ["Date"] })
    inProduction(KEY)
    set("ALLFIX_SESSION_IDLE_MINUTES", "20")

    const signed = await seal(owner)
    assert.equal((await open(signed))?.email, owner.email)

    context.mock.timers.setTime(Date.now() + 19 * MINUTE)
    assert.equal((await open(signed))?.email, owner.email, "nineteen minutes is inside twenty")

    context.mock.timers.setTime(Date.now() + 2 * MINUTE)
    assert.equal(await open(signed), null, "twenty one minutes is not")
  })

  test("a touch moves the last use and leaves the fourteen days alone", async (context) => {
    context.mock.timers.enable({ apis: ["Date"] })
    inProduction(KEY)
    set("ALLFIX_SESSION_IDLE_MINUTES", "20")

    const signed = await seal(owner)
    const first = payloadOf(signed)

    context.mock.timers.setTime(Date.now() + 10 * MINUTE)
    const touched = await refresh(signed)
    assert.ok(touched)
    const second = payloadOf(touched)

    assert.ok(second.seen > first.seen, "the last use moved")
    // The whole point. Recomputing this is how a session becomes immortal.
    assert.equal(second.exp, first.exp, "the fourteen day cap did not move")
  })

  test("a session goes on lapsing however often it is touched", async (context) => {
    context.mock.timers.enable({ apis: ["Date"] })
    inProduction(KEY)
    set("ALLFIX_SESSION_IDLE_MINUTES", "20")

    let token: string | null = await seal(owner)
    const { exp } = payloadOf(token)

    // A fortnight of somebody coming back every ten minutes.
    for (let step = 0; step < 14 * 24 * 6 + 1 && token; step++) {
      context.mock.timers.setTime(Date.now() + 10 * MINUTE)
      token = await refresh(token)
    }

    assert.equal(token, null, "the cap ended it even though it was never idle")
    assert.ok(exp < Date.now())
  })

  test("a touch will not revive a session that has already lapsed", async (context) => {
    context.mock.timers.enable({ apis: ["Date"] })
    inProduction(KEY)
    set("ALLFIX_SESSION_IDLE_MINUTES", "20")

    const signed = await seal(owner)
    context.mock.timers.setTime(Date.now() + 21 * MINUTE)
    assert.equal(await refresh(signed), null)
  })

  test("a longer window written into the payload by hand does not survive", async () => {
    inProduction(KEY)
    set("ALLFIX_SESSION_IDLE_MINUTES", "20")

    const signed = await seal(owner)
    const [, signature] = signed.split(".")
    const forged = Buffer.from(
      JSON.stringify({
        email: owner.email,
        exp: Date.now() + 60_000,
        seen: Date.now() - 60 * MINUTE,
        idle: 999 * 60 * MINUTE,
      }),
    ).toString("base64url")

    assert.equal(await open(`${forged}.${signature}`), null)
  })

  test("a session sealed before there was a window is let in, not thrown out", async () => {
    inProduction(KEY)
    // What `seal` used to write: an address and an expiry, and nothing else.
    const legacy = await sealLegacy(owner.email, Date.now() + 7 * 24 * 60 * MINUTE)
    assert.equal((await open(legacy))?.email, owner.email)
  })
})

describe("what counts as a window", () => {
  test("the environment sets it, in minutes", () => {
    set("ALLFIX_SESSION_IDLE_MINUTES", "45")
    assert.equal(configuredIdle(), 45 * MINUTE)
  })

  test("nonsense falls back to the default rather than to no timeout", () => {
    for (const rubbish of ["", "   ", "abc", "0", "-5", "20.5", "99999"]) {
      set("ALLFIX_SESSION_IDLE_MINUTES", rubbish)
      assert.equal(configuredIdle(), 20 * MINUTE, `"${rubbish}" should not have been obeyed`)
    }
  })

  test("an unset variable is the default", () => {
    set("ALLFIX_SESSION_IDLE_MINUTES", undefined)
    assert.equal(configuredIdle(), 20 * MINUTE)
  })
})
