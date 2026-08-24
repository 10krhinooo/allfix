import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { addressesFor, railsFor } from "@/lib/account"
import { PageHead } from "@/components/admin/parts"
import { Addresses } from "@/components/account/Addresses"

export const metadata: Metadata = {
  title: "Your addresses",
  robots: { index: false, follow: false },
}

export default async function AddressesPage() {
  const desk = await readDesk()
  if (!desk) redirect("/sign-in?next=%2Faccount%2Faddresses")

  // The seeded records are rendered on the server so the list is there on the
  // first paint, and the store takes over from them at the first edit.
  const seed = { addresses: addressesFor(desk.email), rails: railsFor(desk.email) }

  return (
    <>
      <PageHead
        title="Your addresses"
        lead="Where we deliver to. The default is the one checkout will reach for."
      />
      <Addresses seed={seed} />
    </>
  )
}
