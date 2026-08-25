import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumbs } from "@/components/ui"
import { SHOP } from "@/lib/format"

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How AllFix By Kipekee handles the information you share when you enquire, order or book a " +
    "visit. What we collect, how we use it, and your rights under Kenya's Data Protection Act.",
}

const UPDATED = "19 August 2026"

/**
 * The privacy page. Plain language on purpose: the shop takes a name, a phone
 * number and a delivery address to fulfil an order, and little else, so the
 * policy says exactly that rather than hiding it in boilerplate.
 */
export default function Privacy() {
  return (
    <div className="shell py-12">
      <Breadcrumbs trail={[{ href: "/", label: "Home" }, { label: "Privacy" }]} />

      <h1 className="display-lg mt-5 font-display font-bold tracking-tight">Privacy</h1>
      <p className="mt-2 callout">Last updated {UPDATED}</p>

      <div className="mt-8 max-w-2xl space-y-8 leading-relaxed text-slate">
        <p>
          This policy covers {SHOP.name}, a curtain-hardware shop on {SHOP.street}, {SHOP.area}. It
          explains what we do with the information you share when you enquire, place an order or book
          a visit. We keep it short because we collect little.
        </p>

        <section>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
            What we collect
          </h2>
          <ul className="mt-3 space-y-2">
            <li>Your name and phone number, when you contact us or place an order.</li>
            <li>A delivery address, when you ask us to deliver or come and fit.</li>
            <li>The details of what you are after: the window, the parts, the fabric.</li>
            <li>The messages you send us, including on WhatsApp.</li>
          </ul>
          <p className="mt-3">
            We do not run accounts or take card details on this site. When online ordering and
            payment are added, this policy will be updated before they go live.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
            How we use it
          </h2>
          <p className="mt-3">
            To answer your enquiry, prepare a quote, fulfil and deliver an order, arrange a fitting or
            survey, and contact you about any of these. We do not use it for anything else, and we do
            not sell it.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
            Who we share it with
          </h2>
          <p className="mt-3">
            Only the people needed to complete your order: a courier or matatu parcel service to
            deliver, and a payment provider (such as M-Pesa) when you pay. Messages you send over
            WhatsApp pass through WhatsApp and are subject to its own terms.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
            This website
          </h2>
          <p className="mt-3">
            The site stores one thing in your browser: whether you chose the light or dark theme. It
            stays on your device and is not sent to us. There is no advertising or cross-site
            tracking.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">Your rights</h2>
          <p className="mt-3">
            Under Kenya&apos;s Data Protection Act, 2019, you can ask us what we hold about you, ask
            us to correct it, or ask us to delete it. Call or message us and we will sort it out.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">Contact us</h2>
          <p className="mt-3">
            {SHOP.name}, {SHOP.street}, {SHOP.area}.{" "}
            <a href={`tel:${SHOP.phoneIntl}`} className="font-mono text-oxblood hover:underline">
              {SHOP.phone}
            </a>
            .
          </p>
        </section>

        <p className="text-sm">
          See also our{" "}
          <Link href="/terms" className="text-oxblood underline underline-offset-4">
            terms
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
