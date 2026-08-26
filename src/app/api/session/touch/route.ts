import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { COOKIE, HINT, cookieOptions, hintOptions, open, refresh } from "@/lib/admin/session"
import { check, tooMany } from "@/lib/rate-limit"

/**
 * Still here.
 *
 * The one thing in the shop that slides the inactivity window, and therefore
 * the one thing that has to be able to tell a person from a prefetch. It can,
 * because it is only ever asked for by `IdleWatch`, which asks because somebody
 * moved a pointer or pressed a key. `src/proxy.ts` deliberately does not do
 * this, and the reasons are written out there.
 *
 * This route is not in the proxy's matcher (`/api` is absent from it), so the
 * refusal is its own: it opens the cookie itself, and clears both cookies when
 * the answer is no. That matters more here than anywhere else. A browser
 * touching a session that has already lapsed is a browser showing somebody a
 * console it believes in, and the fastest way to correct it is a 401 it is
 * already listening for.
 *
 * No CSRF token, for the reason `api/auth/logout` gives: the cookie is
 * SameSite=Lax, so a cross site POST arrives without it, and touching a session
 * nobody is holding does nothing.
 */
export async function POST(request: NextRequest) {
  const knock = check(request, "touch")
  if (!knock.ok) return tooMany(knock.retryAfter)

  const sealed = await refresh(request.cookies.get(COOKIE)?.value)
  if (!sealed) {
    const gone = NextResponse.json({ signedIn: false }, { status: 401 })
    gone.cookies.set(COOKIE, "", cookieOptions(0))
    gone.cookies.set(HINT, "", hintOptions(0))
    return gone
  }

  /*
   * Re-opened rather than trusted, so the answer is the same one every other
   * caller would get. `refresh()` proves the token was valid; only `open()`
   * knows whether the person behind it is still allowed in, which is how
   * suspending an account takes effect on the next request rather than at
   * expiry.
   */
  const desk = await open(sealed)
  if (!desk) {
    const gone = NextResponse.json({ signedIn: false }, { status: 401 })
    gone.cookies.set(COOKIE, "", cookieOptions(0))
    gone.cookies.set(HINT, "", hintOptions(0))
    return gone
  }

  /*
   * Milliseconds remaining, never a deadline. The browser's clock is not ours,
   * and one that is ten minutes fast would read an absolute timestamp as
   * already past and sign itself out on arrival.
   */
  const answer = NextResponse.json(
    { signedIn: true, idleInMs: desk.idleInMs, idleWindowMs: desk.idleWindowMs },
    { headers: { "Cache-Control": "no-store" } },
  )
  answer.cookies.set(COOKIE, sealed, cookieOptions())
  answer.cookies.set(HINT, "1", hintOptions())
  return answer
}
