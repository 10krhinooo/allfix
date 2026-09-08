import Link from "next/link"
import { Card, CardHeader, EmptyState, Figure, Figures, PageHead, Section } from "@/components/admin/parts"
import { ExportFigures } from "@/components/admin/ExportFigures"
import { price } from "@/lib/format"
import type { ChannelCount, Point, Shelf, StatusCount, Summary, TopPart } from "@/lib/admin/reports-service"

/**
 * What the shop did, on the screen somebody opens first.
 *
 * `/admin` was a list of counts about the catalogue: how many parts are
 * unpriced, how many are unphotographed. Useful work, and not what the person
 * who owns the shop wants to know at eight in the morning, which is what came
 * in yesterday and what is running out.
 *
 * Two rules run through the whole screen and are worth stating once.
 *
 * **Nobody could ask is not nothing happened.** Every figure here comes from
 * the service, and with no service configured the shop prices orders locally
 * and never persists them. A dashboard that drew zeroes in that state would
 * tell an owner their shop had a quiet month when in fact it had not been
 * recording anything at all, which is the worst thing this screen could do.
 *
 * **Money is what was ordered, not what was collected.** The two are reported
 * beside each other rather than added, because most orders settle at the
 * counter and never touch the payment table, and a single blended number would
 * be neither.
 */

/**
 * A figure on this screen is always a figure.
 *
 * `price()` answers null so a product page can say "price on request", which is
 * the right answer there and a bug here: a day the shop took nothing took zero,
 * and it should say so rather than inviting anybody to ask.
 */
function shillings(kes: number): string {
  return price(kes) ?? "KES 0"
}

/** Nairobi money, short enough to read on a phone. Thousands become k. */
function short(kes: number): string {
  if (kes >= 1_000_000) return `${(kes / 1_000_000).toFixed(1)}M`
  if (kes >= 10_000) return `${Math.round(kes / 1000)}k`
  return String(Math.round(kes))
}

const CHANNEL_LABEL: Record<ChannelCount["channel"], string> = {
  ONLINE: "Online",
  COUNTER: "Counter",
  WHATSAPP: "WhatsApp",
  PHONE: "Phone",
}

const STATUS_LABEL: Record<StatusCount["status"], string> = {
  PLACED: "Placed",
  PACKING: "Packing",
  DISPATCHED: "Out",
  COLLECTED: "Collected",
  CANCELLED: "Cancelled",
}

