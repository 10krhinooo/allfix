import { NextResponse } from "next/server"
import { check, tooMany } from "@/lib/rate-limit"
import { readDesk, readHeld } from "@/lib/admin/guard"
import { placeOrder, type PlaceLine, type Settlement } from "@/lib/orders-api"
import { tierFor } from "@/lib/tiers"

const SETTLEMENTS: Settlement[] = ["MPESA", "PROFORMA", "COUNTER"]

/**
 * `POST /api/orders`, the same body the service takes.
 *
 * A handler of its own rather than the browser calling Quarkus directly: the
 * session cookie is SameSite=Lax on the service's origin, so the call is made
 * server to server.
 *
 * Note what is not read out of the body: a price. There is no field for one
 * here or on the service, which is the point. The lines name parts and
 * quantities and the money is worked out from the catalogue.
 */
export async function POST(request: Request) {
  // Before anything else, including reading the body: a flood is cheapest to
  // refuse before it costs anything.
  const knock = check(request, "order")
  if (!knock.ok) return tooMany(knock.retryAfter)

  // No sign in required. Somebody who has found the part, checked it fits their
  // rail and put it in a basket has done the hard part; asking them to invent a
  // password before they can pay is where they leave. A session, when there is
  // one, still decides who the order belongs to.
  const desk = await readDesk()

  let body: {
    lines?: unknown
    settlement?: unknown
    deliverTo?: unknown
    deliverPhone?: unknown
    note?: unknown
    guest?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "That request was not readable." }, { status: 400 })
  }

  const lines: PlaceLine[] = Array.isArray(body.lines)
    ? body.lines
        .filter(
          (line): line is { sku: string; quantity: number } =>
            typeof line === "object" &&
            line !== null &&
            typeof (line as { sku?: unknown }).sku === "string" &&
            typeof (line as { quantity?: unknown }).quantity === "number",
        )
        .map((line) => ({ sku: line.sku, quantity: line.quantity }))
    : []

  const settlement = SETTLEMENTS.includes(body.settlement as Settlement)
    ? (body.settlement as Settlement)
    : "COUNTER"

  const text = (value: unknown): string | null =>
    typeof value === "string" && value.trim() ? value.trim().slice(0, 2000) : null

  const asked = body.guest as { name?: unknown; phone?: unknown; email?: unknown } | undefined
  const guest =
    desk || !asked
      ? null
      : {
          name: text(asked.name) ?? "",
          phone: text(asked.phone) ?? "",
          email: text(asked.email),
        }

  if (!desk && (!guest?.name || !guest.phone)) {
    return NextResponse.json(
      {
        message:
          "We need a name and a phone number to deliver this and to call you about it.",
      },
      { status: 400 },
    )
  }

  const result = await placeOrder(
    {
      lines,
      settlement,
      deliverTo: text(body.deliverTo),
      deliverPhone: text(body.deliverPhone) ?? guest?.phone ?? null,
      note: text(body.note),
      guest,
    },
    // From the cookie, not from the body. A guest is priced at list because
    // there is no account to look a tier up on, which is the same answer the
    // service gives itself.
    tierFor(desk?.role),
    // The service session this cookie holds, so the order is placed as the
    // customer rather than by an anonymous server on their behalf.
    (await readHeld())?.svc,
  )

  if (!result.ok) {
    return NextResponse.json(
      { message: result.message, problems: result.problems },
      { status: result.status },
    )
  }
  return NextResponse.json(result.order, { status: 201 })
}
