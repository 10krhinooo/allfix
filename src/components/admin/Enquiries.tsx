"use client"

import { KIND_LABEL } from "@/lib/admin/desk"
import { deskEnquiries } from "@/lib/admin/rows"
import type { EnquiryState } from "@/lib/admin/store"
import { useAdmin, setEnquiry } from "@/lib/admin/store"
import { SHOP, whatsapp, arrived, hours } from "@/lib/format"
import { PageHead, Figures, Figure, Note, Choices } from "@/components/admin/parts"

/**
 * The queue.
 *
 * Two sorts of thing land here. The seeded ones are invented, so the screen can
 * be shown with work on it. Anything marked "through the site" is real: the
 * booking form and the configurator now file an enquiry as well as offering
 * WhatsApp, and this is where it arrives.
 *
 * That split is the argument for the second path, and it is visible on purpose.
 * An enquiry sent by WhatsApp never reaches this screen at all, because it only
 * exists in one phone's chat history. Whoever is at the counter cannot pick it
 * up and nothing counts it.
 *
 * The reply action stays a WhatsApp deep link regardless. The record belongs
 * here; the conversation belongs on the customer's phone, which is where they
 * want it.
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

  const all = deskEnquiries(state.inbox)
  const filed = all.filter((enquiry) => enquiry.reference)
  const open = all.filter((enquiry) => statusOf(enquiry.id) !== "closed")
  const surveys = all.filter((enquiry) => enquiry.kind === "survey" && statusOf(enquiry.id) !== "closed")

  return (
    <>
      <PageHead
        title="Enquiries"
        lead="Quotes, site visits, trade accounts and parts, in the order they came in."
      >
        <Note>
          {filed.length > 0
            ? `${filed.length} sent through the site. The rest are invented, so the screen can be shown with work on it.`
            : "Invented, so the screen can be shown with work on it. Book a visit on the shop and it appears here."}
        </Note>
      </PageHead>

      <Figures>
        <Figure value={open.length} label="still open" tone={open.length ? "warn" : "ink"} />
        <Figure value={surveys.length} label="want a site visit" note="The jobs worth a survey." tone="quiet" />
        <Figure
          value={state.ready ? filed.length : "\u2014"}
          label="came through the site"
          note="A WhatsApp enquiry never reaches this screen."
          tone="quiet"
        />
        <Figure value={all.length - open.length} label="closed" tone="quiet" />
      </Figures>

      <ul className="bg-paper">
        {all.map((enquiry) => {
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
                    <span>{"at" in enquiry ? arrived((enquiry as { at: number }).at) : hours(enquiry.hoursAgo)}</span>
                    {/* The seeded ones carry a readable id. A filed one's is a
                        storage key, and its reference is already on the badge
                        above, so showing it here would be noise the counter has
                        no use for. */}
                    {!("at" in enquiry) && <span>{enquiry.id}</span>}
                  </p>
                </div>
                <span className="flex shrink-0 items-baseline gap-3">
                  {"reference" in enquiry && (
                    <span className="rounded-sm bg-brass-soft px-2 py-0.5 font-mono text-[11px] text-ink">
                      {(enquiry as { reference: string }).reference} through the site
                    </span>
                  )}
                  <span className="callout">{KIND_LABEL[enquiry.kind]}</span>
                </span>
              </div>

              <p className="mt-3 text-sm font-medium text-ink">{enquiry.summary}</p>
              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate">{enquiry.detail}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Choices
                  label={`Status of the enquiry from ${enquiry.name}`}
                  options={STATES}
                  value={status}
                  onChange={(next) => setEnquiry(enquiry.id, next)}
                />

                <a
                  href={whatsapp(
                    `Hello ${enquiry.name.split(" ")[0]}, this is ${SHOP.name} on Njugu Lane about your enquiry.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto rounded-sm bg-[#1f8f4e] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#187a41]"
                >
                  Reply on WhatsApp
                  <span className="sr-only"> to {enquiry.name}</span>
                </a>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}


