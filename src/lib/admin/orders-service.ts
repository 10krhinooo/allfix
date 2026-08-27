import type { OrderLine, OrderStage } from "@/lib/orders"

/**
 * Every order the shop has, however it arrived.
 *
 * The counter's queue used to be the storefront's own checkout and nothing else,
 * because that was the only way an order could be recorded. This shop sells far
 * more over the counter, on WhatsApp and down the phone, and all of that lived
 * in a paper book, so the one screen meant to answer "where is that order" could
 * only answer it for the minority placed online.
 *
 * Server only, like the other console seams: `/api/admin/orders` is staff and
 * admin's, and this server holds no account of its own, so it carries the
 * service token. Never `NEXT_PUBLIC_`, never from a browser.
 */

const API = process.env.ALLFIX_API_URL ?? ""
const SERVICE_TOKEN = process.env.ALLFIX_SERVICE_TOKEN ?? ""

/** How an order reached the shop. Not how it is paid, which is settlement. */
export type Channel = "online" | "counter" | "whatsapp" | "phone"

export const CHANNELS: { id: Channel; label: string; hint: string }[] = [
  { id: "online", label: "Online", hint: "Placed by the customer on the site" },
  { id: "counter", label: "Counter", hint: "Taken over the counter" },
  { id: "whatsapp", label: "WhatsApp", hint: "Taken in a chat thread" },
  { id: "phone", label: "Phone", hint: "Taken on a call" },
]

export const CHANNEL_LABEL: Record<Channel, string> = {
  online: "Online",
  counter: "Counter",
  whatsapp: "WhatsApp",
  phone: "Phone",
}

export interface DeskOrder {
  reference: string
  stage: OrderStage
  hoursAgo: number
  lines: OrderLine[]
  note: string | null
  channel: Channel
  /** Who it is for, whether or not they have an account. */
  customer: string | null
  customerPhone: string | null
  /** The member of staff who keyed it in, or null on an online one. */
  takenBy: string | null
  settlement: string
  totalKes: number | null
  deliverTo: string | null
  paid: boolean
}

interface ServiceOrder {
  reference: string
  status: string
  settlement: string
  totalKes: number | null
  deliverTo: string | null
  note: string | null
  lines: { sku: string; name: string; quantity: number; basis: string; unitKes: number }[]
  paymentStatus: string | null
  channel: string
  customer: string | null
  customerPhone: string | null
  takenBy: string | null
  createdAt: string
}

/**
 * The queue, or `null` when there is no service to ask.
 *
 * The same distinction the enquiry queue makes and for the same reason: empty
 * means the shop has taken no orders, null means nobody could ask. Showing an
 * empty orders screen for a service that is down tells the counter there is
 * nothing to pack.
 */
export async function readOrders(): Promise<DeskOrder[] | null> {
  if (!API) return null

  try {
    const response = await fetch(`${API}/api/admin/orders`, {
      headers: SERVICE_TOKEN ? { "X-Allfix-Service": SERVICE_TOKEN } : {},
      // A counter refreshes this to see what has come in. A cached queue is
      // wrong exactly when somebody is looking at it.
      cache: "no-store",
    })
    if (!response.ok) return null

    const body: unknown = await response.json()
    if (!Array.isArray(body)) return null
    return body.map(fromService)
  } catch {
    return null
  }
}

function fromService(order: ServiceOrder): DeskOrder {
  return {
    reference: order.reference,
    stage: order.status.toLowerCase() as OrderStage,
    // The card takes an age rather than a timestamp, because it is drawn on
    // three desks and only one of them has a clock worth trusting.
    hoursAgo: Math.max(0, Math.round((Date.now() - Date.parse(order.createdAt)) / 3_600_000)),
    lines: order.lines.map((line) => ({
      ref: line.sku,
      name: line.name,
      quantity: line.quantity,
      basis: line.basis.toLowerCase() as OrderLine["basis"],
      unitKes: line.unitKes,
    })),
    note: order.note,
    channel: order.channel.toLowerCase() as Channel,
    customer: order.customer,
    customerPhone: order.customerPhone,
    takenBy: order.takenBy,
    settlement: order.settlement.toLowerCase(),
    totalKes: order.totalKes,
    deliverTo: order.deliverTo,
    paid: order.paymentStatus === "SUCCEEDED",
  }
}

/**
 * Who this call is from.
 *
 * A member of staff's own service session where the console is holding one, and
 * this server's token otherwise. Both are credentials and neither is ever sent
 * from a browser.
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

export type Taken =
  | { ok: true; reference: string; totalKes: number | null }
  | { ok: false; message: string; problems?: string[] }

export interface TakeOrder {
  lines: { sku: string; quantity: number }[]
  settlement: "MPESA" | "PROFORMA" | "COUNTER"
  channel: Channel
  name: string
  phone: string
  email?: string | null
  deliverTo?: string | null
  note?: string | null
}

/**
 * An order somebody at the counter is keying in.
 *
 * No price and no total, exactly as the storefront's own checkout sends none.
 * The service works the figures out from the parts and the quantities, so a
 * counter can no more type in a number it likes than a browser can, and the
 * tier comes off whichever account the address resolves to rather than off
 * anything chosen here.
 */
export async function takeOrder(order: TakeOrder, held?: string): Promise<Taken> {
  if (!API) {
    return {
      ok: false,
      message:
        "No order service is reachable, so this was not recorded. Write it in the book and " +
        "key it in once the service is back.",
    }
  }

  try {
    const response = await fetch(`${API}/api/admin/orders`, {
      method: "POST",
      // As the member of staff where there is one to be, and as this server
      // only where there is not. The service attributes the order to whoever
      // called it, and the service token is not a person: called that way every
      // order this screen took would record nobody, and an audit trail that
      // names nobody is not one. A seeded sign in has no service session to
      // forward, so it falls back and the order simply has no author.
      headers: as(held),
      body: JSON.stringify({ ...order, channel: order.channel.toUpperCase() }),
      cache: "no-store",
    })
    const body = await response.json().catch(() => null)

    if (!response.ok) {
      return {
        ok: false,
        message: body?.message ?? "That order could not be recorded.",
        problems: Array.isArray(body?.problems) ? body.problems : undefined,
      }
    }
    return { ok: true, reference: body?.reference ?? "", totalKes: body?.totalKes ?? null }
  } catch {
    return {
      ok: false,
      message: "Could not reach the shop's records. Write it in the book and key it in after.",
    }
  }
}

/**
 * Moving an order along.
 *
 * The service refuses a move its own transition table does not allow and says
 * why in counter-readable prose, so the refusal is passed through rather than
 * restated: a second copy of that table here would drift from the first, and
 * the one that matters is the one that writes the row.
 */
export async function moveOrder(
  reference: string,
  stage: OrderStage,
  held?: string,
): Promise<Taken> {
  if (!API) {
    return { ok: false, message: "No order service is reachable, so nothing was changed." }
  }

  try {
    const response = await fetch(`${API}/api/admin/orders/${encodeURIComponent(reference)}`, {
      method: "PATCH",
      headers: as(held),
      body: JSON.stringify({ status: stage.toUpperCase() }),
      cache: "no-store",
    })
    const body = await response.json().catch(() => null)
    if (!response.ok) {
      return { ok: false, message: body?.message ?? "That order could not be moved." }
    }
    return { ok: true, reference, totalKes: body?.totalKes ?? null }
  } catch {
    return { ok: false, message: "Could not reach the shop's records, so nothing was changed." }
  }
}
