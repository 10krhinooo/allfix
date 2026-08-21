"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { capabilities, type Capabilities } from "@/lib/admin/roles"
import type { Desk } from "@/lib/admin/session"
import { DeskProvider } from "@/components/admin/identity"
import { ConsoleSearch, type Findable } from "@/components/admin/ConsoleSearch"

/**
 * The console's chrome.
 *
 * The door is no longer here. It moved to `/sign-in` and to `src/proxy.ts`, so a
 * signed out visitor never receives this markup in the first place; the old
 * arrangement rendered the whole console and hid it behind a check on a name in
 * localStorage. What stays here is the other half of that idea: the navigation
 * is filtered by role in one place, so a screen cannot be added later that
 * forgets to.
 */

interface NavItem {
  href: string
  label: string
  hint: string
  needs?: keyof Capabilities
}

/**
 * Four screens, not five. Prices and the shot list were two lenses on one
 * object, a part, and both answered a version of "why can this not be sold yet".
 * They are one worksheet now, so the answer is in one place.
 */
const NAV: NavItem[] = [
  { href: "/admin", label: "Today", hint: "What is still open" },
  { href: "/admin/parts", label: "Parts", hint: "Prices, and what is unphotographed" },
  { href: "/admin/enquiries", label: "Enquiries", hint: "Quotes, surveys and trade" },
  { href: "/admin/people", label: "People", hint: "Who gets in, and as what", needs: "people" },
]

export function AdminShell({
  desk,
  findable,
  children,
}: {
  desk: Desk
  findable: Findable[]
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const allowed = capabilities(desk.role)

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.replace("/sign-in")
    // The client cache still holds console payloads fetched while the cookie was
    // live, so without this the browser can navigate straight back into them.
    router.refresh()
  }

  return (
    <DeskProvider desk={desk}>
      <div className="flex min-h-screen flex-col bg-panel">
        <a
          href="#console"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
        >
          Skip to the screen
        </a>

        <header className="sticky top-0 z-40 border-b border-rule bg-paper">
          <div className="flex items-center justify-between gap-4 px-5 py-3">
            <div className="flex shrink-0 items-baseline gap-3">
              <span className="font-display text-base font-bold tracking-tight">AllFix</span>
              <span className="callout hidden sm:inline">Counter console</span>
            </div>

            <ConsoleSearch items={findable} />

            <div className="flex shrink-0 items-center gap-4">
              <span className="hidden text-right lg:block">
                <span className="block font-mono text-xs text-slate">{desk.name}</span>
                <span className="callout">{desk.role}</span>
              </span>
              <button type="button" onClick={signOut} className="callout hover:text-ink">
                Sign out
              </button>
              <Link href="/" className="callout hidden hover:text-ink sm:inline">
                The shop
              </Link>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col lg:flex-row">
          <nav
            aria-label="Console"
            className="border-b border-rule bg-paper lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r"
          >
            <ul className="flex overflow-x-auto lg:sticky lg:top-[var(--desk-header)] lg:block lg:overflow-visible">
              {NAV.filter((item) => !item.needs || allowed[item.needs]).map((item) => {
                // Today is the only exact match. Everything else owns its
                // subtree, so a part's price history still lights up Parts.
                const active =
                  item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href)
                return (
                  <li key={item.href} className="shrink-0 lg:border-b lg:border-rule">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`block px-5 py-3 transition-colors ${
                        active ? "bg-ink text-paper" : "text-slate hover:bg-panel hover:text-ink"
                      }`}
                    >
                      <span className="block text-sm font-medium">{item.label}</span>
                      <span
                        className={`mt-0.5 hidden text-xs lg:block ${
                          active ? "text-paper/60" : "text-mute"
                        }`}
                      >
                        {item.hint}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <main id="console" className="min-w-0 flex-1">
            {children}
          </main>
        </div>
      </div>
    </DeskProvider>
  )
}
