"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { SignOutButton } from "@/components/admin/SignOutButton"

/**
 * The chrome both consoles wear.
 *
 * A fixed rail down the side rather than a strip along the top, because a
 * console is a handful of screens worked in rotation rather than pages that are
 * visited. The rail carries the count of what is outstanding on each, so the
 * answer to "what needs me" is on screen without opening anything, and the way
 * out sits at the foot where a door belongs.
 *
 * Shared by the counter and the trade desk. They are different jobs with
 * different screens, but they are the same shape of thing: somebody signed in,
 * working a short list of records. Writing the rail twice would mean two
 * drawers, two scroll locks and two sets of `inert` handling, which is two
 * chances to get the phone case wrong.
 *
 * The dark ground is the shop's own stage. This is the back of the house and it
 * should not look like the shopfront.
 */

export interface ConsoleNav {
  href: string
  label: string
  /** Supplementary only: shown as a tooltip, never the only place it is said. */
  hint: string
  icon: React.ReactNode
  /** Exact match rather than owning the subtree. Only the index needs it. */
  exact?: boolean
  /** What is outstanding on that screen. Zero and undefined both draw nothing. */
  badge?: number
}

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join("") || "A"
  )
}

export function ConsoleShell({
  label,
  nav,
  name,
  role,
  profileHref,
  search,
  children,
}: {
  /** What this console is, under the mark. */
  label: string
  nav: ConsoleNav[]
  name: string
  role: string
  profileHref: string
  /** The counter's console search. The trade desk has nothing to search yet. */
  search?: React.ReactNode
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

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

  // Following a link out of the drawer closes it. Every link in the rail carries
  // this, including the way back to the shop, because a drawer left standing
  // over the page somebody asked for is the same bug whichever link they took.
  const leaving = () => setOpen(false)

  const rail = (
    <>
      <Link href={nav[0]?.href ?? "/"} onClick={leaving} className="mb-7 block px-3">
        <span className="block font-display text-lg font-bold leading-none text-stage-ink">
          AllFix
        </span>
        <span className="mt-1 block text-[10px] uppercase tracking-[0.24em] text-stage-brass">
          {label}
        </span>
      </Link>

      <nav aria-label={label} className="space-y-1">
        {nav.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          const badge = item.badge ?? 0

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={leaving}
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
                <span className="sr-only">{badge > 0 ? `, ${badge} outstanding` : ""}</span>
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

        {/*
          The whole row is the way to your own details, mark and name together,
          because the mark is the control people try first and a name that is not
          a link beside one that is reads as a bug.
        */}
        <div className="flex items-center gap-2 rounded-xl px-1 py-1">
          <Link
            href={profileHref}
            onClick={leaving}
            title="Your details"
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/6"
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-oxblood font-mono text-[12px] font-bold text-white"
            >
              {initials(name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-stage-ink">{name}</span>
              <span className="block text-[11px] uppercase tracking-[0.14em] text-stage-mute">
                {role}
              </span>
            </span>
          </Link>
          <SignOutButton
            icon
            className="shrink-0 rounded-lg p-2 text-stage-mute transition-colors hover:bg-white/6 hover:text-stage-ink"
          />
        </div>
      </div>
    </>
  )

  return (
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

      {/* The scrim fades for exactly as long as the panel takes to travel. On a
          shorter duration it finished first, and the last of the slide happened
          against an already bare page, which read as a stutter. */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-ink/50 transition-opacity duration-300 ease-out lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* Kept mounted rather than rendered on demand, because a panel that only
          exists while it is open has nothing to slide in from. `inert` while
          closed is what stops the off screen copy of the whole rail collecting
          tab stops and being read out. */}
      <aside
        inert={!open}
        className={`fixed inset-y-0 left-0 z-50 flex w-[17rem] max-w-[85vw] flex-col overflow-y-auto bg-stage px-3 py-5 transition-transform duration-300 ease-out lg:hidden ${
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
            className="-ml-1 shrink-0 rounded-lg p-2 text-slate transition-colors hover:text-ink lg:hidden"
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

          {search ?? (
            <span className="truncate font-display text-sm font-semibold text-ink lg:hidden">
              AllFix
              <span className="callout ml-3">{label}</span>
            </span>
          )}
        </header>

        <main id="console" className="min-w-0 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
