"use client"

import { capabilities, type Capabilities } from "@/lib/admin/roles"
import type { Desk } from "@/lib/admin/session"
import { deskEnquiries, type BadgeRow, type DeskEnquiry } from "@/lib/admin/rows"
import type { DeskOrder } from "@/lib/admin/orders-service"
import { currentPrice, isSellable } from "@/lib/admin/pricing"
import { useAdmin } from "@/lib/admin/store"
import { DeskProvider } from "@/components/admin/identity"
import { ConsoleShell, type ConsoleNav } from "@/components/admin/ConsoleShell"
import { ConsoleSearch, type Findable } from "@/components/admin/ConsoleSearch"
import { ICONS } from "@/components/admin/icons"

/**
 * The counter console, on the shared rail.
 *
 * What is left here after `ConsoleShell` took the chrome is the part that is
 * actually the counter's: which screens exist, which role may see them, and how
 * many things on each are still outstanding.
 *
 * The role filter stays in one place on purpose, so a screen cannot be added
 * later that forgets to apply it.
 */

interface NavItem extends ConsoleNav {
  needs?: keyof Capabilities
  /** Which outstanding count belongs on this row, if any. */
  count?: "parts" | "enquiries" | "orders" | "stock"
}

/**
 * Prices and the shot list were two lenses on one object, a part, and both
 * answered a version of "why can this not be sold yet". They are one worksheet
 * now, so the answer is in one place.
 *
 * Two of these are admin's alone. People decides who gets in, and Settings
 * decides what the shop says about itself to everybody who does not.
 */
const NAV: NavItem[] = [
  {
    href: "/admin",
    label: "Today",
    hint: "What is still open",
    icon: ICONS.today,
    exact: true,
  },
  {
    href: "/admin/parts",
    label: "Parts",
    hint: "Prices, and what is unphotographed",
    icon: ICONS.parts,
    count: "parts",
  },
  {
    href: "/admin/orders",
    label: "Orders",
    hint: "Every order, and the way to take one that did not come through the site",
    icon: ICONS.orders,
    needs: "orders",
    count: "orders",
  },
  {
    href: "/admin/stock",
    label: "Stock",
    hint: "What is on the shelf, and what is running out",
    icon: ICONS.stock,
    needs: "stock",
    count: "stock",
  },
  {
    href: "/admin/enquiries",
    label: "Enquiries",
    hint: "Quotes, surveys and trade",
    icon: ICONS.enquiries,
    count: "enquiries",
  },
  {
    href: "/admin/people",
    label: "People",
    hint: "Who gets in, and as what",
    icon: ICONS.people,
    needs: "people",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    hint: "Social accounts, and what the shop sends",
    icon: ICONS.settings,
    needs: "settings",
  },
]

export function AdminShell({
  desk,
  findable,
  badges,
  queue,
  orders,
  lowStock,
  children,
}: {
  desk: Desk
  findable: Findable[]
  badges: BadgeRow[]
  /** The shop's own enquiries, or null when no service could be asked. */
  queue: DeskEnquiry[] | null
  /** Every order, or null when no service could be asked. */
  orders: DeskOrder[] | null
  /**
   * How many counted parts are at or below their threshold.
   *
   * A number rather than the rows, because the rail only ever draws the count
   * and the rows are the screen's. Null when no service could be asked, which
   * draws no badge at all: a zero there would say the shelves are fine.
   */
  lowStock: number | null
  children: React.ReactNode
}) {
  const allowed = capabilities(desk.role)
  const state = useAdmin()

  /*
   * Counted from the same source as the screen each one links to, and through
   * the same `currentPrice` the worksheet uses, so a price edited on Parts
   * changes the number on the rail in the same breath. A badge that disagrees
   * with the page behind it is worse than no badge.
   */
  const outstanding = {
    parts: badges.filter((row) => !isSellable(currentPrice(row))).length,
    // Orders still to pack or send. Collected and cancelled are finished, and a
    // badge that counts finished work never goes down.
    orders: (orders ?? []).filter((order) => order.stage !== "collected" && order.stage !== "cancelled")
      .length,
    // Counted parts at or below their threshold, from the same service the
    // screen reads. Null draws nothing, because a zero would say every shelf is
    // fine when the truth is that nobody could ask.
    stock: lowStock ?? 0,
    enquiries: (queue ?? deskEnquiries(state.inbox)).filter(
      (enquiry) => (state.enquiries[enquiry.id] ?? "new") !== "closed",
    ).length,
  }

  const nav = NAV.filter((item) => !item.needs || allowed[item.needs]).map((item) => ({
    ...item,
    badge: item.count ? outstanding[item.count] : undefined,
  }))

  return (
    <DeskProvider desk={desk}>
      <ConsoleShell
        label="Counter console"
        nav={nav}
        name={desk.name}
        role={desk.role}
        profileHref="/admin/profile"
        search={<ConsoleSearch items={findable} />}
      >
        {children}
      </ConsoleShell>
    </DeskProvider>
  )
}
