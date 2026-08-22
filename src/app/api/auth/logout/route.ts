import { NextResponse } from "next/server"
import { COOKIE, HINT, cookieOptions, hintOptions } from "@/lib/admin/session"

/**
 * Clearing the cookie, mirroring `POST /api/auth/logout`.
 *
 * The same attributes as the cookie being replaced, with a zero lifetime.
 * Clearing with a different path or SameSite simply sets a second cookie and the
 * browser goes on sending the first, which is a quiet and confusing way to stay
 * signed in.
 *
 * No CSRF token: the cookie is SameSite=Lax, so a cross site POST arrives
 * without it and a forged sign out is a request to sign out somebody who was
 * never signed in.
 */
export async function POST() {
  const response = new NextResponse(null, { status: 204 })
  response.cookies.set(COOKIE, "", cookieOptions(0))
  response.cookies.set(HINT, "", hintOptions(0))
  return response
}
