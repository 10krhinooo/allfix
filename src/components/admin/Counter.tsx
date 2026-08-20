"use client"

import Link from "next/link"
import type { DeskRow } from "@/lib/admin/rows"
import { useAdmin } from "@/lib/admin/store"
import { currentPrice, isSellable } from "@/lib/admin/pricing"
import { ENQUIRIES, KIND_LABEL } from "@/lib/admin/desk"
import { price } from "@/lib/format"
import { PageHead, Figures, Figure, Section, Blank } from "@/components/admin/parts"

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

  const unpriced = rows.filter((row) => !isSellable(currentPrice(row, state.prices)))
  const unshot = rows.filter((row) => !row.photographed)
  // The filed ones are real, sent through the site by somebody who used the
  // booking form rather than opening a chat. They count the same.
  const enquiries = [
    ...state.inbox.map((entry) => ({ id: entry.id, name: entry.name, area: entry.area.trim() || "Not given", kind: entry.kind, summary: entry.summary, hoursAgo: 0, at: entry.at })),
    ...ENQUIRIES,
  ]
  const open = enquiries.filter((enquiry) => (state.enquiries[enquiry.id] ?? "new") !== "closed")
  const answered = enquiries.length - open.length

  // Counted separately because they are not the same job. A part the client
  // priced in words has an answer already and needs a decision, not a figure.
  const inProse = unpriced.filter((row) => currentPrice(row, state.prices).priceNote)

  return (
    <>
      <PageHead
        title={`Good to see you, ${state.who?.split(" ")[0] ?? "there"}.`}
        lead="What is still open. The counter's own numbers, not the ones that look best."
      />

      <Figures>
        <Figure
          value={unpriced.length}
          label="parts cannot be sold"
          note={
            inProse.length > 0
              ? `${inProse.length} of them are priced in words rather than figures.`
              : "Every part has a price."
          }
          tone={unpriced.length > 0 ? "warn" : "ink"}
          href="/admin/prices?show=unpriced"
        />
        <Figure
          value={unshot.length}
          label="parts have no photograph"
          note="They show a placeholder on the shop, not a broken image."
          tone={unshot.length > 0 ? "warn" : "ink"}
          href="/admin/shots"
        />
        <Figure
          value={open.length}
          label="enquiries still open"
          note={answered > 0 ? `${answered} closed.` : "None closed yet."}
          tone={open.length > 0 ? "warn" : "ink"}
          href="/admin/enquiries"
        />
        <Figure
          value={rows.length - unpriced.length}
          label="parts ready to sell"
          note={`Out of ${rows.length} in the catalogue.`}
          tone="quiet"
          href="/admin/prices"
        />
      </Figures>

      <div className="grid gap-px bg-rule lg:grid-cols-2">
        <div className="bg-panel">
          <Section
            title="Waiting on a price"
            action={
              <Link href="/admin/prices?show=unpriced" className="callout hover:text-ink">
                All {unpriced.length}
              </Link>
            }
          >
            {unpriced.length === 0 ? (
              <p className="text-sm text-slate">
                Nothing outstanding. Every part in the catalogue carries a figure.
              </p>
            ) : (
              <ul className="border-t border-rule bg-paper">
                {unpriced.slice(0, 6).map((row) => {
                  const now = currentPrice(row, state.prices)
                  return (
                    <li key={row.slug} className="border-b border-rule px-4 py-3">
                      <Link href={`/admin/prices?q=${encodeURIComponent(row.ref)}`} className="block">
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
          </Section>
        </div>

        <div className="bg-panel">
          <Section
            title="Latest enquiries"
            action={
              <Link href="/admin/enquiries" className="callout hover:text-ink">
                All {enquiries.length}
              </Link>
            }
          >
            <ul className="border-t border-rule bg-paper">
              {enquiries.slice(0, 4).map((enquiry) => {
                const status = state.enquiries[enquiry.id] ?? "new"
                return (
                  <li key={enquiry.id} className="border-b border-rule px-4 py-3">
                    <Link href={`/admin/enquiries#${enquiry.id}`} className="block">
                      <span className="flex items-baseline justify-between gap-4">
                        <span className="text-sm font-medium text-ink">{enquiry.name}</span>
                        <span className="callout shrink-0">{KIND_LABEL[enquiry.kind]}</span>
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-slate">
                        {enquiry.summary}
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-baseline gap-x-3 font-mono text-[11px] text-mute">
                        <span>{enquiry.area}</span>
                        <span>{"at" in enquiry ? arrived(enquiry.at as number) : hours(enquiry.hoursAgo)}</span>
                        {status !== "new" && <span className="text-brass">{status}</span>}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Section>
        </div>
      </div>

      {state.log.length > 0 && (
        <Section title="Price changes, newest first">
          <ul className="border-t border-rule bg-paper">
            {state.log.slice(0, 8).map((entry) => (
              <li
                key={`${entry.slug}-${entry.at}`}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule px-4 py-3"
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
        </Section>
      )}
    </>
  )
}

/** Pure, unlike a relative time: the same timestamp always reads the same. */
function arrived(at: number) {
  return new Date(at).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

function hours(ago: number) {
  if (ago < 1) return "just now"
  if (ago < 24) return `${ago}h ago`
  const days = Math.round(ago / 24)
  return days === 1 ? "yesterday" : `${days} days ago`
}
