import { NextResponse } from "next/server"
import { readDesk } from "@/lib/admin/guard"
import { placeOrder, type PlaceLine, type Settlement } from "@/lib/orders-api"

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
  const desk = await readDesk()
  if (!desk) {
    return NextResponse.json(
      { message: "Sign in to place an order, and it will be saved to your account." },
      { status: 401 },
    )
  }

  let body: {
    lines?: unknown
    settlement?: unknown
    deliverTo?: unknown
    deliverPhone?: unknown
    note?: unknown
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

  const result = await placeOrder({
    lines,
    settlement,
    deliverTo: text(body.deliverTo),
    deliverPhone: text(body.deliverPhone),
    note: text(body.note),
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: result.message, problems: result.problems },
      { status: result.status },
    )
  }
  return NextResponse.json(result.order, { status: 201 })
}
