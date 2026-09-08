import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Enquiries } from "@/components/admin/Enquiries"
import { readDesk } from "@/lib/admin/guard"
import { capabilities } from "@/lib/admin/roles"
import { readEnquiries } from "@/lib/admin/enquiries-service"

export const metadata: Metadata = { title: "Enquiries" }

/**
 * The queue is read here, on the server, because reading it needs a credential.
 *
 * `GET /api/enquiries` is staff and admin only, and this server holds no
 * account, so it asks as itself with the service token. That cannot happen in
 * the browser: the token would be in the bundle, and a token in a bundle has
 * stopped being one.
 *
 * Dynamic, because a counter refreshes this screen to see what has come in and
 * a cached queue is wrong exactly when somebody is looking.
 */
export const dynamic = "force-dynamic"

export default async function EnquiriesPage() {
  const desk = await readDesk()
  /*
   * Checked here as well as in the proxy, which gates on `console` alone. Every
   * enquiry carries a customer's name and the number they asked to be rung back
   * on, so this is the screen on the rail with the most personal data on it and
   * it was the one deciding access by "is this the console" rather than by who
   * is standing at it.
   */
  if (!desk || !capabilities(desk.role).enquiries) notFound()

  return <Enquiries queue={await readEnquiries()} />
}
