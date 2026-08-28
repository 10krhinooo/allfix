import type { PriceBasis } from "@/lib/catalogue"

/**
 * What is on the shelf, read from the shop's own records.
 *
 * Deliberately not part of the parts worksheet, which builds its rows from the
 * committed catalogue and keeps its edits in `localStorage`. That arrangement is
 * right for pricing: a price is a decision somebody makes once, and the
 * catalogue is the same file for everybody. A count is the opposite kind of
 * fact. It changes between two people looking at it, it belongs to the service
 * rather than to a build, and read from a JSON file it is null for all 188
 * products, which is not an answer to anything.
 *
 * Server only, like the other console seams. Never `NEXT_PUBLIC_`.
 */

const API = process.env.ALLFIX_API_URL ?? ""
const SERVICE_TOKEN = process.env.ALLFIX_SERVICE_TOKEN ?? ""

export interface StockRow {
  sku: string | null
  slug: string
  name: string
  /** The rail system or rod finish, already resolved to something readable. */
  group: string | null
  component: string
  basis: PriceBasis
  /** What is on the shelf. Never null on this screen: uncounted parts are elsewhere. */
  stock: number
  /** This part's own threshold, or null where the shop's default applies. */
  lowStockAt: number | null
  /** Whether it is at or below whichever threshold applies. Decided by the service. */
  low: boolean
}

interface ServiceRow {
  sku: string | null
  slug: string
  name: string
  system: string | null
  range: string | null
  component: string
  componentLabel: string
  priceBasis: string
  stock: number | null
  lowStockAt: number | null
  low: boolean
}

/**
 * The shelf, or `null` when there is nothing to ask.
 *
 * The same distinction `readOrders` and `readEnquiries` hold, and it matters
 * more here than anywhere: an empty list means the shop has counted nothing yet,
 * and `null` means nobody could ask. Reporting an empty shelf for an unreachable
 * service would tell the counter that everything is fine, which is the one wrong
 * thing to say to somebody whose job is to notice that it is not.
 */
export async function readStock(low = false): Promise<StockRow[] | null> {
  if (!API) return null

  try {
    // "true" rather than "1": the service reads this into a Java boolean, and
    // Boolean.parseBoolean accepts only the word. "1" arrives as false, which
    // quietly returned every counted part and made the rail badge disagree with
    // the screen it links to.
    const response = await fetch(`${API}/api/admin/stock${low ? "?low=true" : ""}`, {
      headers: SERVICE_TOKEN ? { "X-Allfix-Service": SERVICE_TOKEN } : {},
      // Somebody refreshes this while standing at the shelf. A cached count is
      // wrong exactly when it is being read.
      cache: "no-store",
    })
    if (!response.ok) return null

    const body: unknown = await response.json()
    if (!Array.isArray(body)) return null
    return body.filter(counted).map(fromService)
  } catch {
    return null
  }
}

/** A row with no count is not an answer to "what is on the shelf". */
function counted(entry: ServiceRow) {
  return entry.stock !== null
}

function fromService(entry: ServiceRow): StockRow {
  return {
    sku: entry.sku,
    slug: entry.slug,
    name: entry.name,
    group: entry.system ?? entry.range ?? null,
    component: entry.componentLabel || entry.component,
    basis: (entry.priceBasis?.toLowerCase() ?? "each") as PriceBasis,
    stock: entry.stock as number,
    lowStockAt: entry.lowStockAt,
    low: entry.low,
  }
}

export type Counted =
  | { ok: true; stock: number | null; low: boolean }
  | { ok: false; message: string }

/**
 * A stock take: what somebody counted the shelf to.
 *
 * `counted` of null says this part is not counted, which is a different
 * statement from a count of none and has to stay tellable apart: none refuses an
 * order and uncounted never does.
 */
export async function countStock(
  slug: string,
  counted: number | null,
  note: string | null,
  held?: string,
): Promise<Counted> {
  if (!API) {
    return {
      ok: false,
      message:
        "No stock service is reachable, so this count was not kept. It is held by the shop's " +
        "own records rather than in this browser, so there is nowhere else for it to go.",
    }
  }

  try {
    const response = await fetch(
      `${API}/api/admin/products/${encodeURIComponent(slug)}/stock`,
      {
        method: "PUT",
        headers: as(held),
        body: JSON.stringify({ counted, note }),
        cache: "no-store",
      },
    )
    const body = await response.json().catch(() => null)
    if (!response.ok) {
      return { ok: false, message: body?.message ?? "That count could not be kept." }
    }
    return { ok: true, stock: body?.stock ?? null, low: Boolean(body?.low) }
  } catch {
    return { ok: false, message: "Could not reach the shop's records, so nothing was kept." }
  }
}

/** What counts as low for one part. Admin's, and the service checks that again. */
export async function setLowStockAt(
  slug: string,
  lowStockAt: number | null,
  held?: string,
): Promise<Counted> {
  if (!API) {
    return { ok: false, message: "No stock service is reachable, so nothing was changed." }
  }

  try {
    const response = await fetch(
      `${API}/api/admin/products/${encodeURIComponent(slug)}/low-stock-at`,
      {
        method: "PUT",
        headers: as(held),
        body: JSON.stringify({ lowStockAt }),
        cache: "no-store",
      },
    )
    const body = await response.json().catch(() => null)
    if (!response.ok) {
      return { ok: false, message: body?.message ?? "That could not be changed." }
    }
    return { ok: true, stock: body?.stock ?? null, low: Boolean(body?.low) }
  } catch {
    return { ok: false, message: "Could not reach the shop's records, so nothing was changed." }
  }
}

/**
 * Who this call is from.
 *
 * The staff member's own service session where the console holds one, this
 * server's token otherwise. A count with nobody's name on it is a count nobody
 * will stand behind, which is the same argument the orders desk makes about who
 * took an order.
 */
function as(held?: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(held
      ? { Cookie: `allfix_session=${held}` }
      : SERVICE_TOKEN
        ? { "X-Allfix-Service": SERVICE_TOKEN }
        : {}),
  }
}
