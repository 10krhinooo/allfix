import { test, describe, afterEach } from "node:test"
import assert from "node:assert/strict"
import { NoSessionSecret, open, seal } from "@/lib/admin/session"
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
})

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
