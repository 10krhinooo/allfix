import { redirect } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { ordersFor, quotesFor } from "@/lib/trade"
import { TradeShell } from "@/components/trade/TradeShell"

/**
 * The trade desk's own chrome, outside `(shop)`.
 *
 * It used to sit inside the storefront group and wear the shop's header, on the
 * argument that a trade account is still a customer who should be able to
 * browse. That argument holds, and the way back to the catalogue is at the foot
 * of the rail, but a console under a shopfront header is two navigations
 * stacked and neither of them is in charge. The desk is a desk.
 *
 * `/trade` itself stays in `(shop)`: that page is the pitch for an account and
 * belongs to the shop. Only the account behind it lives here.
 *
 * Read here as well as in the proxy. Reading the cookie also makes this subtree
 * dynamic, which a per visitor desk should always have been.
 */
export default async function TradeLayout({ children }: { children: React.ReactNode }) {
  const desk = await readDesk()
  if (!desk) redirect("/sign-in?next=%2Ftrade%2Faccount")

  const orders = ordersFor(desk.email)
  const quotes = quotesFor(desk.email)

  return (
    <TradeShell
      name={desk.name}
      role={desk.role}
      working={
        orders.filter((order) => order.stage !== "collected" && order.stage !== "cancelled").length
      }
      awaiting={quotes.filter((quote) => quote.stage === "sent").length}
    >
      {children}
    </TradeShell>
  )
}
