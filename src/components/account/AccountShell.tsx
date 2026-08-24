"use client"

import { ConsoleShell } from "@/components/admin/ConsoleShell"
import { ICONS } from "@/components/admin/icons"

/**
 * The shopper's account, on the same rail as the counter and the trade desk.
 *
 * Three desks now share one shell, which is the point: they are the same
 * furniture with different things on it, and a customer who is also a fundi
 * should not have to learn two navigations. What differs is the rail's
 * contents, and that difference is the role model, not the chrome.
 *
 * The counts come from the server. Nothing on this desk is edited into a
 * different number by the browser: an order's stage changes at the counter.
 */
export function AccountShell({
  name,
  role,
  open,
  saved,
  children,
}: {
  name: string
  role: string
  /** Orders still moving, which is the only number worth a badge here. */
  open: number
  saved: number
  children: React.ReactNode
}) {
  return (
    <ConsoleShell
      label="Your account"
      name={name}
      role={role}
      profileHref="/account/profile"
      nav={[
        {
          href: "/account",
          label: "Account",
          hint: "Where everything has got to",
          icon: ICONS.today,
          exact: true,
        },
        {
          href: "/account/orders",
          label: "Orders",
          hint: "What you have bought, and where it is",
          icon: ICONS.orders,
          badge: open,
        },
        {
          href: "/account/rails",
          label: "Saved rails",
          hint: "Windows you have measured",
          icon: ICONS.parts,
          badge: saved,
        },
        {
          href: "/account/addresses",
          label: "Addresses",
          hint: "Where we deliver to",
          icon: ICONS.people,
        },
        {
          href: "/account/documents",
          label: "Receipts",
          hint: "Receipts and proforma invoices",
          icon: ICONS.quotes,
        },
        {
          href: "/account/profile",
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
