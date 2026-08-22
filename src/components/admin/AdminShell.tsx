"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { capabilities, type Capabilities } from "@/lib/admin/roles"
import type { Desk } from "@/lib/admin/session"
import { deskEnquiries, type BadgeRow } from "@/lib/admin/rows"
import { currentPrice, isSellable } from "@/lib/admin/pricing"
import { useAdmin } from "@/lib/admin/store"
import { DeskProvider } from "@/components/admin/identity"
import { ConsoleSearch, type Findable } from "@/components/admin/ConsoleSearch"
import { SignOutButton } from "@/components/admin/SignOutButton"

/**
 * The console's chrome.
 *
 * A fixed rail down the side rather than a strip along the top, because the
 * console is now four screens that are worked in rotation rather than four
 * pages that are visited. The rail carries the count of what is outstanding on
 * each, so the answer to "what needs me" is on screen without opening anything,
 * and the door out is where a door belongs, at the bottom of the rail rather
 * than in the corner of a header.
 *
 * The dark ground is the shop's own: this is the back of the house, and it
 * should not look like the shopfront. Everything on it comes from the AllFix
 * tokens in `globals.css`, brass for the marks and oxblood for the counts,
 * which is the same rule the storefront follows.
 *
 * The role filter stays where it was. Navigation is filtered in one place, so a
 * screen cannot be added later that forgets to.
 */

interface NavItem {
  href: string
  label: string
  hint: string
  icon: React.ReactNode
  needs?: keyof Capabilities
  /** Which outstanding count, if any, belongs on this row. */
  count?: "parts" | "enquiries"
}

/*
 * Drawn as the shop's own things rather than as generic console furniture: a
 * rail with its runners, a bracket in section, a docket and a person.
 */
const ICONS = {
  today: (
    <>
      <path d="M3 7h18" />
      <path d="M6 7v3M12 7v3M18 7v3" />
      <path d="M4 14h16v6H4z" />
    </>
  ),
  parts: (
    <>
      <path d="M4 4v10a3 3 0 003 3h5" />
      <path d="M4 4h5" />
      <path d="M12 14l4 3-4 3z" />
      <path d="M18 6h3v4h-3z" />
    </>
  ),
  enquiries: (
    <>
      <path d="M4 5h16v11H9l-5 4z" />
      <path d="M8 9h8M8 12h5" />
    </>
  ),
  people: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    </>
  ),
}

/**
 * Four screens, not five. Prices and the shot list were two lenses on one
 * object, a part, and both answered a version of "why can this not be sold yet".
 * They are one worksheet now, so the answer is in one place.
 */
const NAV: NavItem[] = [
  { href: "/admin", label: "Today", hint: "What is still open", icon: ICONS.today },
  {
    href: "/admin/parts",
    label: "Parts",
    hint: "Prices, and what is unphotographed",
    icon: ICONS.parts,
    count: "parts",
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
]

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join("") || "A"
  )
}

