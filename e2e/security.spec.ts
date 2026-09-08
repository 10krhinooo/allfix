import { test, expect } from "@playwright/test"

/**
 * The things an attacker meets before they meet a page.
 *
 * A shop that takes money is worth attacking and none of this existed: no
 * headers at all, and a sign in endpoint that would answer a password guess as
 * fast as a script could ask. These are the assertions that catch the headers
 * being dropped in a config edit, which is how they usually go.
 */

test.describe("the headers every page carries", () => {
  test("the page cannot be framed, and script cannot come from anywhere else", async ({
    request,
  }) => {
    const response = await request.get("/")
    const csp = response.headers()["content-security-policy"] ?? ""

    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("form-action 'self'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("base-uri 'self'")
    expect(response.headers()["x-frame-options"]).toBe("DENY")
    expect(response.headers()["x-content-type-options"]).toBe("nosniff")
    expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin")
  })

  test("a worker may only be built from this origin", async ({ request }) => {
    // Its own test because it guards a decision rather than a header. A worker
    // built from a `blob:` URL is how several WebGL loaders ship their decoders,
    // and `default-src 'self'` already refuses one, silently. Naming the
    // directive means the refusal is visible, and adding `blob:` to it has to
    // pass this test, which is the point: it should be a conversation rather
    // than a line in a dependency's setup guide.
    const response = await request.get("/")
    const csp = response.headers()["content-security-policy"] ?? ""

    expect(csp).toContain("worker-src 'self'")

    // `blob:` belongs to the image optimiser and nowhere else. Read per
    // directive rather than over the whole string, so this cannot be satisfied
    // by the token appearing somewhere it does not belong.
    for (const directive of csp.split(";").map((part) => part.trim())) {
      if (directive.startsWith("img-src")) continue
      expect(directive, `${directive} should not allow blob:`).not.toContain("blob:")
    }
  })

  test("the framework version is not advertised", async ({ request }) => {
    const response = await request.get("/")
    expect(response.headers()["x-powered-by"]).toBeUndefined()
  })

  test("the console carries them too", async ({ request }) => {
    // The redirect to the door is what a signed out request gets, and it is a
    // response like any other.
    const response = await request.get("/admin", { maxRedirects: 0 })
    expect(response.headers()["content-security-policy"]).toContain("frame-ancestors 'none'")
  })
})

test.describe("knocking too often", () => {
  test("the reset endpoint stops answering and says how long for", async ({ request }) => {
    // Five in ten minutes is more than anybody needs and far less than a script
    // wants. The suite's other routes are raised in the config, so this is the
    // one that proves the limiter is really in the path.
    let refused: { status: number; retryAfter: string | undefined } | null = null

    for (let attempt = 0; attempt < 8; attempt++) {
      const response = await request.post("/api/auth/reset", {
        data: { token: "not-a-real-token", password: "Tumbili-Rafiki-88" },
        failOnStatusCode: false,
      })
      if (response.status() === 429) {
        refused = { status: 429, retryAfter: response.headers()["retry-after"] }
        break
      }
    }

    expect(refused, "the limiter refuses before the eighth try").not.toBeNull()
    expect(Number(refused!.retryAfter)).toBeGreaterThan(0)
  })

  test("the refusal is worded for somebody who is simply quick", async ({ request }) => {
    let message = ""
    for (let attempt = 0; attempt < 8; attempt++) {
      const response = await request.post("/api/auth/reset", {
        data: { token: "not-a-real-token", password: "Tumbili-Rafiki-88" },
        failOnStatusCode: false,
      })
      if (response.status() === 429) {
        message = (await response.json()).message
        break
      }
    }

    // Most people who see this have mistyped a password, not attacked anything.
    expect(message).toContain("try again")
    expect(message).not.toMatch(/blocked|banned|forbidden/i)
  })
})
