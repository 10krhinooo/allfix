import Link from "next/link"
import { SHOP } from "@/lib/format"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { ordersFor, ORDER_STAGE } from "@/lib/trade"
import { PageHead, EmptyState } from "@/components/admin/parts"
import { OrderCard } from "@/components/trade/records"

export const metadata: Metadata = { title: "Your orders", robots: { index: false, follow: false } }

/**
 * Everything ordered, newest first, including what has already been collected.
 * The finished ones stay because the commonest question at a trade desk is not
 * "where is my order" but "what did we pay for those last time".
 */
export default async function TradeOrdersPage() {
  const desk = await readDesk()
  if (!desk) redirect("/sign-in?next=%2Ftrade%2Faccount%2Forders")

  const orders = ordersFor(desk.email)
  const working = orders.filter(
    (order) => order.stage !== "collected" && order.stage !== "cancelled",
  )

  return (
    <>
      <PageHead
        title="Orders"
        lead={
          working.length > 0
            ? `${working.length} still moving, out of ${orders.length}. The finished ones stay here for what they cost.`
            : "Nothing on the bench. The finished ones stay here for what they cost."
        }
      />

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          body="Anything ordered over the counter or through a quote appears here, with where it has got to."
          action={
            <Link
              href="/trade/account/quotes"
              className="text-sm font-medium text-oxblood hover:underline"
            >
              Price a new list
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.reference} order={order} />
          ))}
        </div>
      )}

      <p className="mt-6 max-w-2xl text-xs leading-relaxed text-slate">
        The stages are {Object.values(ORDER_STAGE).join(", ").toLowerCase()}. They are set at the
        counter, so if one looks wrong it is worth a call rather than a wait:{" "}
        <a href={`tel:${SHOP.phoneIntl}`} className="text-oxblood underline underline-offset-4">
          {SHOP.phone}
        </a>
        .
      </p>
    </>
  )
}
