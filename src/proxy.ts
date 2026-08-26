import { NextResponse } from "next/server"
import type { NextRequest, ProxyConfig } from "next/server"
import { COOKIE, HINT, cookieOptions, hintOptions, open } from "@/lib/admin/session"
import { capabilities, landing } from "@/lib/admin/roles"

/**
 * The gate, in front of everything a signed out visitor should not receive.
 *
 * Named `proxy` rather than `middleware`: Next 16 renamed the convention, and
 * having both files present is a hard build error, so do not add a
 * `middleware.ts` from muscle memory. Proxy always runs on the Node runtime
 * here, and a route segment config in this file is refused.
 *
 * This is not the only check. The Next documentation is explicit that Server
 * Functions are not separate routes in the matcher chain, so authorization is
 * verified again inside the layouts and pages themselves, in
 * `src/lib/admin/guard.ts`. What the proxy adds is that the console never
 * renders at all: before this existed, `/admin` was statically prerendered and
 * shipped to anybody who asked, and a client component hid it after the fact.
 *
 * **It reads the session and never rewrites it**, and that is deliberate rather
 * than an omission somebody should tidy up later. Sliding the inactivity window
 * from here looks obvious and is wrong three times over:
 *
 * - A prefetch cannot be told apart from a visit. Next deletes every Flight
 *   header before this function sees the request (`FLIGHT_HEADERS` in
 *   `next/dist/client/components/app-router-headers.js`, removed in
 *   `next/dist/server/web/adapter.js`, and stated in the proxy documentation),
 *   so `next-router-prefetch` is not readable here. Every rail link the router
 *   prefetches would keep the session of somebody who has gone home alive, and
 *   prefetching only happens in production, so it would never fail in dev.
 * - `NextResponse.cookies.set` here sets `x-middleware-set-cookie`, which Next
 *   merges into the request the render then reads. The layout's `readDesk()`
 *   would see the cookie this file just wrote rather than the one that arrived,
 *   which turns the guard into an echo of the proxy exactly where the guard is
 *   supposed to be the authority.
 * - The browser is counting down to a deadline of its own, and a server that
 *   quietly moves it produces a warning panel for somebody who was never at
 *   risk.
 *
 * So the window slides in one place only, `POST /api/session/touch`, which is
 * asked for by something that can tell a person from a prefetch.
 */
export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const desk = await open(request.cookies.get(COOKIE)?.value)

  if (!desk) {
    const url = request.nextUrl.clone()
    url.pathname = "/sign-in"
    url.search = ""
    // The query goes with it, so `/admin/parts?show=unpriced` returns to the
    // same filtered worksheet rather than the top of the console.
    url.searchParams.set("next", pathname + search)

    const away = NextResponse.redirect(url)
    /*
     * Take the cookies away on the way out, both of them.
     *
     * Nothing used to clear these, and it did not show: a session was only ever
     * refused once it had expired, and the browser was dropping both cookies at
     * that same moment anyway. An inactivity window breaks that coincidence. A
     * session is now *refused* twenty minutes in and the cookies live for a
     * fortnight, so without this the browser keeps sending a session that will
     * never be accepted again, and the pre-paint script in the root layout keeps
     * reading `allfix_desk` and telling the storefront header that somebody is
     * signed in. The same attributes as the cookie being replaced, for the
     * reason `api/auth/logout` gives: cleared with different ones, it is simply
     * a second cookie and the first keeps arriving.
     */
    away.cookies.set(COOKIE, "", cookieOptions(0))
    away.cookies.set(HINT, "", hintOptions(0))
    return away
  }

  const allowed = capabilities(desk.role)

  // Signed in, but not for this door. Sending a trade account to the sign in
  // page would be a lie: they are signed in, just not here.
  if (pathname.startsWith("/admin") && !allowed.console) {
    return NextResponse.redirect(new URL(landing(desk.role), request.url))
  }

  if (pathname.startsWith("/trade/account") && desk.role !== "TRADE") {
    return NextResponse.redirect(new URL(landing(desk.role), request.url))
  }

  // The shopper's own area, and only the shopper's. Staff and trade both have a
  // desk of their own, and landing them here instead would be a third place to
  // keep in step with the other two.
  if (pathname.startsWith("/account") && desk.role !== "CUSTOMER") {
    return NextResponse.redirect(new URL(landing(desk.role), request.url))
  }

  return NextResponse.next()
}

/**
 * The bare paths are listed alongside the wildcards rather than relying on
 * `:path*` matching zero segments, because a gate that silently stops covering
 * its own front page is not worth the saved line.
 */
export const config: ProxyConfig = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/trade/account",
    "/trade/account/:path*",
    "/account",
    "/account/:path*",
  ],
}
