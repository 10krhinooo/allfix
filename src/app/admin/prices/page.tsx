import { Suspense } from "react"
import { deskRows, deskComponents, deskGroups } from "@/lib/admin/rows"
import { Prices } from "@/components/admin/Prices"

/**
 * Suspense because the worksheet reads the query string: the counter links here
 * with `?show=unpriced` from the day's figures, and a shared or reloaded link
 * has to open on the same view.
 */
export default function PricesPage() {
  const rows = deskRows()
  return (
    <Suspense>
      <Prices rows={rows} components={deskComponents(rows)} groups={deskGroups(rows)} />
    </Suspense>
  )
}
