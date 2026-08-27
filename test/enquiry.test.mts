import { test, describe, beforeEach } from "node:test"
import assert from "node:assert/strict"

/**
 * The one request the browser makes to the service directly.
 *
 * Every other seam is server to server, so this is the only place where the
 * shop's own vocabulary is posted at somebody else's, and it went out wrong.
 * The draft was spread into the body, which put `survey` on the wire against an
 * enum spelled `SURVEY`, and the service refused all of it: every booking,
 * every service enquiry and every trade quote, behind "Something went wrong at
 * our end". Nothing caught it because nothing here had ever been run against a
 * real service, and a browser test cannot see a request body.
 *
 * So these assertions are about the body and not about the page. The list of
 * fields is the service's `EnquiryRequests.Send`, and the kinds are its
 * `EnquiryKind`; if either moves, this is where it should fail.
 */

process.env.NEXT_PUBLIC_API_URL = "http://service.test"

const { sendEnquiry } = await import("@/lib/enquiry")

/** `EnquiryRequests.Send`, field for field. */
const FIELDS = ["kind", "name", "phone", "email", "area", "summary", "detail", "system"]

/** `EnquiryKind`, value for value. */
const KINDS = ["QUOTE", "SURVEY", "TRADE", "PARTS"]

const DRAFT = {
  kind: "survey" as const,
  name: "Wanjiru Kamau",
  phone: "0722 000 111",
  email: "wanjiru@example.com",
  area: "Westlands",
  summary: "Two windows measured up",
  detail: "A sitting room bay and one bedroom.",
}

let sent: Record<string, unknown> | null = null

beforeEach(() => {
  sent = null
  globalThis.fetch = (async (_url: unknown, init: { body?: string } = {}) => {
    sent = JSON.parse(init.body ?? "{}")
    return new Response(JSON.stringify({ reference: "AF-1043" }), {
      status: 201,
      headers: { "content-type": "application/json" },
    })
  }) as unknown as typeof fetch
})

describe("what an enquiry puts on the wire", () => {
  test("the kind is spelled the way the service reads it, not the way the shop says it", async () => {
    const answer = await sendEnquiry(DRAFT)

    assert.deepEqual(answer, { ok: true, reference: "AF-1043" })
    assert.equal(sent?.kind, "SURVEY")
  })

  test("every kind the shop has is one the service's enum holds", async () => {
    for (const kind of ["quote", "survey", "trade", "parts"] as const) {
      await sendEnquiry({ ...DRAFT, kind })
      assert.ok(
        KINDS.includes(sent?.kind as string),
        `${kind} went out as ${sent?.kind}, which the service does not have`,
      )
    }
  })

  test("the body carries the fields the service validates, and nothing it does not", async () => {
    await sendEnquiry(DRAFT)

    assert.deepEqual(Object.keys(sent ?? {}).sort(), [...FIELDS].sort())
  })

  test("an address left blank is sent as nothing rather than as an empty string", async () => {
    // The service reads this with @Email, which refuses "" and accepts absent.
    // The email is optional on this form and always has been.
    await sendEnquiry({ ...DRAFT, email: "   " })

    assert.equal(sent?.email, null)
  })

  test("an address is trimmed, so a copied one still reaches somebody", async () => {
    await sendEnquiry({ ...DRAFT, email: "  wanjiru@example.com  " })

    assert.equal(sent?.email, "wanjiru@example.com")
  })

  test("a rail nobody named is sent as nothing rather than left out", async () => {
    await sendEnquiry(DRAFT)

    assert.ok("system" in (sent ?? {}))
    assert.equal(sent?.system, null)
  })

  test("the service's own refusal is what the customer is told", async () => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ message: "We could not read that phone number." }), {
        status: 400,
        headers: { "content-type": "application/json" },
      })) as unknown as typeof fetch

    const answer = await sendEnquiry(DRAFT)

    assert.deepEqual(answer, {
      ok: false,
      message: "We could not read that phone number.",
    })
  })

  test("a dropped connection is answered rather than thrown at whoever is typing", async () => {
    globalThis.fetch = (async () => {
      throw new Error("network")
    }) as unknown as typeof fetch

    const answer = await sendEnquiry(DRAFT)

    assert.equal(answer.ok, false)
    assert.match(answer.ok === false ? answer.message : "", /WhatsApp/)
  })
})
