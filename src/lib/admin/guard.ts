import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { COOKIE, open, type Desk } from "@/lib/admin/session"
import { capabilities } from "@/lib/admin/roles"

/**
 * Who is at the counter on this request, verified on the server.
 *
 * `src/proxy.ts` already turns a signed out visitor away before a route renders,
 * but the proxy is for the redirect experience and cannot be the only check. The
 * Next 16 proxy documentation is explicit that Server Functions are not separate
 * routes in the matcher chain, so a matcher typo or a refactor can silently drop
 * coverage. This is the authoritative check, and it lives next to the thing it
 * protects.
 *
 * Server only, and enforced by `next/headers` itself: importing this from a
 * client component is a build error rather than a subtle leak.
 */

export async function readDesk(): Promise<Desk | null> {
  const jar = await cookies()
  return open(jar.get(COOKIE)?.value)
}

/** The console's own door. Redirects rather than returning null, so a page cannot forget. */
export async function requireConsole(): Promise<Desk> {
  const desk = await readDesk()
  if (!desk || !capabilities(desk.role).console) redirect("/sign-in?next=%2Fadmin")
  return desk
}
