import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { addressesFor, railsFor } from "@/lib/account"
import { YourDetails } from "@/components/account/YourDetails"

export const metadata: Metadata = { title: "Your details", robots: { index: false, follow: false } }

/**
 * The shopper's own version of this screen, not the counter's.
 *
 * The console's answers "what does my role let me do", which is a question
 * somebody behind the counter has and a customer does not, and it is honest
 * about the session on the screen where staff would look for "sign out
 * everywhere". Neither belongs here.
 */
export default async function AccountProfilePage() {
  const desk = await readDesk()
  if (!desk) redirect("/sign-in?next=%2Faccount%2Fprofile")

  // The whole book, so saving a detail cannot mark it seeded and empty and take
  // the addresses with it.
  const seed = { addresses: addressesFor(desk.email), rails: railsFor(desk.email) }
  const home = seed.addresses.find((one) => one.isDefault)

  return (
    <YourDetails
      seed={seed}
      email={desk.email}
      name={desk.name}
      phone={home?.phone ?? ""}
    />
  )
}
