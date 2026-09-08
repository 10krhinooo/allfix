import { readDesk } from "@/lib/admin/guard"
import { readSummary } from "@/lib/admin/reports-service"
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
  const [desk, summary] = await Promise.all([readDesk(), readSummary()])

  return <Dashboard summary={summary} name={desk?.name ?? "there"} />
}
