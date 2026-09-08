import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { capabilities } from "@/lib/admin/roles"
import { deskRows, deskComponents, deskGroups } from "@/lib/admin/rows"
import { Worksheet } from "@/components/admin/Worksheet"

export const metadata: Metadata = { title: "Parts" }

/**
 * Suspense because the worksheet reads the query string: Today links here with
 * `?show=unpriced` from the day's figures, and a shared or reloaded link has to
 * open on the same view.
 *
 * The capability is checked here and not only in the proxy, which gates on
 * `console` alone. That was enough while everybody holding `console` was
 * counter staff, and stopped being enough the moment a role existed that has
 * the console without the counter: this screen carries every price the shop
 * charges, and whoever keeps the service running has no business reading them.
 * The screens that edit a part checked already; the one that lists them did not.
 */
export default async function PartsPage() {
  const desk = await readDesk()
  // notFound rather than a redirect, as everywhere else on this rail, so a
  // guessed URL does not confirm the screen exists.
  if (!desk || !capabilities(desk.role).prices) notFound()

  const rows = await deskRows()
  return (
    <Suspense>
      <Worksheet rows={rows} components={await deskComponents(rows)} groups={deskGroups(rows)} />
    </Suspense>
  )
}
