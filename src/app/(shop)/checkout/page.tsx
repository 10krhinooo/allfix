import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { basketCatalogue } from "@/lib/basket"
import { addressesFor } from "@/lib/account"
import { Breadcrumbs } from "@/components/ui"
import { Checkout } from "@/components/cart/Checkout"

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
}

/**
 * Checkout.
 *
 * Signing in is required here and not at the basket, which is the whole reason
 * the basket lives in the browser: somebody can fill one without an account and
 * is only asked who they are at the point where the shop needs to know where to
 * send it. `next` carries them back afterwards.
 */
export default async function CheckoutPage() {
  const desk = await readDesk()
  if (!desk) redirect("/sign-in?next=%2Fcheckout")

  return (
    <div className="shell max-w-5xl py-12">
      <Breadcrumbs
        trail={[{ href: "/", label: "Home" }, { href: "/cart", label: "Basket" }, { label: "Checkout" }]}
      />

      <h1 className="display-lg mt-5 font-display font-bold tracking-tight">Checkout</h1>
      <p className="mt-3 max-w-xl leading-relaxed text-slate">
        Signed in as {desk.name}.{" "}
        <Link href="/account" className="text-oxblood underline-offset-4 hover:underline">
          Your account
        </Link>
      </p>

      <div className="mt-10">
        <Checkout
          catalogue={basketCatalogue()}
          addresses={addressesFor(desk.email)}
          trade={desk.role === "TRADE"}
        />
      </div>
    </div>
  )
}
