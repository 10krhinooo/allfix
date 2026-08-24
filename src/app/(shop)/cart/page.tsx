import type { Metadata } from "next"
import Link from "next/link"
import { basketCatalogue } from "@/lib/basket"
import { Breadcrumbs } from "@/components/ui"
import { CartLines } from "@/components/cart/CartLines"

export const metadata: Metadata = {
  title: "Your basket",
  description: "The parts you are about to order from AllFix By Kipekee.",
  robots: { index: false, follow: true },
}

/**
 * The basket.
 *
 * The basket itself is in the browser, because a basket is not worth an account
 * and asking somebody to sign in before they can put a bracket in one loses the
 * sale. What the server sends is the lookup that turns the SKUs in it into
 * names and prices, so the 200 KB catalogue never reaches the bundle.
 */
export default function CartPage() {
  return (
    <div className="shell max-w-4xl py-12">
      <Breadcrumbs trail={[{ href: "/", label: "Home" }, { label: "Basket" }]} />

      <h1 className="display-lg mt-5 font-display font-bold tracking-tight">Your basket</h1>
      <p className="mt-3 max-w-xl leading-relaxed text-slate">
        Check the quantities, then place the order. We confirm the price and the delivery
        before anything is charged.
      </p>

      <div className="mt-10">
        <CartLines catalogue={basketCatalogue()}>
          <Link
            href="/checkout"
            className="bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
          >
            Go to checkout
          </Link>
          <Link
            href="/shop"
            className="border border-rule px-6 py-3 text-sm text-ink transition-colors hover:border-brass hover:text-brass"
          >
            Keep shopping
          </Link>
        </CartLines>
      </div>
    </div>
  )
}
