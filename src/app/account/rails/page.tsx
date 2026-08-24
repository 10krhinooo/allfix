import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { addressesFor, railsFor } from "@/lib/account"
import { PageHead } from "@/components/admin/parts"
import { Rails } from "@/components/account/Rails"

export const metadata: Metadata = {
  title: "Your saved rails",
  robots: { index: false, follow: false },
}

export default async function RailsPage() {
  const desk = await readDesk()
  if (!desk) redirect("/sign-in?next=%2Faccount%2Frails")

  const seed = { addresses: addressesFor(desk.email), rails: railsFor(desk.email) }

  return (
    <>
      <PageHead
        title="Your saved rails"
        lead="Windows you have measured. Open one and the parts list is worked out again at today's prices."
      />
      <Rails seed={seed} />
    </>
  )
}
