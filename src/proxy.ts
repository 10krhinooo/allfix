import { NextResponse } from "next/server"
import type { NextRequest, ProxyConfig } from "next/server"
import { COOKIE, open } from "@/lib/admin/session"
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
    return NextResponse.redirect(url)
  }

  const allowed = capabilities(desk.role)

  // Signed in, but not for this door. Sending a trade account to the sign in
  // page would be a lie: they are signed in, just not here.
  if (pathname.startsWith("/admin") && !allowed.console) {
    return NextResponse.redirect(new URL(landing(desk.role), request.url))
  }

  if (pathname.startsWith("/trade/account") && allowed.console) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  return NextResponse.next()
}

/**
 * The bare paths are listed alongside the wildcards rather than relying on
 * `:path*` matching zero segments, because a gate that silently stops covering
 * its own front page is not worth the saved line.
 */
export const config: ProxyConfig = {
  matcher: ["/admin", "/admin/:path*", "/trade/account", "/trade/account/:path*"],
}
