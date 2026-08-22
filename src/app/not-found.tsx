import type { Metadata } from "next"
import Link from "next/link"
import { Fault } from "@/components/Fault"
import { SHOP } from "@/lib/format"

/**
 * Not on the rail.
 *
 * At the root rather than inside `(shop)`, so it also answers for addresses
 * that match no route group at all. It carries its own way back instead of the
 * storefront's header, because half the traffic that lands here arrives on a
 * link from the old WooCommerce site and has never seen the navigation.
 */
export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <Fault
      code="404"
      art="gap"
      title="That page is not on the rail."
      body="The address points at something the shop does not have, or does not have any more. Every part is still here, and the counter can find it by SKU faster than any search."
    >
      <Link
        href="/shop"
        className="rounded-sm bg-oxblood px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
      >
        All parts
      </Link>
      <Link
        href="/"
        className="rounded-sm border border-ink px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
      >
        The shop
      </Link>
      <a href={`tel:${SHOP.phoneIntl}`} className="font-mono text-sm text-slate hover:text-ink">
        or call {SHOP.phone}
      </a>
    </Fault>
  )
}
