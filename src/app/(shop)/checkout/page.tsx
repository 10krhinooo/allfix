import type { Metadata } from "next"
import Link from "next/link"
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
 * Checkout, with or without an account.
 *
 * No sign in required, which is the whole reason the basket lives in the
 * browser: somebody who has found the part, checked it fits their rail and put
 * it in a basket has already done the hard part, and inventing a password is
 * where they leave. The counter has never asked a walk-in to register either.
 *
 * Signing in is offered rather than demanded, because it genuinely helps: a
 * saved address to pick from, and the order kept somewhere they can find it.
 */
export default async function CheckoutPage() {
  const desk = await readDesk()

  return (
    <div className="shell max-w-5xl py-12">
      <Breadcrumbs
        trail={[{ href: "/", label: "Home" }, { href: "/cart", label: "Basket" }, { label: "Checkout" }]}
      />

      <h1 className="display-lg mt-5 font-display font-bold tracking-tight">Checkout</h1>
      {desk ? (
        <p className="mt-3 max-w-xl leading-relaxed text-slate">
          Signed in as {desk.name}.{" "}
          <Link href="/account" className="text-oxblood underline underline-offset-4">
            Your account
          </Link>
        </p>
      ) : (
        <p className="mt-3 max-w-xl leading-relaxed text-slate">
          Tell us where it goes and we will take it from there. Or{" "}
          <Link
            href="/sign-in?next=%2Fcheckout"
            className="text-oxblood underline underline-offset-4"
          >
            sign in
          </Link>{" "}
          to use a saved address and keep the order on your account.
        </p>
      )}

      <div className="mt-10">
        <Checkout
          catalogue={basketCatalogue()}
          addresses={desk ? addressesFor(desk.email) : []}
          trade={desk?.role === "TRADE"}
          signedIn={Boolean(desk)}
        />
      </div>
    </div>
  )
}
