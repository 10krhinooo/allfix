import type { DeskEnquiry } from "@/lib/admin/rows"
import type { EnquiryKind } from "@/lib/enquiry"

/**
 * The enquiry queue, read from the service the shop actually files them in.
 *
 * The seam was one way. `sendEnquiry` has always been able to POST an enquiry,
 * and the console has only ever read `store.ts`, which is the browser's own
 * `localStorage`. That was coherent while there was no service: a filed enquiry
 * and the screen that shows it were both in the same browser, so the loop looked
 * closed to whoever was testing it. Point the storefront at a real service and
 * it comes apart in the worst way, because the enquiry now reaches the shop and
 * the counter still cannot see it. A lead that arrives somewhere nobody looks is
 * worse than one that is refused.
 *
 * Server only, like `settings-service.ts` and for the same reason: the queue is
 * `@RolesAllowed({"STAFF","ADMIN"})` and this server holds no account, so it
 * carries the service token instead. Never `NEXT_PUBLIC_`, never from a browser.
 */

const API = process.env.ALLFIX_API_URL ?? ""
const SERVICE_TOKEN = process.env.ALLFIX_SERVICE_TOKEN ?? ""

/** What the service returns. Its own vocabulary, uppercase, as the wire has it. */
interface ServiceEnquiry {
  id: string
  reference: string
  kind: string
  status: string
  name: string
  phone: string
  email: string | null
  area: string | null
  summary: string
  detail: string
  system: string | null
  createdAt: string
}

/**
 * The queue, or `null` when there is no service to ask.
 *
 * `null` and an empty array are deliberately different answers. Empty means the
 * shop has no enquiries; null means nobody asked, and the console falls back to
 * what the browser holds. Reporting an empty queue for an unreachable service
 * would tell the counter there is nothing to do, which is the one wrong thing to
 * say to somebody whose job is the queue.
 */
export async function readEnquiries(): Promise<DeskEnquiry[] | null> {
  if (!API) return null

  try {
    const response = await fetch(`${API}/api/enquiries`, {
      headers: SERVICE_TOKEN ? { "X-Allfix-Service": SERVICE_TOKEN } : {},
      // The counter refreshes to see what has come in, so a cached queue is a
      // queue that is wrong exactly when it matters.
      cache: "no-store",
    })
    if (!response.ok) return null

    const body: unknown = await response.json()
    if (!Array.isArray(body)) return null
    return body.map(fromService)
  } catch {
    // A service that is down must not take the console down with it. The screen
    // says where its rows came from, so a fallback is visible rather than silent.
    return null
  }
}

function fromService(entry: ServiceEnquiry): DeskEnquiry {
  return {
    id: entry.id,
    kind: entry.kind.toLowerCase() as EnquiryKind,
    name: entry.name,
    phone: entry.phone,
    email: entry.email?.trim() || null,
    area: entry.area?.trim() || "Not given",
    // The screens show a clock time for anything with an `at`, and how long ago
    // only for the seeded rows that have no real timestamp.
    hoursAgo: 0,
    at: Date.parse(entry.createdAt),
    summary: entry.summary,
    detail: entry.detail,
    system: entry.system,
    reference: entry.reference,
  }
}
