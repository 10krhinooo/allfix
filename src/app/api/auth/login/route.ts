import { NextResponse } from "next/server"
import { signInWith } from "@/lib/admin/accounts"
import { COOKIE, cookieOptions, seal } from "@/lib/admin/session"
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

  const response = NextResponse.json({
    email: result.person.email,
    name: result.person.name,
    role: result.person.role,
    to: landing(result.person.role),
  })
  response.cookies.set(COOKIE, await seal(result.person), cookieOptions())
  return response
}
