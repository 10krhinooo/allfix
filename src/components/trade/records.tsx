import { price, whatsapp, hours } from "@/lib/format"
import {
  ORDER_FLOW,
  ORDER_STAGE,
  QUOTE_STAGE,
  ordered,
  type TradeOrder,
  type TradeQuote,
} from "@/lib/trade"
import { Card, CardHeader, Pill } from "@/components/admin/parts"

/**
 * An order and a quote, drawn once.
 *
 * The overview shows the few that need looking at and the record screens show
 * all of them, which is two places the same object is rendered. Written twice
 * they drift, and the drift shows up as the same order reading differently on
 * two screens of the same console.
 */

export function OrderCard({ order }: { order: TradeOrder }) {
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

export function QuoteCard({ quote }: { quote: TradeQuote }) {
  const yours = quote.stage === "sent"

  return (
    <Card>
      <CardHeader
        title={quote.reference}
        hint={hours(quote.hoursAgo)}
        action={
          <Pill tone={yours ? "todo" : quote.stage === "accepted" ? "quiet" : "waiting"}>
            {QUOTE_STAGE[quote.stage]}
          </Pill>
        }
      />

      <p className="text-sm text-slate">
        {quote.lines.length} {quote.lines.length === 1 ? "line" : "lines"}
        {quote.lines[0] ? `, starting ${quote.lines[0].name.toLowerCase()}` : ""}
      </p>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
        {quote.note && <p className="max-w-md text-sm leading-relaxed text-slate">{quote.note}</p>}
        <span className="ml-auto">
          <span className="callout">Quoted</span>
          <span className="ml-3 font-mono text-lg text-ink">
            {quote.totalKes === null ? "Being priced" : price(quote.totalKes)}
          </span>
        </span>
      </div>

      {yours && (
        <a
          href={whatsapp(`Accepting quote ${quote.reference}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-sm bg-[#1f8f4e] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#187a41]"
        >
          Accept {quote.reference}
        </a>
      )}
    </Card>
  )
}
