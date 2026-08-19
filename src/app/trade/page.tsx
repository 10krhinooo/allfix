import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumbs, JsonLd, WhatsAppIcon } from "@/components/ui"
import { skuCount, systems } from "@/lib/catalogue"
import { SHOP, whatsapp } from "@/lib/format"

export const metadata: Metadata = {
  title: "Trade accounts",
  description:
    "Wholesale curtain hardware for fundis, curtain makers and fit-out contractors. 20% off list, " +
    "bulk quantity entry and proforma invoices for bank transfer. Open a trade account with AllFix " +
    "on Njugu Lane, Nairobi.",
}

/**
 * The trade proposition.
 *
 * The header strip already advertises "wholesale 20% off"; this is the page it
 * points at. Applications hand off to WhatsApp rather than a form, because trade
 * accounts are approved by the shop against a KRA PIN and a business name, and
 * the account backend that would hold a tier and a proforma does not exist yet.
 * When it lands, the application becomes a real form and this copy stays true.
 */

const WHO = [
  ["Fundis and fitters", "Buy the run and the fittings that match it, without pricing each job at retail."],
  ["Curtain makers", "Track, runners and heading tape by the box, ready when the fabric is."],
  ["Fit-out contractors", "One counter for a whole site, with a proforma your accounts team can settle."],
  ["Interior designers", "Specify from the full range and hand the ordering to us."],
]

const BENEFITS = [
  ["20% off list", "The trade rate on every SKU, not a coupon on a few lines."],
  ["Tier pricing", "The more you move, the better the rate. Set against your account, not the till."],
  ["Bulk quantity entry", "Order 40 runners and 12 brackets in one go, without opening two product pages."],
  ["Proforma invoices", "Settle by bank transfer against a proforma instead of paying at checkout."],
  ["Priority at the counter", "Your regulars pulled and packed while you wait on Njugu Lane."],
  ["Delivered countrywide", "To the site or the workshop, with county rates and a pickup option."],
]

const APPLY = whatsapp(
  "Hello AllFix, I would like to open a trade account. My business name and trade are:",
)

const schema = {
  "@context": "https://schema.org",
  "@type": "Offer",
  name: "AllFix trade account",
  description: "Wholesale pricing, 20% off list, for curtain-hardware trade customers in Kenya.",
  category: "Wholesale",
  areaServed: "Kenya",
  seller: { "@type": "HardwareStore", name: SHOP.name },
}

export default function Trade() {
  return (
    <>
      <JsonLd schema={schema} />

      {/* ------------------------------------------------------------ hero */}
      <section className="bg-band text-white">
        <div className="shell py-14 sm:py-20">
          <div className="[&_*]:text-white/80">
            <Breadcrumbs trail={[{ href: "/", label: "Home" }, { label: "Trade" }]} />
          </div>

          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-white/60">
            Wholesale
          </p>
          <h1 className="display-xl mt-3 max-w-[16ch] font-display font-bold tracking-tight">
            20% off list, on every part
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">
            A trade account for fundis, curtain makers and fit-out contractors: the wholesale rate
            across all {skuCount} SKUs, bulk entry, and a proforma invoice you settle by bank
            transfer.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href={APPLY}
              className="inline-flex items-center gap-2 rounded-sm bg-white px-6 py-3.5 text-sm font-medium text-band transition-colors hover:bg-white/90"
            >
              <WhatsAppIcon /> Open a trade account
            </a>
            <a href={`tel:${SHOP.phoneIntl}`} className="font-mono text-sm text-white hover:underline">
              or call {SHOP.phone}
            </a>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- benefits */}
      <section className="shell py-16">
        <h2 className="display-lg font-display font-bold tracking-tight">What the account gives you</h2>
        <ul className="auto-grid flush mt-8 bg-paper" style={{ ["--min" as string]: "19rem" }}>
          {BENEFITS.map(([title, line]) => (
            <li key={title} className="bg-paper p-6">
              <p className="font-display font-semibold tracking-tight">{title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate">{line}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* -------------------------------------------------------------- who */}
      <section className="border-y border-rule bg-panel">
        <div className="shell py-16">
          <p className="callout">Who it is for</p>
          <h2 className="display-lg mt-3 font-display font-bold tracking-tight">
            Built for the people who buy in quantity
          </h2>

          <ul className="auto-grid mt-8 bg-rule" style={{ ["--min" as string]: "17rem" }}>
            {WHO.map(([title, line]) => (
              <li key={title} className="bg-panel p-6">
                <p className="font-display font-semibold tracking-tight">{title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate">{line}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------ apply */}
      <section className="shell py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="callout">How to open one</p>
            <h2 className="display-lg mt-3 font-display font-bold tracking-tight">
              Three steps, no paperwork to post
            </h2>

            <ol className="mt-7 space-y-6">
              {[
                ["Send your details", "Message us your business name, trade and KRA PIN. A quick call is enough for a small workshop."],
                ["We approve the account", "We confirm the trade rate and, on volume, your pricing tier. Same day in most cases."],
                ["Order at trade prices", "Buy at the counter, by phone or delivered, with a proforma when you need to pay by transfer."],
              ].map(([title, line], index) => (
                <li key={title} className="flex gap-4">
                  <span className="mt-0.5 font-mono text-sm text-brass">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block font-display font-semibold tracking-tight">{title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-slate">{line}</span>
                  </span>
                </li>
              ))}
            </ol>

            <a
              href={APPLY}
              className="mt-8 inline-flex items-center gap-2 rounded-sm bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
            >
              <WhatsAppIcon /> Apply on WhatsApp
            </a>
          </div>

          <div className="border border-rule p-7">
            <p className="callout">While you are here</p>
            <p className="mt-3 leading-relaxed text-slate">
              Trade or retail, the range is the same. See what a rail takes before you order, or
              browse the full catalogue by system.
            </p>

            <div className="mt-6 space-y-3">
              <Link
                href="/build"
                className="flex items-center justify-between border border-rule px-5 py-4 transition-colors hover:bg-brass-soft"
              >
                <span className="font-display font-semibold tracking-tight">Build a rail</span>
                <span className="callout">Parts list in one step</span>
              </Link>
              <Link
                href="/systems"
                className="flex items-center justify-between border border-rule px-5 py-4 transition-colors hover:bg-brass-soft"
              >
                <span className="font-display font-semibold tracking-tight">Browse {systems.length} systems</span>
                <span className="callout">By rail profile</span>
              </Link>
              <Link
                href="/shop"
                className="flex items-center justify-between border border-rule px-5 py-4 transition-colors hover:bg-brass-soft"
              >
                <span className="font-display font-semibold tracking-tight">All {skuCount} parts</span>
                <span className="callout">Faceted shop</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
