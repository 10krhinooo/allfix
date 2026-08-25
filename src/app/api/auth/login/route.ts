import { NextResponse } from "next/server"
import { check, tooMany } from "@/lib/rate-limit"
import { signInWith } from "@/lib/admin/accounts"
import { COOKIE, HINT, NoSessionSecret, cookieOptions, hintOptions, seal } from "@/lib/admin/session"
import { landing } from "@/lib/admin/roles"

/**
 * The door, as an endpoint.
 *
 * A route handler rather than a server action, because it mirrors the backend's
 * `POST /api/auth/login` exactly: the same body, the same refusals, the same
 * cookie. In a demonstration the network tab then shows the real contract rather
 * than a framework-shaped stand-in for it.
 *
 * The session value only ever leaves here as an HttpOnly cookie and is never in
 * the response body, which is the backend's own rule: authentication secrets do
 * not reach the frontend, so a scripting bug on the storefront cannot become an
 * account takeover.
 *
 * When `allfix-backend` is hosted, this handler keeps its shape and calls it
 * instead. Note the wrinkle that makes this file permanent rather than
 * temporary: the backend sets its cookie on its own origin, which the browser
 * will not send cross site under SameSite=Lax, and `src/proxy.ts` cannot read.
 * So this stays the frontend's own door and re-issues a first party cookie from
 * the account the backend returns. Do not delete it as redundant.
 */
export async function POST(request: Request) {
  // Before anything else, including reading the body: a flood is cheapest to
  // refuse before it costs anything.
  const knock = check(request, "login")
  if (!knock.ok) return tooMany(knock.retryAfter)

  let body: { email?: unknown; password?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Expected a JSON body." }, { status: 400 })
  }

  const email = typeof body.email === "string" ? body.email : ""
  const password = typeof body.password === "string" ? body.password : ""

  const result = signInWith(email, password)
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status })
  }

  let sealed: string
  try {
    sealed = await seal(result.person)
  } catch (error) {
    // Only the missing key is answered here. Anything else out of `seal()` is a
    // WebCrypto failure with nothing to do with configuration, and reporting it
    // as an unset key would send whoever is debugging it to the wrong place.
    if (!(error instanceof NoSessionSecret)) throw error

    // A deployment with no signing secret. The door stays shut rather than
    // handing out a cookie anybody could have written themselves, and the
    // message is for whoever deployed it rather than for the person signing in.
    return NextResponse.json(
      {
        message:
          "Sign in is not available on this deployment. The session signing key is not set, " +
          "and we will not issue a session we cannot trust.",
      },
      { status: 503 },
    )
  }

  const response = NextResponse.json({
    email: result.person.email,
    name: result.person.name,
    role: result.person.role,
    to: landing(result.person.role),
  })
  response.cookies.set(COOKIE, sealed, cookieOptions())
  response.cookies.set(HINT, "1", hintOptions())
  return response
}
