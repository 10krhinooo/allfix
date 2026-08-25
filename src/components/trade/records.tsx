import Link from "next/link"
import { price, whatsapp, hours } from "@/lib/format"
import { QUOTE_STAGE, type TradeQuote } from "@/lib/trade"
import { Card, CardHeader, Pill } from "@/components/admin/parts"

/**
 * An order and a quote, drawn once.
 *
 * The overview shows the few that need looking at and the record screens show
 * all of them, which is two places the same object is rendered. Written twice
 * they drift, and the drift shows up as the same order reading differently on
 * two screens of the same console.
 */

export { OrderCard, type OrderRecord } from "@/components/orders/OrderCard"

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

      {/* A priced quote is worth a sheet whether or not it has been accepted
          yet: the proforma is what an accounts department pays against, and
          asking for it is often what happens before the yes rather than after
          it. A quote still being priced has no figures to hold, so it gets no
          link. */}
      {quote.totalKes !== null && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {yours && (
            <a
              href={whatsapp(`Accepting quote ${quote.reference}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-sm bg-[#1d8649] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#15703c]"
            >
              Accept {quote.reference}
            </a>
          )}
          <Link
            href={`/trade/account/quotes/${quote.reference}/proforma`}
            className="inline-flex items-center gap-2 rounded-sm border border-ink px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Proforma for transfer
          </Link>
        </div>
      )}
    </Card>
  )
}
