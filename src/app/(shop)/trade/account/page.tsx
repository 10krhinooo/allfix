import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { Breadcrumbs } from "@/components/ui"
import { SHOP, whatsapp } from "@/lib/format"

export const metadata: Metadata = {
  title: "Your trade account",
  robots: { index: false, follow: false },
}

/**
 * The trade desk.
 *
 * Deliberately not the console. `ROLE_NOTE.TRADE` says a trade account buys at
 * a tier and has no console access, and this screen is what that sentence looks
 * like: an account, a rate, and a way back into the shop. It keeps the
 * storefront chrome because a trade customer is still a customer, and should be
 * able to browse from here.
 *
 * It is small on purpose. Ordering, tier pricing and proforma invoices are
 * phase 8 in PROJECT_PLAN.md and need the backend, so this shows what is true
 * today rather than mocking up a portal that cannot transact.
 */
export default async function TradeAccountPage() {
  const desk = await readDesk()
  if (!desk) redirect("/sign-in?next=%2Ftrade%2Faccount")

  return (
    <>
      <section className="drafting border-b border-rule">
        <div className="shell py-14 sm:py-20">
          <Breadcrumbs trail={[{ href: "/", label: "Home" }, { href: "/trade", label: "Trade" }, { label: "Your account" }]} />
          <h1 className="display-xl mt-5 max-w-[18ch] font-display font-bold tracking-tight">
            {desk.name}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate">
            Your trade account is open. Everything in the catalogue is 20% off the list price
            you see on the shop, and the counter knows you by this name.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-sm bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
            >
              Browse the catalogue
            </Link>
            <a
              href={`tel:${SHOP.phoneIntl}`}
              className="font-mono text-sm text-oxblood hover:underline"
            >
              {SHOP.phone}
            </a>
          </div>
        </div>
      </section>

      <section className="border-b border-rule bg-panel">
        <div className="shell py-16">
          <p className="callout">Your account</p>
          <h2 className="display-lg mt-3 font-display font-bold tracking-tight">
            What we hold today
          </h2>
          <dl className="auto-grid mt-8 bg-rule" style={{ ["--min" as string]: "17rem" }}>
            <div className="bg-panel p-6">
              <dt className="callout">Signed in as</dt>
              <dd className="mt-2 font-mono text-sm text-ink">{desk.email}</dd>
            </div>
            <div className="bg-panel p-6">
              <dt className="callout">Rate</dt>
              <dd className="mt-2 font-mono text-sm text-ink">20% off list</dd>
            </div>
            <div className="bg-panel p-6">
              <dt className="callout">Settlement</dt>
              <dd className="mt-2 font-mono text-sm text-ink">Proforma, on request</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="shell py-16">
        <p className="callout">Not yet</p>
        <h2 className="display-lg mt-3 max-w-[20ch] font-display font-bold tracking-tight">
          Ordering online is still being built.
        </h2>
        <p className="mt-5 max-w-xl leading-relaxed text-slate">
          Trade orders go through the counter for now: send the list and we price it, raise a
          proforma and hold the stock. Bulk entry and self-service proformas arrive with the
          accounts backend, and this page grows into them.
        </p>
        <div className="mt-9">
          <a
            href={whatsapp("Trade order. Account: " + desk.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-sm bg-[#1f8f4e] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#187a41]"
          >
            Send an order on WhatsApp
          </a>
        </div>
      </section>
    </>
  )
}
