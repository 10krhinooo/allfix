import type { Metadata } from "next"
import { requireConsole } from "@/lib/admin/guard"
import { YourDetails } from "@/components/admin/YourDetails"

export const metadata: Metadata = { title: "Your details" }

/**
 * Reached from the rail's own name, which is where somebody looks for it.
 * Guarded like every other console screen rather than trusted because it is
 * only about the person already signed in: the guard is what establishes that
 * there is one.
 */
export default async function AdminProfilePage() {
  const desk = await requireConsole()
  return <YourDetails desk={desk} />
}
