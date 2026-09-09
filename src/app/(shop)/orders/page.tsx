import type { Metadata } from "next"
import { Breadcrumbs } from "@/components/ui"
import { FindOrder } from "@/components/orders/FindOrder"
import { SHOP } from "@/lib/format"

export const metadata: Metadata = {
  title: "Find your order",
  description:
    "Look up an order placed at AllFix By Kipekee with the reference and the phone number it was placed on.",
  alternates: { canonical: "/orders" },
  // Nothing here is worth indexing and every URL under it is somebody's order.
  robots: { index: false, follow: true },
}

/**
 * Where a reference is worth having.
 *
 * The checkout ends by telling somebody to keep their reference, and until this
 * screen there was nowhere to use one. A customer who had not registered was
 * handed a number and left with the telephone as the whole of the answer, which
 * made the reference a thing the shop asked them to remember for the shop's
 * convenience rather than something they could act on.
 *
 * Signed-in customers have `/account/orders` and do not need this. It exists for
 * the checkout's guest path, which is most of the orders this shop takes.
 */
export default function FindOrderPage() {
  return (
    <div className="shell relative z-10 py-14">
      <Breadcrumbs trail={[{ href: "/", label: "Home" }, { label: "Find your order" }]} />

      <h1 className="display-lg mt-6 max-w-2xl">Find your order</h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-slate">
        The reference is the AF number we gave you when you ordered. If you have lost it, ring{" "}
        {SHOP.phone} and we will find the order from your number.
      </p>

      <div className="mt-10">
        <FindOrder />
      </div>
    </div>
  )
}
