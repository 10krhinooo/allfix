import { redirect } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { capabilities, landing } from "@/lib/admin/roles"
import { readSummary } from "@/lib/admin/reports-service"
import { sampleSummary } from "@/lib/admin/sample"
import { Dashboard } from "@/components/admin/Dashboard"

/**
 * What the shop did, on the screen somebody opens first.
 *
 * This used to count the catalogue: how many parts are unpriced, how many are
 * unphotographed. That is real work and it is not what the person who owns the
 * shop wants at eight in the morning, which is what came in yesterday and what
 * is running out. The catalogue counts moved to the worksheet, which is where
 * somebody acts on them.
 *
 * Never cached. A figure about this morning that was worked out last night is
 * worse than no figure, because nothing on the screen says how old it is.
 */
export const dynamic = "force-dynamic"

export default async function CounterPage() {
  const desk = await readDesk()
  // Not everybody in the console is here for the shop's takings. A platform
  // keeper belongs on their own screen, and this is a redirect rather than a
  // `notFound` because the console's front door is not a secret: they simply
  // have a different one.
  if (desk && !capabilities(desk.role).takings) redirect(landing(desk.role))

  const summary = await readSummary()

  // Nothing is hosting the service yet, so a real read comes back empty and the
  // screen would draw its "no order service" state at everybody who opens it.
  // The moment `ALLFIX_API_URL` points at a running service this stops being
  // reached, and removing it is deleting `sample.ts` and this `??`.
  return <Dashboard summary={summary ?? sampleSummary()} name={desk?.name ?? "there"} />
}
