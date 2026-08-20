import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumbs } from "@/components/ui"
import { SHOP } from "@/lib/format"

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The terms you buy under at AllFix By Kipekee: prices, quotes, payment, delivery, returns and " +
    "our fitting services. Curtain hardware over the counter on Njugu Lane and across Kenya.",
}

const UPDATED = "19 August 2026"

/**
 * The terms page, written to the shop as it works today: counter sales and
 * WhatsApp quotes, not an online checkout. It is explicit that a price shown is
 * confirmed before an order is binding, which is the whole reason the old store
 * failed and the reason a null price never renders as a number here.
 */
export default function Terms() {
  return (
    <div className="shell py-12">
      <Breadcrumbs trail={[{ href: "/", label: "Home" }, { label: "Terms" }]} />

      <h1 className="display-lg mt-5 font-display font-bold tracking-tight">Terms</h1>
      <p className="mt-2 callout">Last updated {UPDATED}</p>

      <div className="mt-8 max-w-2xl space-y-8 leading-relaxed text-slate">
        <p>
          These terms cover buying from {SHOP.name}, on {SHOP.street}, {SHOP.area}, and through our
          WhatsApp and phone line. Using the shop means you accept them.
        </p>

        <section>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
            Prices and quotes
          </h2>
          <p className="mt-3">
            Prices are in Kenyan Shillings. Some are quoted per metre, per pair, per box or per
            length, and the site says which. Some parts are priced on request rather than shown, and
            we quote those when you ask. A price shown here is a guide: we confirm the figure, the cut
            lengths and stock before an order is final. Quotes are valid for 14 days unless we say
            otherwise.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">Ordering</h2>
          <p className="mt-3">
            You order over the counter, by phone, or over WhatsApp from a quote we have confirmed.
            An order is placed when we confirm it and you agree the price, not when a page is
            submitted. We may decline or cancel an order if an item is out of stock or a price was
            shown in error, and we will tell you and refund anything already paid.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">Payment</h2>
          <p className="mt-3">
            We take M-Pesa, card and cash at the counter. Trade accounts may settle by bank transfer
            against a proforma invoice. Goods remain ours until they are paid for in full.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">Delivery</h2>
          <p className="mt-3">
            We deliver across Kenya at county rates quoted before you pay, or you can collect at the
            counter. Delivery times are estimates and depend on the courier. Risk passes to you on
            delivery or collection.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
            Returns and exchanges
          </h2>
          <p className="mt-3">
            Bring a faulty or wrong item back within 7 days, unused and with proof of purchase, and we
            will replace it or refund it. Track and rod cut to your length, and curtains made to your
            measurement, are made to order and cannot be returned unless they are faulty. This does
            not affect your rights under Kenyan consumer law.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
            Fitting and services
          </h2>
          <p className="mt-3">
            Installation, assembly, curtaining, motorisation and consultation are quoted after a
            measure-up or a site survey. A survey figure is an estimate until the work is agreed.
            Motorised runs are sized on survey. Booking a visit is a request for a time, which we
            confirm with you.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
            Trade accounts
          </h2>
          <p className="mt-3">
            Trade pricing is for approved accounts and is not to be passed on as our retail price. We
            may set or change a tier, or close an account, at our discretion.{" "}
            <Link href="/trade" className="text-oxblood underline-offset-4 hover:underline">
              See the trade page
            </Link>{" "}
            to apply.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
            Liability and changes
          </h2>
          <p className="mt-3">
            We stand behind what we sell and fit, but we are not liable for loss beyond the value of
            the goods and work, so far as the law allows. We may update these terms, and the version
            on this page is the one that applies.
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
          <Link href="/privacy" className="text-oxblood underline-offset-4 hover:underline">
            privacy policy
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
