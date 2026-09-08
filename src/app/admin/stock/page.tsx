import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Stock } from "@/components/admin/Stock"
import { readDesk } from "@/lib/admin/guard"
import { capabilities } from "@/lib/admin/roles"
import { readStock } from "@/lib/admin/stock-service"
import { sampleStock } from "@/lib/admin/sample"
import { count, setThreshold } from "@/app/admin/stock/actions"

export const metadata: Metadata = { title: "Stock" }

/**
 * Dynamic, because two people can be looking at this while one of them is
 * standing at the shelf. A cached count is wrong exactly when it is read.
 */
export const dynamic = "force-dynamic"

export default async function StockPage() {
  const desk = await readDesk()
  // notFound rather than a redirect, so a guessed URL does not confirm the
  // screen exists to somebody who may not have it.
  if (!desk || !capabilities(desk.role).stock) notFound()

  /*
   * Until the service is hosted a real read comes back with nothing to show, so
   * the screen falls back to stand-in figures and there is something to work
   * against. `null` and `[]` are kept apart deliberately: `null` is nobody could
   * ask, `[]` is the service answering that no part has been counted, and only
   * the first is replaced.
   *
   * The screen is told which it got. A shelf count is acted on, so a stand-in
   * figure passed off as the shop's own is the one thing here that could cost
   * somebody money, and saying so in a line at the top is what stops it.
   */
  const counts = await readStock()

  return (
    <Stock
      rows={counts ?? sampleStock()}
      live={counts !== null}
      owner={capabilities(desk.role).settings}
      onCount={count}
      onThreshold={setThreshold}
    />
  )
}
