"use client"

import Link from "next/link"
import { deskEnquiries, type DeskRow } from "@/lib/admin/rows"
import { useAdmin } from "@/lib/admin/store"
import { useDesk } from "@/components/admin/identity"
import { currentPrice, isSellable } from "@/lib/admin/pricing"
import { KIND_LABEL } from "@/lib/admin/desk"
import { price, arrived, hours } from "@/lib/format"
import {
  PageHead,
  Stats,
  Stat,
  Card,
  CardHeader,
  EmptyState,
  Pill,
  Blank,
} from "@/components/admin/parts"

/**
 * What is open, and nothing else.
 *
 * A dashboard is usually where a project puts the numbers that are pleasant to
 * look at. This one deliberately leads with the numbers that are wrong: parts
 * that cannot be sold, parts with no photograph, enquiries nobody has answered.
 * Turnover and visitor counts would be more flattering and would tell the
 * person opening the shop nothing they can act on before lunch.
 */
export function Counter({ rows }: { rows: DeskRow[] }) {
  const state = useAdmin()
  const desk = useDesk()

  const unpriced = rows.filter((row) => !isSellable(currentPrice(row, state.prices)))
  const unshot = rows.filter((row) => !row.photographed)
  // The filed ones are real, sent through the site by somebody who used the
  // booking form rather than opening a chat. They count the same.
  const enquiries = deskEnquiries(state.inbox)
  const open = enquiries.filter((enquiry) => (state.enquiries[enquiry.id] ?? "new") !== "closed")
  const answered = enquiries.length - open.length

  // Counted separately because they are not the same job. A part the client
  // priced in words has an answer already and needs a decision, not a figure.
  const inProse = unpriced.filter((row) => currentPrice(row, state.prices).priceNote)

  return (
    <>
      <PageHead
        title={`Good to see you, ${desk.name.split(" ")[0]}.`}
        lead="What is still open. The counter's own numbers, not the ones that look best."
      >
        <Link
          href="/admin/parts?show=unpriced"
          className="shrink-0 rounded-sm bg-oxblood px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
        >
          Work the price list
        </Link>
      </PageHead>

      <Stats>
        <Stat
          label="Cannot be sold"
          value={unpriced.length}
          hint={
            inProse.length > 0
              ? `${inProse.length} priced in words rather than figures.`
              : "Every part carries a figure."
          }
          accent={unpriced.length > 0}
          href="/admin/parts?show=unpriced"
        />
        <Stat
          label="No photograph"
          value={unshot.length}
          hint="They show a placeholder on the shop, not a broken image."
          href="/admin/parts?show=unshot"
        />
        <Stat
          label="Enquiries open"
          value={open.length}
          hint={answered > 0 ? `${answered} closed.` : "None closed yet."}
          href="/admin/enquiries"
        />
        <Stat
          label="Ready to sell"
          value={rows.length - unpriced.length}
          hint={`Out of ${rows.length} in the catalogue.`}
          href="/admin/parts"
        />
      </Stats>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Waiting on a price"
            hint="Nothing here can be bought until it carries a figure."
            action={
              <Link
                href="/admin/parts?show=unpriced"
                className="callout shrink-0 hover:text-ink"
              >
                All {unpriced.length}
              </Link>
            }
          />
          {unpriced.length === 0 ? (
            <EmptyState
              title="Nothing outstanding"
              body="Every part in the catalogue carries a figure."
            />
          ) : (
            <ul className="-mb-2">
              {unpriced.slice(0, 6).map((row) => {
                const now = currentPrice(row, state.prices)
                return (
                  <li key={row.slug} className="border-b border-rule last:border-b-0">
                    <Link
                      href={`/admin/parts?q=${encodeURIComponent(row.ref)}`}
                      className="block py-3 transition-colors hover:text-oxblood"
                    >
                      <span className="flex items-baseline justify-between gap-4">
                        <span className="text-sm font-medium text-ink">{row.name}</span>
                        <Blank>{now.priceNote ? "in words" : ""}</Blank>
                      </span>
                      <span className="mt-1 flex flex-wrap items-baseline gap-x-3">
                        <span className="font-mono text-[11px] text-mute">{row.ref}</span>
                        <span className="text-xs text-slate">{row.group}</span>
                      </span>
                      {now.priceNote && (
                        <span className="mt-1.5 block text-xs leading-relaxed text-slate">
                          {now.priceNote}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Latest enquiries"
            hint="Sent through the shop, and taken over the counter."
            action={
              <Link href="/admin/enquiries" className="callout shrink-0 hover:text-ink">
                All {enquiries.length}
              </Link>
            }
          />
          {enquiries.length === 0 ? (
            <EmptyState
              title="Nobody has called in"
              body="Enquiries sent through the shop land here, alongside the ones taken over the counter."
            />
          ) : (
            <ul className="-mb-2">
              {enquiries.slice(0, 4).map((enquiry) => {
                const status = state.enquiries[enquiry.id] ?? "new"
                return (
                  <li key={enquiry.id} className="border-b border-rule last:border-b-0">
                    <Link
                      href={`/admin/enquiries#${enquiry.id}`}
                      className="block py-3 transition-colors hover:text-oxblood"
                    >
                      <span className="flex items-baseline justify-between gap-4">
                        <span className="text-sm font-medium text-ink">{enquiry.name}</span>
                        <Pill tone={status === "closed" ? "quiet" : "todo"}>
                          {KIND_LABEL[enquiry.kind]}
                        </Pill>
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-slate">
                        {enquiry.summary}
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-baseline gap-x-3 font-mono text-[11px] text-mute">
                        <span>{enquiry.area}</span>
                        <span>
                          {"at" in enquiry
                            ? arrived(enquiry.at as number)
                            : hours(enquiry.hoursAgo)}
                        </span>
                        {status !== "new" && <span className="text-brass">{status}</span>}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      {state.log.length > 0 && (
        <Card className="mt-4">
          <CardHeader
            title="Price changes, newest first"
            hint="Who moved a figure, and what it was before."
          />
          <ul>
            {state.log.slice(0, 8).map((entry) => (
              <li
                key={`${entry.slug}-${entry.at}`}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule py-3 last:border-b-0"
              >
                <span className="text-sm text-ink">
                  {entry.name}
                  <span className="ml-3 font-mono text-[11px] text-mute">{entry.ref}</span>
                </span>
                <span className="font-mono text-xs text-slate">
                  {price(entry.from.priceKes, entry.from.priceBasis) ?? "unpriced"}
                  <span className="mx-2 text-mute">to</span>
                  <span className="text-ink">
                    {price(entry.to.priceKes, entry.to.priceBasis) ?? "unpriced"}
                  </span>
                  <span className="ml-3 text-mute">{entry.by}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}
