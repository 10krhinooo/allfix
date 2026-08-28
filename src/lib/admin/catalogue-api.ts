import type { PriceBasis } from "@/lib/catalogue"

/**
 * Writing to the catalogue: a part added, altered, priced, retired or removed.
 *
 * The counterpart of the read seam in `catalogue.ts`. Until both existed the
 * console could show the catalogue and never change it: a price typed at the
 * counter went into this browser's `localStorage` and reached neither the shop
 * nor the owner's laptop, on the one feature this project exists because of.
 *
 * Server only, like every console seam. Each call carries the staff member's
 * own session where the console holds one, because a price is a decision and an
 * audit row naming nobody is not an audit row.
 */

const API = process.env.ALLFIX_API_URL ?? ""
const SERVICE_TOKEN = process.env.ALLFIX_SERVICE_TOKEN ?? ""

/** A part as the console sees it, which includes the ones the shop no longer shows. */
export interface ConsolePart {
  slug: string
  sku: string | null
  name: string
  summary: string | null
  description: string | null
  imageName: string | null
  priceKes: number | null
  priceBasis: PriceBasis
  priceNote: string | null
  tradePriceKes: number | null
  photographed: boolean
  retiredAt: string | null
}

/**
 * One part, read through the console's own endpoint rather than the shop's.
 *
 * The shop's reads hide a retired part, which is the whole point of retiring
 * one. Read that way, the single screen that can put a part back on sale could
 * not find a part that was off it.
 */
export async function readPart(slug: string): Promise<ConsolePart | null> {
  if (!API) return null

  try {
    const response = await fetch(`${API}/api/admin/products/${encodeURIComponent(slug)}`, {
      headers: SERVICE_TOKEN ? { "X-Allfix-Service": SERVICE_TOKEN } : {},
      cache: "no-store",
    })
    if (!response.ok) return null

    const p = await response.json()
    return {
      slug: p.slug,
      sku: p.sku ?? null,
      name: p.name,
      summary: p.summary ?? null,
      description: p.description ?? null,
      imageName: p.imageName ?? null,
      priceKes: p.priceKes ?? null,
      priceBasis: down(p.priceBasis),
      priceNote: p.priceNote ?? null,
      tradePriceKes: p.tradePriceKes ?? null,
      photographed: Boolean(p.photographed),
      retiredAt: p.retiredAt ?? null,
    }
  } catch {
    return null
  }
}

/** One line of the shop's price history, as the counter's screen reads it. */
export interface PriceChange {
  slug: string
  sku: string | null
  name: string
  at: string
  by: string | null
  fromKes: number | null
  fromBasis: PriceBasis
  toKes: number | null
  toBasis: PriceBasis
  reason: string | null
}

/**
 * What has moved lately, across the whole catalogue.
 *
 * `null` where no service could be asked, so the screen can say so rather than
 * show an empty list that reads as "nothing has changed". The counter used to
 * read this out of its own browser, which meant three people had three answers.
 */
export async function readPriceChanges(limit = 8): Promise<PriceChange[] | null> {
  if (!API) return null

  try {
    const response = await fetch(`${API}/api/admin/price-changes?limit=${limit}`, {
      headers: SERVICE_TOKEN ? { "X-Allfix-Service": SERVICE_TOKEN } : {},
      cache: "no-store",
    })
    if (!response.ok) return null

    const body: unknown = await response.json()
    if (!Array.isArray(body)) return null

    return body.map((entry) => ({
      slug: entry.slug,
      sku: entry.sku,
      name: entry.name,
      at: entry.changedAt,
      by: entry.changedBy,
      fromKes: entry.oldPriceKes,
      fromBasis: down(entry.oldPriceBasis),
      toKes: entry.newPriceKes,
      toBasis: down(entry.newPriceBasis),
      reason: entry.reason,
    }))
  } catch {
    return null
  }
}

/** The service spells a basis EACH and the shop reads it as each. */
function down(basis: unknown): PriceBasis {
  return typeof basis === "string" ? (basis.toLowerCase() as PriceBasis) : "each"
}

