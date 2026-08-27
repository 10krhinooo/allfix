import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { whatsapp } from "@/lib/format"
import { ordersFor, isOpen, SETTLEMENT } from "@/lib/account"
import { sheetsFor, SHEETS } from "@/lib/documents"
import Link from "next/link"
import { PageHead, EmptyState } from "@/components/admin/parts"
import { OrderCard } from "@/components/orders/OrderCard"

export const metadata: Metadata = {
  title: "Your orders",
  robots: { index: false, follow: false },
}

/**
 * Everything bought, newest first.
 *
 * Reorder is a message rather than a basket. There is no cart yet, and a button
 * that looked like one and then went to WhatsApp would be worse than a button
 * that says what it does. The message arrives at the counter carrying the
 * reference and the parts, which is what somebody would read down the phone.
 */
export default async function OrdersPage() {
  const desk = await readDesk()
  if (!desk) redirect("/sign-in?next=%2Faccount%2Forders")

  const orders = ordersFor(desk.email)

  return (
    <>
      <PageHead title="Your orders" lead="Everything you have bought from the counter, newest first." />

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          body="When you buy something, it appears here and you can follow it from the counter to your door."
          action={
            <Link href="/shop" className="text-sm font-medium text-oxblood hover:underline">
              Browse the shop
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const again = whatsapp(
              `Hello AllFix, I would like to order these again (was ${order.reference}):\n` +
                order.lines.map((line) => `- ${line.quantity} x ${line.name} (${line.ref})`).join("\n"),
            )
            return (
              <OrderCard
                key={order.reference}
                order={order}
                meta={
                  <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-4">
                      <p className="font-mono text-xs text-slate">
                        {SETTLEMENT[order.settlement]}
                        {order.deliveredTo ? ` · ${order.deliveredTo}` : " · collected"}
                      </p>
                      {!isOpen(order) && order.stage !== "cancelled" && (
                        <a
                          href={again}
                          className="callout text-oxblood transition-colors hover:text-oxblood-deep"
                        >
                          Order these again
                        </a>
                      )}
                    </div>

                    {/* Only what this order can actually produce. A receipt for
                        an order still being packed would be the shop issuing one
                        for a payment it has not had. */}
                    {sheetsFor(order).length > 0 && (
                      <p className="flex flex-wrap items-baseline gap-4 border-t border-rule pt-3">
                        <span className="callout">Documents</span>
                        {sheetsFor(order).map((kind) => (
                          <Link
                            key={kind}
                            href={`/account/orders/${order.reference}/${kind}`}
                            className="callout text-oxblood transition-colors hover:text-oxblood-deep"
                          >
                            {SHEETS[kind].title}
                          </Link>
                        ))}
                      </p>
                    )}
                  </div>
                }
              />
            )
          })}
        </div>
      )}
    </>
  )
}
