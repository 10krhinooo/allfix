import { products } from "@/lib/catalogue"
import { sellable } from "@/lib/commerce"

/**
 * Placing an order, as the storefront sees it.
 *
 * The sibling of `accounts.ts` and `registration.ts`, and the same seam: written
 * to the contract `allfix-backend` implements at `/api/orders`, so pointing it
 * at the real service is a change to this file and to nothing above it.
 *
 * The request carries SKUs and quantities and no prices, exactly as the server
 * accepts, and for the same reason: a request that could carry a price is one
 * somebody eventually sends a price in. What a line costs is worked out here
 * from the catalogue and, when the service is reachable, worked out again there.
 * The figure the customer is shown after ordering is the one that came back.
 *
 * Server side only. It is imported by the route handler and never by a client
 * component, which is what keeps the catalogue and `ALLFIX_API_URL` out of the
 * browser bundle.
 */

const API = process.env.ALLFIX_API_URL ?? ""

export interface PlaceLine {
  sku: string
  quantity: number
}

export type Settlement = "MPESA" | "PROFORMA" | "COUNTER"

export interface PlaceRequest {
  lines: PlaceLine[]
  settlement: Settlement
  deliverTo?: string | null
  deliverPhone?: string | null
  note?: string | null
}

export interface PlacedLine {
  sku: string
  name: string
  quantity: number
  unitKes: number
  lineKes: number
}

export interface Placed {
  reference: string
  status: string
  settlement: Settlement
  subtotalKes: number
  deliveryKes: number
  totalKes: number
  lines: PlacedLine[]
}

export type PlaceResult =
  | { ok: true; order: Placed }
  | { ok: false; status: number; message: string; problems?: string[] }

/** Read down a phone, so it is short and has no ambiguous characters. */
function reference(): string {
  return "AF-" + String(2300 + Math.floor(Math.random() * 9000))
}

/**
 * The same refusals the server makes, applied here too.
 *
 * Not a substitute for the server's copy: anything can post to the route
 * handler without loading a page. This runs first so the customer gets the
 * whole list of problems in one answer, and it is the only check there is on a
 * deployment the service has not been pointed at yet.
 */
function priceLocally(request: PlaceRequest): PlaceResult {
  const problems: string[] = []
  const lines: PlacedLine[] = []

  if (request.lines.length === 0) {
    return { ok: false, status: 400, message: "There is nothing in the basket." }
  }

  for (const line of request.lines) {
    const product = products.find(
      (candidate) => candidate.sku?.toLowerCase() === line.sku.toLowerCase(),
    )
    if (!product) {
      problems.push(`We do not stock ${line.sku}.`)
      continue
    }
    if (!Number.isFinite(line.quantity) || line.quantity <= 0 || line.quantity > 999) {
      problems.push(`The quantity for ${product.name} is not a number we can sell.`)
      continue
    }
    // The null price is the whole reason this project exists. It is not zero, it
    // is "ask us", and it cannot be checked out.
    if (!sellable(product) || product.priceKes === null) {
      problems.push(
        `${product.name} is priced on request. Ask the counter for a quote on that one and it ` +
          "can go on the same order.",
      )
      continue
    }
    lines.push({
      sku: product.sku!,
      name: product.name,
      quantity: line.quantity,
      unitKes: product.priceKes,
      lineKes: product.priceKes * line.quantity,
    })
  }

  if (problems.length > 0) {
    return { ok: false, status: 400, message: problems.join(" "), problems }
  }

  const subtotal = lines.reduce((sum, line) => sum + line.lineKes, 0)
  return {
    ok: true,
    order: {
      reference: reference(),
      status: "PLACED",
      settlement: request.settlement,
      subtotalKes: subtotal,
      // Quoted by county and confirmed with the order. Charging a guessed
      // figure would be worse than adding it when the counter confirms.
      deliveryKes: 0,
      totalKes: subtotal,
      lines,
    },
  }
}

export async function placeOrder(request: PlaceRequest): Promise<PlaceResult> {
  const checked = priceLocally(request)
  if (!checked.ok) return checked
  if (!API) return checked

  try {
    const response = await fetch(`${API}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      cache: "no-store",
    })
    const body = (await response.json()) as Placed & { message?: string; problems?: string[] }
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: body.message ?? "That order could not be placed.",
        problems: body.problems,
      }
    }
    // The server's figures, not ours. If the two disagree it is right.
    return { ok: true, order: body }
  } catch {
    return {
      ok: false,
      status: 503,
      message: "We could not reach the shop just then. Try again in a moment.",
    }
  }
}
