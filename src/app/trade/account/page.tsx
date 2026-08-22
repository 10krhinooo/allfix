import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { whatsapp } from "@/lib/format"
import { ordersFor, quotesFor, TRADE_DISCOUNT } from "@/lib/trade"
import { PageHead, Stats, Stat, Card, CardHeader, EmptyState } from "@/components/admin/parts"
import { OrderCard, QuoteCard } from "@/components/trade/records"

export const metadata: Metadata = {
  title: "Your trade account",
  robots: { index: false, follow: false },
}

/**
 * The desk, on arrival.
 *
 * The counts first, then only what is actually waiting: the orders still moving
 * and the quotes that need a yes. Everything else is one click away on its own
 * screen rather than stacked underneath here, which is the whole reason this
 * stopped being one long page.
 */
export default async function TradeAccountPage() {
  const desk = await readDesk()
  if (!desk) redirect("/sign-in?next=%2Ftrade%2Faccount")

  const orders = ordersFor(desk.email)
  const quotes = quotesFor(desk.email)
  const working = orders.filter(
    (order) => order.stage !== "collected" && order.stage !== "cancelled",
  )
  const awaitingYou = quotes.filter((quote) => quote.stage === "sent")
  const beingPriced = quotes.filter(
    (quote) => quote.stage === "requested" || quote.stage === "pricing",
  )

  return (
    <>
      <PageHead
        title={`Good to see you, ${desk.name.split(" ")[0]}.`}
        lead="Where everything you have with us has got to, and what is waiting on you."
      >
        <Link
          href="/trade/account/quotes"
          className="shrink-0 rounded-sm bg-oxblood px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
        >
          Price a new list
        </Link>
      </PageHead>

      <Stats>
        <Stat
          label="Orders being worked"
          value={working.length}
          hint="Placed, packed or on the way."
          href="/trade/account/orders"
        />
        <Stat
          label="Quotes waiting on you"
          value={awaitingYou.length}
          hint="Priced and held, until you say."
          accent={awaitingYou.length > 0}
          href="/trade/account/quotes"
        />
        <Stat
          label="With the counter"
          value={beingPriced.length}
          hint="Being priced now."
          href="/trade/account/quotes"
        />
        <Stat
          label="Off list, your rate"
          value={`${Math.round(TRADE_DISCOUNT * 100)}%`}
          hint="Applied to every figure here."
        />
      </Stats>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <CardHeader
            title="On the bench"
            hint="Orders that have not been collected yet."
            action={
              <Link href="/trade/account/orders" className="callout shrink-0 hover:text-ink">
                All {orders.length}
              </Link>
            }
          />
          {working.length === 0 ? (
            <EmptyState
              title="Nothing on the bench today"
              body="Anything ordered over the counter or through a quote appears here, with where it has got to."
            />
          ) : (
            working.slice(0, 2).map((order) => <OrderCard key={order.reference} order={order} />)
          )}
        </div>

        <div className="space-y-4">
          <CardHeader
            title="Waiting on you"
            hint="Priced and held until you accept."
            action={
              <Link href="/trade/account/quotes" className="callout shrink-0 hover:text-ink">
                All {quotes.length}
              </Link>
            }
          />
          {awaitingYou.length === 0 ? (
            <EmptyState
              title="Nothing needs a yes"
              body="A quote the counter has priced sits here until you accept it, and holds its figures while it does."
            />
          ) : (
            awaitingYou.slice(0, 2).map((quote) => <QuoteCard key={quote.reference} quote={quote} />)
          )}
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader title="What we hold today" hint="Your account, as the counter has it." />
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
          <div>
            <dt className="callout">Signed in as</dt>
            <dd className="mt-1.5 truncate font-mono text-sm text-ink">{desk.email}</dd>
          </div>
          <div>
            <dt className="callout">Rate</dt>
            <dd className="mt-1.5 font-mono text-sm text-ink">
              {Math.round(TRADE_DISCOUNT * 100)}% off list
            </dd>
          </div>
          <div>
            <dt className="callout">Settlement</dt>
            <dd className="mt-1.5 font-mono text-sm text-ink">Proforma, on request</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link
            href="/shop"
            className="rounded-sm border border-ink px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
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
      </Card>
    </>
  )
}
