import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { Empty } from "@/components/ui"
import { Figures, Figure } from "@/components/admin/parts"
import { SignOutButton } from "@/components/admin/SignOutButton"
import { QuoteBuilder, type Pickable } from "@/components/trade/QuoteBuilder"
import { products } from "@/lib/catalogue"
import { price, whatsapp, hours } from "@/lib/format"
import {
  ORDER_FLOW,
  ORDER_STAGE,
  QUOTE_STAGE,
  ordered,
  ordersFor,
  quotesFor,
  TRADE_DISCOUNT,
} from "@/lib/trade"

export const metadata: Metadata = {
  title: "Your trade account",
  robots: { index: false, follow: false },
}

/**
 * The trade desk.
 *
 * Not the console, and deliberately not a second shop either. A fundi or a
 * curtain maker wants two things when they sign in: where the order they placed
 * has got to, and a price on a list of parts they can hand to a client. So the
 * page is those two, in that order, and the storefront chrome stays because a
 * trade account is still a customer who should be able to browse.
 */
export default async function TradeAccountPage() {
  const desk = await readDesk()
  if (!desk) redirect("/sign-in?next=%2Ftrade%2Faccount")

  const orders = ordersFor(desk.email)
  const quotes = quotesFor(desk.email)
  const working = orders.filter((order) => order.stage !== "collected" && order.stage !== "cancelled")
  const awaitingYou = quotes.filter((quote) => quote.stage === "sent")
  const beingPriced = quotes.filter((quote) => quote.stage === "requested" || quote.stage === "pricing")

  /*
   * A compact projection for the quote builder, so the 200 KB of specs and copy
   * behind each product never reaches the client. The same reasoning as the
   * shop's own browser, and the reason the list is five string fields.
   */
  const pickable: Pickable[] = products
    .filter((product) => product.sku)
    .map((product) => ({
      slug: product.slug,
      ref: product.sku as string,
      name: product.name,
      listKes: product.priceKes,
      basis: product.priceBasis,
    }))

  return (
    <>
      {/* ---------------------------------------- the account */}
      {/*
        An account area, not a shopfront. The storefront chrome stays, because a
        trade account is a customer who should be able to browse, but everything
        below the header is worked rather than read: a dense header, the day's
        figures, then the two records. The counter console is laid out the same
        way for the same reason, and this uses its primitives so the two screens
        do not disagree about what a figure looks like.
      */}
      <div className="border-b border-rule bg-paper">
        <div className="shell flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4">
          <span className="min-w-0">
            <span className="flex flex-wrap items-baseline gap-x-3">
              <span className="font-display text-lg font-bold tracking-tight">{desk.name}</span>
              <span className="callout">Trade account</span>
            </span>
            <span className="mt-0.5 block font-mono text-[11px] text-mute">{desk.email}</span>
          </span>

          <span className="flex items-center gap-4">
            <Link href="/shop" className="callout hover:text-ink">
              The shop
            </Link>
            {/*
              The storefront chrome has a way in and no way out: the header's
              Sign in is a door for somebody who has not used one yet. So the
              account carries its own, and as a button rather than a label,
              because a control nobody can find is not one.
            */}
            <SignOutButton className="rounded-sm border border-ink px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper" />
          </span>
        </div>
      </div>

      <Figures>
        <Figure
          value={working.length}
          label="orders being worked"
          tone={working.length > 0 ? "warn" : "ink"}
          note="Placed, packed or on the way."
        />
        <Figure
          value={awaitingYou.length}
          label="quotes waiting on you"
          tone={awaitingYou.length > 0 ? "warn" : "ink"}
          note="Priced and held, until you say."
        />
        <Figure
          value={beingPriced.length}
          label="with the counter"
          tone="quiet"
          note="Being priced now."
        />
        <Figure
          value={`${Math.round(TRADE_DISCOUNT * 100)}%`}
          label="off list, your rate"
          tone="quiet"
          note="Applied to every figure here."
        />
      </Figures>

      {/* ---------------------------------------- orders */}
      <section className="border-b border-rule bg-panel">
        <div className="shell py-14">
          <p className="callout">Orders</p>
          <h2 className="display-lg mt-3 font-display font-bold tracking-tight">
            {working.length > 0
              ? `${working.length} being worked on`
              : "Nothing on the bench today"}
          </h2>

          {orders.length === 0 ? (
            <div className="mt-8">
              <Empty title="No orders yet">
                Anything ordered over the counter or through a quote appears here, with where it
                has got to.
              </Empty>
            </div>
          ) : (
            <ul className="mt-8 space-y-4">
              {orders.map((order) => {
                const total = ordered(order.lines)
                const reached = ORDER_FLOW.indexOf(order.stage)
                return (
                  <li key={order.reference} className="border border-rule bg-paper p-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                      <span>
                        <span className="font-mono text-sm text-ink">{order.reference}</span>
                        <span className="ml-3 text-xs text-mute">{hours(order.hoursAgo)}</span>
                      </span>
                      <span className="callout text-ink">{ORDER_STAGE[order.stage]}</span>
                    </div>

                    {/*
                      The stage as a row of segments rather than a word alone, so
                      "where is it" is answered by glancing rather than reading.
                    */}
                    {order.stage !== "cancelled" && (
                      <ol className="mt-4 flex gap-1" aria-label="Progress">
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
                      {order.note && (
                        <p className="max-w-md text-sm leading-relaxed text-slate">{order.note}</p>
                      )}
                      <span className="ml-auto">
                        <span className="callout">Total</span>
                        <span className="ml-3 font-mono text-lg text-ink">
                          {total === null ? "On request" : price(total)}
                        </span>
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      {/* ---------------------------------------- quotes */}
      <section className="shell py-14">
        <p className="callout">Quotes</p>
        <h2 className="display-lg mt-3 max-w-[22ch] font-display font-bold tracking-tight">
          Price a list before you promise it.
        </h2>

        {quotes.length > 0 && (
          <ul className="mt-8 space-y-4">
            {quotes.map((quote) => (
              <li key={quote.reference} className="border border-rule p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                  <span>
                    <span className="font-mono text-sm text-ink">{quote.reference}</span>
                    <span className="ml-3 text-xs text-mute">{hours(quote.hoursAgo)}</span>
                  </span>
                  <span
                    className={`callout ${quote.stage === "sent" ? "text-oxblood" : "text-ink"}`}
                  >
                    {QUOTE_STAGE[quote.stage]}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate">
                  {quote.lines.length} {quote.lines.length === 1 ? "line" : "lines"}
                  {quote.lines[0] ? `, starting ${quote.lines[0].name.toLowerCase()}` : ""}
                </p>

                <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
                  {quote.note && (
                    <p className="max-w-md text-sm leading-relaxed text-slate">{quote.note}</p>
                  )}
                  <span className="ml-auto">
                    <span className="callout">Quoted</span>
                    <span className="ml-3 font-mono text-lg text-ink">
                      {quote.totalKes === null ? "Being priced" : price(quote.totalKes)}
                    </span>
                  </span>
                </div>

                {quote.stage === "sent" && (
                  <a
                    href={whatsapp(`Accepting quote ${quote.reference}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-2 rounded-sm bg-[#1f8f4e] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#187a41]"
                  >
                    Accept {quote.reference}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}

        <h3 className="callout mt-12">A new quote</h3>
        <div className="mt-4 max-w-3xl">
          <QuoteBuilder parts={pickable} account={desk.name} />
        </div>
      </section>

      {/* ---------------------------------------- what we hold */}
      <section className="border-t border-rule bg-panel">
        <div className="shell py-14">
          <p className="callout">Your account</p>
          <h2 className="display-lg mt-3 font-display font-bold tracking-tight">
            What we hold today
          </h2>

          {/*
            A flush grid with auto-fit, not auto-fill. Fill keeps the empty
            tracks and the hairlines then draw them as empty ruled boxes at the
            end of the row, which is the grey box bug the home page grids were
            fixed for. Cells repeat the panel ground and the rule is theirs.
          */}
          <dl
            className="flush mt-8 grid"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 17rem), 1fr))" }}
          >
            <div className="bg-panel p-6">
              <dt className="callout">Signed in as</dt>
              <dd className="mt-2 font-mono text-sm text-ink">{desk.email}</dd>
            </div>
            <div className="bg-panel p-6">
              <dt className="callout">Rate</dt>
              <dd className="mt-2 font-mono text-sm text-ink">
                {Math.round(TRADE_DISCOUNT * 100)}% off list
              </dd>
            </div>
            <div className="bg-panel p-6">
              <dt className="callout">Settlement</dt>
              <dd className="mt-2 font-mono text-sm text-ink">Proforma, on request</dd>
            </div>
          </dl>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-sm bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
            >
              Browse the catalogue
            </Link>
            <a
              href={whatsapp(`Trade account: ${desk.name}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-oxblood hover:underline"
            >
              Talk to the counter
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
