import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Stock } from "@/components/admin/Stock"
import { readDesk } from "@/lib/admin/guard"
import { capabilities } from "@/lib/admin/roles"
import { readStock } from "@/lib/admin/stock-service"
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

  const rows = await readStock()

  return (
    <Stock
      rows={rows}
      owner={capabilities(desk.role).settings}
      onCount={count}
      onThreshold={setThreshold}
    />
  )
}
