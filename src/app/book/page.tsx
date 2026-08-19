import type { Metadata } from "next"
import { BookForm } from "@/components/book/BookForm"
import { Breadcrumbs } from "@/components/ui"
import { SHOP } from "@/lib/format"

export const metadata: Metadata = {
  title: "Book a visit",
  description:
    "Book a measure-up, a motorised site survey, an installation or a consultation with AllFix. " +
    "We come to you across Kenya, or you can call the counter on Njugu Lane.",
}

/**
 * The booking route.
 *
 * The plan's site-visit and measure-up booking, standing in on WhatsApp until
 * the enquiry pipeline exists. The form composes a message rather than saving a
 * date, so what the shop receives is a filled-in request it confirms, not a slot
 * the site cannot honour.
 */
export default function Book() {
  return (
    <div className="shell py-12">
      <Breadcrumbs trail={[{ href: "/", label: "Home" }, { label: "Book a visit" }]} />

      <h1 className="display-lg mt-5 max-w-[20ch] font-display font-bold tracking-tight">
        Book a measure-up or a survey
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-slate">
        Tell us where you are and what you need, and we set a time to come and measure. Motorised and
        full curtain jobs get a site survey first, so the quote is right before anything is cut.
      </p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:items-start">
        <BookForm />

        <aside className="border border-rule p-6">
          <p className="callout">Rather just call</p>
          <a href={`tel:${SHOP.phoneIntl}`} className="mt-2 block font-mono text-lg text-oxblood">
            {SHOP.phone}
          </a>
          <p className="mt-4 leading-relaxed text-slate">
            Or come to the counter. The full range is on the shelf, and we can book your visit across
            it.
          </p>
          <address className="mt-4 space-y-1 text-sm not-italic text-slate">
            <p className="font-display font-semibold tracking-tight text-ink">{SHOP.name}</p>
            <p>{SHOP.street}</p>
            <p>{SHOP.area}</p>
          </address>
        </aside>
      </div>
    </div>
  )
}