export function AdminShell({
  desk,
  findable,
  badges,
  children,
}: {
  desk: Desk
  findable: Findable[]
  badges: BadgeRow[]
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const allowed = capabilities(desk.role)
  const state = useAdmin()

  /*
   * Counted from the same source as the screen each one links to, and through
   * the same `currentPrice` the worksheet uses, so a price edited on Parts
   * changes the number on the rail in the same breath. A badge that disagrees
   * with the page behind it is worse than no badge.
   */
  const outstanding = {
    parts: badges.filter((row) => !isSellable(currentPrice(row, state.prices))).length,
    enquiries: deskEnquiries(state.inbox).filter(
      (enquiry) => (state.enquiries[enquiry.id] ?? "new") !== "closed",
    ).length,
  }

  // Escape closes the drawer, and the page behind it does not scroll while it
  // is open. Without the scroll lock, dragging the menu drags the console under
  // it, which on a phone reads as something having gone wrong.
  useEffect(() => {
    if (!open) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)

    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = previous
    }
  }, [open])

  // The drawer is a navigation, so following a link out of it closes it. Every
  // link in the rail carries this, including the way back to the shop, because
  // a drawer left standing over the page somebody asked for is the same bug
  // whichever link they took.
  const leaving = () => setOpen(false)

  const rail = (
    <>
      <Link href="/admin" onClick={leaving} className="mb-7 block px-3">
        <span className="block font-display text-lg font-bold leading-none text-stage-ink">
          AllFix
        </span>
        <span className="mt-1 block text-[10px] uppercase tracking-[0.24em] text-stage-brass">
          Counter console
        </span>
      </Link>

      <nav aria-label="Console" className="space-y-1">
        {NAV.filter((item) => !item.needs || allowed[item.needs]).map((item) => {
          // Today is the only exact match. Everything else owns its subtree, so
          // a part's price history still lights up Parts.
          const active =
            item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href)
          const badge = item.count ? outstanding[item.count] : 0

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={leaving}
              // Supplementary, never the only place it is said: the label
              // carries the screen and this only says what is on it.
              title={item.hint}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-white/12 text-stage-ink"
                  : "text-stage-ink/65 hover:bg-white/6 hover:text-stage-ink"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-[18px] w-[18px] shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {item.icon}
              </svg>
              <span className="flex-1">
                {item.label}
                <span className="sr-only">
                  {badge > 0 ? `, ${badge} outstanding` : ""}
                </span>
              </span>
              {badge > 0 && (
                <span
                  aria-hidden="true"
                  className="flex h-5 min-w-5 items-center justify-center rounded-full bg-oxblood px-1.5 font-mono text-[11px] font-bold text-white"
                >
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
        <Link
          href="/"
          onClick={leaving}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-stage-ink/65 transition-colors hover:bg-white/6 hover:text-stage-ink"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-[18px] w-[18px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 3h7v7M21 3l-9 9M10 5H4v15h15v-6" />
          </svg>
          The shop
        </Link>

        <div className="flex items-center gap-3 rounded-xl px-3 py-3">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-oxblood font-mono text-[12px] font-bold text-white"
          >
            {initials(desk.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-stage-ink">
              {desk.name}
            </span>
            <span className="block text-[11px] uppercase tracking-[0.14em] text-stage-mute">
              {desk.role}
            </span>
          </span>
          <SignOutButton className="rounded-lg px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-stage-mute transition-colors hover:bg-white/6 hover:text-stage-ink" />
        </div>
      </div>
    </>
  )

  return (
    <DeskProvider desk={desk}>
      <div className="min-h-screen bg-panel">
        <a
          href="#console"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
        >
          Skip to the screen
        </a>

        <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col overflow-y-auto bg-stage px-3 py-5 lg:flex">
          {rail}
        </aside>

        {/* The scrim fades for exactly as long as the panel takes to travel. On
            a shorter duration it finished first, and the last of the slide
            happened against an already bare page, which read as a stutter. */}
        <div
          onClick={() => setOpen(false)}
          aria-hidden="true"
          className={`fixed inset-0 z-40 bg-ink/50 transition-opacity duration-300 ease-out lg:hidden ${
            open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />
        {/* Kept mounted rather than rendered on demand, because a panel that
            only exists while it is open has nothing to slide in from. `inert`
            while closed is what stops the off screen copy of the whole rail
            collecting tab stops and being read out. */}
        <aside
          inert={!open}
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-y-auto bg-stage px-3 py-5 transition-transform duration-300 ease-out lg:hidden ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {rail}
        </aside>

        <div className="lg:pl-60">
          <header className="sticky top-0 z-30 flex h-[var(--desk-header)] items-center gap-3 border-b border-rule bg-paper/95 px-4 backdrop-blur sm:px-6">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="-ml-1 rounded-lg p-2 text-slate transition-colors hover:text-ink lg:hidden"
              aria-label="Open the console menu"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>

            <ConsoleSearch items={findable} />
          </header>

          <main id="console" className="min-w-0 px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </main>
        </div>
      </div>
    </DeskProvider>
  )
}
