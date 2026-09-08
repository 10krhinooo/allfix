import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Orders } from "@/components/admin/Orders"
import { TakeOrderForm } from "@/components/admin/TakeOrderForm"
import { readDesk } from "@/lib/admin/guard"
import { capabilities } from "@/lib/admin/roles"
import { readOrders } from "@/lib/admin/orders-service"
import { sampleOrders } from "@/lib/admin/sample"
import { orderable } from "@/lib/admin/rows"
import { move, take } from "@/app/admin/orders/actions"

export const metadata: Metadata = { title: "Orders" }

/**
 * Dynamic, because a counter refreshes this to see what has come in and a
 * cached queue is wrong exactly when somebody is looking at it.
 */
export const dynamic = "force-dynamic"

export default async function OrdersPage() {
  const desk = await readDesk()
  // notFound rather than a redirect, so a guessed URL does not confirm the
  // screen exists to somebody who may not have it.
  if (!desk || !capabilities(desk.role).orders) notFound()

  // As on the shelf: `null` is nobody could ask and gets stand-ins, `[]` is the
  // service saying there is nothing to pack and is left alone. The screen is
  // told which, because a stand-in order that reads as real is one somebody
  // tries to pack.
  const queue = await readOrders()

  return (
    <>
      <Orders orders={queue ?? sampleOrders()} live={queue !== null} onMove={move} />
      <div className="mt-10">
        <TakeOrderForm parts={await orderable()} onTake={take} />
      </div>
    </>
  )
}
