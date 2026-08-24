import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { price, hours, whatsapp } from "@/lib/format"
import {
  ordersFor,
  addressesFor,
  railsFor,
  documentsFor,
  isOpen,
  orderTotal,
  ORDER_STAGE,
} from "@/lib/account"
import { PageHead, Stats, Stat, Card, CardHeader, EmptyState, Pill } from "@/components/admin/parts"
import { OrderCard } from "@/components/orders/OrderCard"

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
}

/**
 * The account, on arrival.
 *
 * The counts first, then the one thing actually in motion. Everything else is a
 * click away on its own screen rather than stacked underneath, which is the
 * arrangement the trade desk arrived at and the reason it stopped being one
 * long page.
 */
export default async function AccountPage() {
  const desk = await readDesk()
  if (!desk) redirect("/sign-in?next=%2Faccount")

  const orders = ordersFor(desk.email)
  const open = orders.filter(isOpen)
  const rails = railsFor(desk.email)
  const addresses = addressesFor(desk.email)
  const documents = documentsFor(desk.email)
  const home = addresses.find((address) => address.isDefault)

  return (
    <>
      <PageHead
        title={`Good to see you, ${desk.name.split(" ")[0]}.`}
        lead="What you have bought, where it is going, and the windows you have had us work out."
      />

      <Stats>
        <Stat label="On the way" value={open.length} hint="Orders still moving" />
        <Stat label="Saved rails" value={rails.length} hint="Windows you have measured" />
        <Stat label="Receipts" value={documents.length} hint="Receipts and proformas" />
      </Stats>

      <section className="mt-10">
        <h2 className="callout">Still moving</h2>
        {open.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="Nothing on the way"
              body="When you order, this is where you will see it move from the counter to your door."
            />
          </div>
        ) : (
          <div className="mt-3 space-y-4">
            {open.map((order) => (
              <OrderCard
                key={order.reference}
                order={order}
                meta={
                  <p className="mt-4 font-mono text-xs text-slate">
                    {order.deliveredTo ? `Going to ${order.deliveredTo}` : "For collection"}
                  </p>
                }
              />
            ))}
          </div>
        )}
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Where we deliver"
            hint={home ? home.label : "Nothing saved yet"}
            action={
              <Link href="/account/addresses" className="callout hover:text-ink">
                Manage
              </Link>
            }
          />
          {home ? (
            <address className="mt-4 text-sm not-italic leading-relaxed text-slate">
              {home.recipient}
              <br />
              {home.line}, {home.area}
              <br />
              {home.town}
              <br />
              <span className="font-mono text-xs">{home.phone}</span>
            </address>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-slate">
              Add an address and checkout will already know where it is going.
            </p>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Saved rails"
            hint={`${rails.length} window${rails.length === 1 ? "" : "s"}`}
            action={
              <Link href="/account/rails" className="callout hover:text-ink">
                Open
              </Link>
            }
          />
          {rails.length === 0 ? (
            <p className="mt-4 text-sm leading-relaxed text-slate">
              Measure a window in{" "}
              <Link href="/build" className="text-oxblood underline-offset-4 hover:underline">
                the configurator
              </Link>{" "}
              and save it here, and the parts list comes back with it.
            </p>
          ) : (
            <ul className="mt-4 border-t border-rule">
              {rails.slice(0, 3).map((rail) => (
                <li
                  key={rail.id}
                  className="flex items-baseline justify-between gap-4 border-b border-rule py-2.5"
                >
                  <span className="text-sm text-ink">{rail.name}</span>
                  <span className="font-mono text-xs text-slate">
                    {rail.widthM} m · {rail.system}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {orders.length > 0 && (
        <section className="mt-10">
          <h2 className="callout">Bought before</h2>
          <ul className="mt-3 border-t border-rule">
            {orders.filter((order) => !isOpen(order)).slice(0, 4).map((order) => {
              const total = orderTotal(order)
              return (
                <li
                  key={order.reference}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule py-3"
                >
                  <span className="min-w-0">
                    <Link
                      href="/account/orders"
                      className="font-mono text-sm text-ink hover:text-oxblood"
                    >
                      {order.reference}
                    </Link>
                    <span className="ml-3 text-xs text-slate">{hours(order.hoursAgo)}</span>
                  </span>
                  <span className="flex items-baseline gap-4">
                    <Pill tone="quiet">{ORDER_STAGE[order.stage]}</Pill>
                    <span className="font-mono text-xs text-slate">
                      {total === null ? "On request" : price(total)}
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <p className="mt-10 text-sm leading-relaxed text-slate">
        Something not right on an order?{" "}
        <a
          href={whatsapp("Hello AllFix, I have a question about an order on my account:")}
          className="text-oxblood underline-offset-4 hover:underline"
        >
          Message the counter
        </a>
        .
      </p>
    </>
  )
}
