import { price, hours } from "@/lib/format"
import { ORDER_FLOW, ORDER_STAGE, ordered, type OrderLine, type OrderStage } from "@/lib/orders"
import { Card, CardHeader, Pill } from "@/components/admin/parts"

/**
 * An order, drawn once for every desk that shows one.
 *
 * The overview shows the few that need looking at and the record screens show
 * all of them, and now the shopper's account shows the same object again. Drawn
 * separately per desk they drift, and the drift reads as the same order looking
 * different depending on which screen you opened.
 *
 * What differs between desks is not the card, it is what sits under it: a trade
 * account cares what it paid at its tier, a shopper cares how it was settled and
 * where it went. That goes in `meta`.
 */

/**
 * What this card needs, which is less than either desk's full record.
 *
 * Structural rather than either concrete type, so the trade desk's order and
 * the shopper's both satisfy it without one importing the other's module.
 */
export interface OrderRecord {
  reference: string
  stage: OrderStage
  hoursAgo: number
  lines: OrderLine[]
  note: string | null
}

export function OrderCard({ order, meta }: { order: OrderRecord; meta?: React.ReactNode }) {
  const total = ordered(order.lines)
  const reached = ORDER_FLOW.indexOf(order.stage)
  const done = order.stage === "collected" || order.stage === "cancelled"

  return (
    <Card>
      <CardHeader
        title={order.reference}
        hint={hours(order.hoursAgo)}
        action={<Pill tone={done ? "quiet" : "waiting"}>{ORDER_STAGE[order.stage]}</Pill>}
      />

      {/* The stage as a row of segments rather than a word alone, so "where is
          it" is answered by glancing rather than by reading. */}
      {order.stage !== "cancelled" && (
        <ol className="flex gap-1" aria-label="Progress">
          {ORDER_FLOW.map((stage, index) => (
            <li
              key={stage}
              className={`h-1 flex-1 ${index <= reached ? "bg-brass" : "bg-rule"}`}
            >
              <span className="sr-only">
                {ORDER_STAGE[stage]}
                {index <= reached ? ", done" : ""}
              </span>
            </li>
          ))}
        </ol>
      )}

      <ul className="mt-5 border-t border-rule">
        {order.lines.map((line) => (
          <li
            key={line.ref}
            className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule py-2.5"
          >
            <span className="min-w-0">
              <span className="text-sm text-ink">{line.name}</span>
              <span className="ml-3 font-mono text-[11px] text-mute">{line.ref}</span>
            </span>
            <span className="font-mono text-xs text-slate">
              {line.quantity} {line.basis} ·{" "}
              {line.unitKes === null ? "on request" : price(line.unitKes * line.quantity)}
            </span>
          </li>
        ))}
      </ul>

      {meta}

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
        {order.note && <p className="max-w-md text-sm leading-relaxed text-slate">{order.note}</p>}
        <span className="ml-auto">
          <span className="callout">Total</span>
          <span className="ml-3 font-mono text-lg text-ink">
            {total === null ? "On request" : price(total)}
          </span>
        </span>
      </div>
    </Card>
  )
}