export function Dashboard({ summary, name }: { summary: Summary | null; name: string }) {
  return (
    <>
      <PageHead
        title={`Good to see you, ${name.split(" ")[0]}.`}
        lead="What the shop took, what is moving, and what the shelf is short."
      >
        {summary !== null && <ExportFigures summary={summary} />}
      </PageHead>

      {summary === null ? (
        // The most important empty state in the console. With no service
        // configured an order is priced in the browser and never written down,
        // so a page of zeroes here would read as a quiet month rather than as a
        // shop that has not been recording anything.
        <Alarm>
          No figures, because no order service is reachable. That is not a quiet month: with
          nothing to record to, an order placed on the shop is priced and then lost. Check the
          platform screen before trusting anything on the counter.
        </Alarm>
      ) : (
        <div className="space-y-6">
          <Takings summary={summary} />
          <Chart series={summary.series} />

          <div className="grid gap-6 lg:grid-cols-2">
            <Moving parts={summary.topParts} />
            <div className="space-y-6">
              <Shelves shelf={summary.shelf} />
              <Bench statuses={summary.statuses} />
              <Arrived channels={summary.channels} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * The alert this console did not have.
 *
 * `Note` is `max-w-xs` at eleven pixels, which is right for an aside beside a
 * field and wrong for the two sentences on this screen that matter most. These
 * are read across the whole width, carry `role="alert"` so a screen reader
 * announces them on arrival, and say what is happening rather than that
 * something went wrong.
 */
function Alarm({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="border-l-2 border-oxblood bg-oxblood/5 px-4 py-3.5 text-sm leading-relaxed text-ink"
    >
      {children}
    </div>
  )
}

function Takings({ summary }: { summary: Summary }) {
  const { money, trade } = summary
  const change =
    money.takenPreviousMonth > 0
      ? Math.round(((money.takenThisMonth - money.takenPreviousMonth) / money.takenPreviousMonth) * 100)
      : null

  return (
    <Figures>
      <Figure label="Taken today" value={shillings(money.takenToday)} />
      <Figure label="This week" value={shillings(money.takenThisWeek)} />
      <Figure
        label="This month"
        value={shillings(money.takenThisMonth)}
        note={
          change === null
            ? `${money.ordersThisMonth} orders`
            : `${change >= 0 ? "up" : "down"} ${Math.abs(change)}% on last month`
        }
        tone="warn"
      />
      <Figure
        label="Average order"
        value={money.averageOrderKes === null ? "None yet" : shillings(money.averageOrderKes)}
        note={
          trade.tradeOrdersThisMonth > 0
            ? `${trade.tradeOrdersThisMonth} on trade accounts`
            : `${trade.tradeAccounts} trade accounts`
        }
      />
    </Figures>
  )
}

/**
 * Thirty days, drawn rather than charted.
 *
 * Inline SVG and no library, which is the same argument the profile drawings
 * make: a charting dependency for one chart is a poor trade in a repository
 * that draws its own hardware. It is also the only way this stays legible on a
 * phone, where a library's default is a legend and four axis labels nobody can
 * read.
 *
 * The bars are the reason it is bars. A line drawn through days with no trade
 * implies a slow Sunday rather than a closed one, and this shop closes.
 */
function Chart({ series }: { series: Point[] }) {
  const peak = Math.max(...series.map((day) => day.takenKes), 1)
  const total = series.reduce((sum, day) => sum + day.takenKes, 0)
  const width = 100
  const gap = 0.5
  const bar = (width - gap * (series.length - 1)) / series.length

  return (
    <Card>
      <CardHeader
        title="The last thirty days"
        hint={`${shillings(total)} across ${series.reduce((sum, day) => sum + day.orders, 0)} orders. A day with no trade is a gap, not a dip.`}
      />

      <div className="mt-5">
        <svg
          viewBox={`0 0 ${width} 34`}
          preserveAspectRatio="none"
          className="h-28 w-full sm:h-36"
          role="img"
          aria-label={`Daily takings for the last ${series.length} days. Highest day ${shillings(peak)}.`}
        >
          {series.map((day, index) => {
            const height = (day.takenKes / peak) * 30
            return (
              <rect
                key={day.day}
                x={index * (bar + gap)}
                y={32 - height}
                width={bar}
                height={Math.max(height, day.takenKes > 0 ? 0.6 : 0.25)}
                rx="0.4"
                className={day.takenKes > 0 ? "fill-brass" : "fill-rule"}
              >
                <title>{`${day.day}: ${shillings(day.takenKes)}, ${day.orders} orders`}</title>
              </rect>
            )
          })}
          {/* The floor, so an empty month still reads as a chart rather than a blank box. */}
          <rect x="0" y="32" width={width} height="0.25" className="fill-rule" />
        </svg>

        <div className="mt-2 flex items-baseline justify-between">
          <span className="callout">{series[0]?.day}</span>
          <span className="callout">Peak {shillings(peak)}</span>
          <span className="callout">{series[series.length - 1]?.day}</span>
        </div>
      </div>
    </Card>
  )
}

function Moving({ parts }: { parts: TopPart[] }) {
  return (
    <Card>
      <CardHeader
        title="What moves"
        hint="By money rather than by count. Counted, the answer is always runners."
      />
      {parts.length === 0 ? (
        <EmptyState
          title="Nothing sold yet"
          body="Once orders start arriving, the parts earning the most appear here."
        />
      ) : (
        <ul className="mt-4 divide-y divide-rule">
          {parts.map((part) => (
            <li key={part.sku} className="flex items-baseline justify-between gap-4 py-2.5">
              <span className="min-w-0">
                <span className="block truncate text-sm text-ink">{part.name}</span>
                <span className="font-mono text-[11px] text-mute">{part.sku}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-mono text-sm text-ink">{shillings(part.takenKes)}</span>
                <span className="font-mono text-[11px] text-mute">{part.quantity} sold</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

/**
 * The shelf, and the distinction the whole stock model rests on.
 *
 * Uncounted is given the same weight as low, because it is almost always the
 * larger number and it is the one that decides whether the other two mean
 * anything. "3 running low" over 150 parts nobody has been to look at is a
 * reassuring lie.
 */
function Shelves({ shelf }: { shelf: Shelf }) {
  return (
    <Card>
      <CardHeader title="The shelf" hint="A part nobody has counted is not a part with none." />
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4 lg:grid-cols-2">
        <Count label="Counted" value={shelf.counted} />
        <Count label="Never counted" value={shelf.uncounted} muted />
        <Count label="Running low" value={shelf.low} warn={shelf.low > 0} />
        <Count label="None left" value={shelf.outOfStock} warn={shelf.outOfStock > 0} />
      </dl>
      <Link href="/admin/stock" className="callout mt-4 inline-block hover:text-ink">
        Count a shelf
      </Link>
    </Card>
  )
}

function Count({
  label,
  value,
  warn,
  muted,
}: {
  label: string
  value: number
  warn?: boolean
  muted?: boolean
}) {
  return (
    <div>
      <dt className="callout">{label}</dt>
      <dd
        className={`mt-1 font-display text-2xl tabular-nums ${
          warn ? "text-oxblood" : muted ? "text-mute" : "text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

/**
 * What is owed work.
 *
 * All time rather than this month, and that is the point of it: an order placed
 * in August and never dispatched is exactly what this screen is for, and a
 * window would hide the only one that matters.
 *
 * The channel split used to sit under these counts, and it was wrong to: it is
 * a figure about this month, and these are a figure about every month, so one
 * card said twenty four placed with a nil beside every channel. Two questions
 * that cannot share a heading are two cards.
 */
function Bench({ statuses }: { statuses: StatusCount[] }) {
  const open = statuses.filter((each) => each.status !== "COLLECTED" && each.status !== "CANCELLED")
  const waiting = open.reduce((sum, each) => sum + each.orders, 0)

  return (
    <Card>
      <CardHeader
        title="On the bench"
        hint="Every order still in motion, whenever it was placed. One left from August is the whole reason this is not a month."
      />

      {waiting === 0 ? (
        <EmptyState title="Nothing waiting" body="Every order that has been placed has been collected or cancelled." />
      ) : (
        <dl className="mt-4 grid grid-cols-3 gap-4">
          {open.map((each) => (
            <div key={each.status}>
              <dt className="callout">{STATUS_LABEL[each.status]}</dt>
              <dd className="mt-1 font-display text-2xl tabular-nums text-ink">{each.orders}</dd>
            </div>
          ))}
        </dl>
      )}

      <Link href="/admin/orders" className="callout mt-4 inline-block hover:text-ink">
        The orders desk
      </Link>
    </Card>
  )
}

/**
 * Where this month's orders came from.
 *
 * Its own card and its own stated window, because it is the one figure here
 * that answers a question about the trade rather than about the work. Every
 * channel is listed even at nil: a channel missing from the list reads as
 * "we do not do that" rather than "none this month", and the shop needs to see
 * a quiet WhatsApp.
 */
function Arrived({ channels }: { channels: ChannelCount[] }) {
  const total = channels.reduce((sum, each) => sum + each.orders, 0)

  return (
    <Card>
      <CardHeader
        title="How they arrived"
        hint={
          total === 0
            ? "Nothing this month yet. More of this shop's trade comes over the counter than online."
            : `${total} orders this month. More of this shop's trade comes over the counter than online.`
        }
      />
      <ul className="mt-4 space-y-1.5">
        {channels.map((each) => (
          <li key={each.channel} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-slate">{CHANNEL_LABEL[each.channel]}</span>
            <span className="font-mono text-xs text-mute">
              {each.orders} · {short(each.takenKes)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export { Section }
