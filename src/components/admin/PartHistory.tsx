import { Card, CardHeader, EmptyState, Pill, Table, Td, Th } from "@/components/admin/parts"
import { price } from "@/lib/format"
import type { PriceMoment, StockMoment } from "@/lib/admin/catalogue-api"

/**
 * What this part has done, as opposed to what it is.
 *
 * The screen above can change a price and correct a count. This is the evidence
 * that the change happened, who made it and what it replaced, which is the half
 * that was missing: both endpoints existed on the service and nothing called
 * them, so the console could alter a figure and never show the figure back. The
 * answer to "what were we charging for this in June" lived only in the database.
 *
 * Read on the server and rendered as plain rows. Nothing here is interactive:
 * history is not something anybody edits, and a table that looked editable would
 * be inviting exactly the thing it exists to make impossible.
 */

/** A moment, in the shop's own words rather than an ISO string. */
function when(at: string): string {
  const on = new Date(at)
  if (Number.isNaN(on.getTime())) return at
  return on.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

/** Whoever did it, or the shop itself when a sale moved the shelf. */
function who(by: string | null): string {
  return by ?? "the shop"
}

const REASON: Record<StockMoment["reason"], { label: string; tone: "quiet" | "waiting" | "todo" }> =
  {
    COUNT: { label: "Counted", tone: "quiet" },
    ORDER: { label: "Sold", tone: "waiting" },
    CANCELLED: { label: "Order cancelled", tone: "quiet" },
    IMPORT: { label: "From a sheet", tone: "quiet" },
    CORRECTION: { label: "Corrected", tone: "todo" },
  }

export function PriceHistory({ moments }: { moments: PriceMoment[] | null }) {
  if (moments === null) {
    return (
      <Card>
        <CardHeader title="What it has cost" />
        <EmptyState
          title="No catalogue service is reachable"
          body="Price changes are kept by the shop's own records, so there is nothing to show until it answers."
        />
      </Card>
    )
  }

  if (moments.length === 0) {
    return (
      <Card>
        <CardHeader title="What it has cost" hint="Nothing yet" />
        <p className="mt-3 text-xs leading-relaxed text-slate">
          This part has not been repriced since the catalogue was migrated. The first change made
          here is recorded against whoever makes it.
        </p>
      </Card>
    )
  }

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="px-5 pt-5">
        <CardHeader title="What it has cost" hint={`${moments.length} change${moments.length === 1 ? "" : "s"}`} />
      </div>
      <Table>
        <thead>
          <tr>
            <Th>When</Th>
            <Th>From</Th>
            <Th>To</Th>
            <Th>Who</Th>
            <Th>Why</Th>
          </tr>
        </thead>
        <tbody>
          {moments.map((moment, at) => (
            <tr key={`${moment.at}-${at}`}>
              <Td>{when(moment.at)}</Td>
            {/* A null price is "on request" and must never read as nothing at
                all: a part going from a figure to on-request is the change most
                worth being able to see. */}
              <Td className="font-mono">{price(moment.fromKes, moment.fromBasis) ?? "On request"}</Td>
              <Td className="font-mono">{price(moment.toKes, moment.toBasis) ?? "On request"}</Td>
              <Td>{who(moment.by)}</Td>
              <Td>{moment.reason ?? <span className="text-mute">Not given</span>}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  )
}

export function StockHistory({ moments }: { moments: StockMoment[] | null }) {
  if (moments === null) {
    return (
      <Card>
        <CardHeader title="What the shelf has done" />
        <EmptyState
          title="No stock service is reachable"
          body="Movements are kept by the shop's own records, so there is nothing to show until it answers."
        />
      </Card>
    )
  }

  if (moments.length === 0) {
    return (
      <Card>
        <CardHeader title="What the shelf has done" hint="Nothing yet" />
        <p className="mt-3 text-xs leading-relaxed text-slate">
          Nobody has counted this part. An uncounted part is left alone: it never runs low and it
          never refuses an order, which is not the same as there being none.
        </p>
      </Card>
    )
  }

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="px-5 pt-5">
        <CardHeader
          title="What the shelf has done"
          hint={`${moments.length} movement${moments.length === 1 ? "" : "s"}`}
        />
      </div>
      <Table>
        <thead>
          <tr>
            <Th>When</Th>
            <Th>What</Th>
            <Th align="right">Change</Th>
            <Th align="right">Left</Th>
            <Th>Who</Th>
          </tr>
        </thead>
        <tbody>
          {moments.map((moment, at) => {
            const reason = REASON[moment.reason] ?? REASON.CORRECTION
            return (
              <tr key={`${moment.at}-${at}`}>
                <Td>{when(moment.at)}</Td>
                <Td>
                  <Pill tone={reason.tone}>{reason.label}</Pill>
                  {moment.orderReference && (
                    <span className="ml-2 font-mono text-xs text-slate">
                      {moment.orderReference}
                    </span>
                  )}
                </Td>
              {/* Signed, because "3" and "-3" are opposite events and the sign is
                  the whole of the difference between a delivery and a sale. */}
                <Td align="right" className="font-mono">
                  {moment.delta === null
                    ? ""
                    : moment.delta > 0
                      ? `+${moment.delta}`
                      : moment.delta}
                </Td>
                <Td align="right" className="font-mono">
                  {moment.countedTo ?? ""}
                </Td>
                <Td>{who(moment.by)}</Td>
              </tr>
            )
          })}
        </tbody>
      </Table>
      {moments.some((moment) => moment.note) && (
        <div className="border-t border-rule px-5 py-3">
          {moments
            .filter((moment) => moment.note)
            .map((moment, at) => (
              <p key={`${moment.at}-note-${at}`} className="text-xs leading-relaxed text-slate">
                <span className="callout">{when(moment.at)}</span> {moment.note}
              </p>
            ))}
        </div>
      )}
    </Card>
  )
}
