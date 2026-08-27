import type { Metadata } from "next"
import { Enquiries } from "@/components/admin/Enquiries"
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
  return <Enquiries queue={await readEnquiries()} />
}
