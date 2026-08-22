import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { YourDetails } from "@/components/admin/YourDetails"

export const metadata: Metadata = { title: "Your details", robots: { index: false, follow: false } }

/** The same screen the counter gets, reached from the same place on the rail. */
export default async function TradeProfilePage() {
  const desk = await readDesk()
  if (!desk) redirect("/sign-in?next=%2Ftrade%2Faccount%2Fprofile")
  return <YourDetails desk={desk} />
}