export type Saved =
  | { ok: true; slug: string }
  | { ok: false; message: string }

/**
 * What a part is, as the console's form describes it.
 *
 * Absent means unchanged, exactly as the service reads it, so a form that sends
 * only what somebody edited behaves the way a half-filled sheet does.
 */
export interface PartEdit {
  /** Only read when adding. A code is what everything else is worked out from. */
  sku?: string
  name?: string
  summary?: string
  description?: string
  imageName?: string
  /** Only read when adding a rod, to work out what kind of part it is. */
  categories?: string
  specs?: { label: string; value: string }[]
}

/**
 * A whole pricing block, and it must always be whole.
 *
 * The opposite rule to `PartEdit`, and the service is deliberate about it: an
 * omitted field here means null rather than unchanged, because clearing a price
 * is a real edit ("stop selling this until we recheck it") and a shape that
 * could not say that would make the two indistinguishable. So the form sends
 * every field every time, including the ones nobody touched.
 */
export interface PriceEditWire {
  priceKes: number | null
  priceBasis: PriceBasis
  priceNote: string | null
  tradePriceKes: number | null
  reason?: string | null
}

const NO_SERVICE =
  "No catalogue service is reachable, so nothing was saved. The shop's parts are kept by its " +
  "own records rather than in this browser, so there is nowhere else for this to go."

export async function createPart(part: PartEdit, held?: string): Promise<Saved> {
  return write("POST", "/api/admin/products", part, held)
}

export async function savePart(slug: string, part: PartEdit, held?: string): Promise<Saved> {
  return write("PUT", `/api/admin/products/${encodeURIComponent(slug)}`, part, held)
}

/**
 * The price, through the endpoint that refuses a zero and writes the audit row.
 *
 * This is what the worksheet used to do to `localStorage`. Nothing here decides
 * what a valid price is: `PricingService` does, once, and its refusals are
 * sentences written for whoever is at the counter, so they are passed through
 * rather than translated.
 */
export async function pricePart(
  slug: string,
  price: PriceEditWire,
  held?: string,
): Promise<Saved> {
  return write("PUT", `/api/admin/products/${encodeURIComponent(slug)}/price`, {
    ...price,
    priceBasis: price.priceBasis.toUpperCase(),
  }, held)
}

/** Stops selling it. Reversible, and it stays on every order that carried it. */
export async function retirePart(slug: string, held?: string): Promise<Saved> {
  return write("POST", `/api/admin/products/${encodeURIComponent(slug)}/retire`, null, held)
}

export async function restorePart(slug: string, held?: string): Promise<Saved> {
  return write("POST", `/api/admin/products/${encodeURIComponent(slug)}/restore`, null, held)
}

/**
 * Removes it outright, which the service refuses once anything has been sold
 * under the code. That refusal is the useful part, so it is shown as written.
 */
export async function deletePart(slug: string, held?: string): Promise<Saved> {
  return write("DELETE", `/api/admin/products/${encodeURIComponent(slug)}`, null, held)
}

async function write(
  method: string,
  path: string,
  body: unknown,
  held?: string,
): Promise<Saved> {
  if (!API) return { ok: false, message: NO_SERVICE }

  try {
    const response = await fetch(`${API}${path}`, {
      method,
      headers: as(held),
      body: body === null ? undefined : JSON.stringify(body),
      cache: "no-store",
    })

    // A delete answers 204 with nothing in it, which is not JSON.
    if (response.status === 204) return { ok: true, slug: "" }

    const answer = await response.json().catch(() => null)
    if (!response.ok) {
      return { ok: false, message: answer?.message ?? "That could not be saved." }
    }
    return { ok: true, slug: answer?.slug ?? "" }
  } catch {
    return {
      ok: false,
      message: "Could not reach the shop's records, so nothing was saved. Try again in a moment.",
    }
  }
}

/**
 * Who this call is from: the staff member where the console holds their own
 * service session, this server's token otherwise. A price change records
 * whoever made it, and the token is not a person.
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
