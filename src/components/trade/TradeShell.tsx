"use client"

import { ConsoleShell } from "@/components/admin/ConsoleShell"
import { ICONS } from "@/components/admin/icons"

/**
 * The trade desk, on the same rail as the counter.
 *
 * It is not the counter console and it is not a second shop. A fundi or a
 * curtain maker signing in wants two records and nothing else: where the order
 * they placed has got to, and a price on a list they can hand to a client. So
 * that is what the rail carries, with the counts on it, and the way back to the
 * catalogue at the foot where the shop always is.
 *
 * The badges are worked out on the server and passed in, because unlike the
 * counter's, nothing here is edited in the browser: an order's stage changes at
 * the counter, not on this screen.
 */
export function TradeShell({
  name,
  role,
  working,
  awaiting,
  children,
}: {
  name: string
  role: string
  working: number
  awaiting: number
  children: React.ReactNode
}) {
  return (
    <ConsoleShell
      label="Trade account"
      name={name}
      role={role}
      profileHref="/trade/account/profile"
      nav={[
        {
          href: "/trade/account",
          label: "Account",
          hint: "Where everything has got to",
          icon: ICONS.today,
          exact: true,
        },
        {
          href: "/trade/account/orders",
          label: "Orders",
          hint: "Placed, packed or on the way",
          icon: ICONS.orders,
          badge: working,
        },
        {
          href: "/trade/account/quotes",
          label: "Quotes",
          hint: "Priced and held, and a new one",
          icon: ICONS.quotes,
          badge: awaiting,
        },
        {
          href: "/trade/account/profile",
          label: "Your details",
          hint: "Who you are signed in as",
          icon: ICONS.profile,
        },
      ]}
    >
      {children}
    </ConsoleShell>
  )
}
