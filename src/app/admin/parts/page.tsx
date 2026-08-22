import { Suspense } from "react"
import type { Metadata } from "next"
import { deskRows, deskComponents, deskGroups } from "@/lib/admin/rows"
import { Worksheet } from "@/components/admin/Worksheet"

export const metadata: Metadata = { title: "Parts" }

/**
 * Suspense because the worksheet reads the query string: Today links here with
 * `?show=unpriced` from the day's figures, and a shared or reloaded link has to
 * open on the same view.
 */
export default function PartsPage() {
  const rows = deskRows()
  return (
    <Suspense>
      <Worksheet rows={rows} components={deskComponents(rows)} groups={deskGroups(rows)} />
    </Suspense>
  )
}
