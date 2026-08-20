"use client"

import { ENQUIRIES, KIND_LABEL } from "@/lib/admin/desk"
import type { EnquiryState } from "@/lib/admin/store"
import { useAdmin, setEnquiry } from "@/lib/admin/store"
import { SHOP, whatsapp } from "@/lib/format"
import { PageHead, Figures, Figure } from "@/components/admin/parts"

/**
 * The queue.
 *
 * Nothing here is real, and the page says so, because there is no enquiries
 * table yet: the storefront's quote, survey and trade forms compose a WhatsApp
 * message rather than posting anywhere. That is honest about a shop that
 * genuinely does its business on WhatsApp, and it is also why a screen like
 * this has nothing to show until those forms post as well as open a chat.
 *
 * The reply action stays a WhatsApp deep link even so. When the queue is real,
 * the record will be here and the conversation will still be on the customer's
 * phone, which is where they want it.
 */

const STATES: { value: EnquiryState; label: string }[] = [
  { value: "new", label: "New" },
  { value: "working", label: "Working on it" },
  { value: "quoted", label: "Quoted" },
  { value: "closed", label: "Closed" },
]

export function Enquiries() {
  const state = useAdmin()
  const statusOf = (id: string) => state.enquiries[id] ?? "new"

  const open = ENQUIRIES.filter((enquiry) => statusOf(enquiry.id) !== "closed")
  const surveys = ENQUIRIES.filter((enquiry) => enquiry.kind === "survey" && statusOf(enquiry.id) !== "closed")

  return (
    <>
      <PageHead
        title="Enquiries"
        lead="Quotes, site visits, trade accounts and parts, in the order they came in."
      >
        <p className="max-w-xs border-l-2 border-brass bg-brass-soft px-3 py-2 text-xs leading-relaxed">
          Invented, so the screen can be shown working. The shop&apos;s forms open WhatsApp today
          rather than posting anywhere.
        </p>
      </PageHead>

      <Figures>
        <Figure value={open.length} label="still open" tone={open.length ? "warn" : "ink"} />
        <Figure value={surveys.length} label="want a site visit" note="The jobs worth a survey." tone="quiet" />
        <Figure value={ENQUIRIES.length - open.length} label="closed" tone="quiet" />
      </Figures>

      <ul className="bg-paper">
        {ENQUIRIES.map((enquiry) => {
          const status = statusOf(enquiry.id)
          const closed = status === "closed"
          return (
            <li
              key={enquiry.id}
              id={enquiry.id}
              className={`scroll-mt-28 border-b border-rule px-5 py-5 sm:px-8 ${closed ? "opacity-55" : ""}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-semibold tracking-tight">{enquiry.name}</h2>
                  <p className="mt-1 flex flex-wrap items-baseline gap-x-3 font-mono text-[11px] text-mute">
                    <span>{enquiry.phone}</span>
                    <span>{enquiry.area}</span>
                    <span>{hours(enquiry.hoursAgo)}</span>
                    <span>{enquiry.id}</span>
                  </p>
                </div>
                <span className="callout shrink-0">{KIND_LABEL[enquiry.kind]}</span>
              </div>

              <p className="mt-3 text-sm font-medium text-ink">{enquiry.summary}</p>
              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate">{enquiry.detail}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {STATES.map((option) => {
                  const active = status === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setEnquiry(enquiry.id, option.value)}
                      className={`rounded-sm border px-3 py-1.5 text-xs transition-colors ${
                        active
                          ? "border-ink bg-ink text-paper"
                          : "border-rule text-slate hover:border-ink hover:text-ink"
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}

                <a
                  href={whatsapp(
                    `Hello ${enquiry.name.split(" ")[0]}, this is ${SHOP.name} on Njugu Lane about your enquiry.`,
                  )}
                  rel="noopener noreferrer"
                  className="ml-auto rounded-sm bg-[#1f8f4e] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#187a41]"
                >
                  Reply on WhatsApp
                </a>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}

function hours(ago: number) {
  if (ago < 1) return "just now"
  if (ago < 24) return `${ago}h ago`
  const days = Math.round(ago / 24)
  return days === 1 ? "yesterday" : `${days} days ago`
}
