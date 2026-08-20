"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAdmin, signOut } from "@/lib/admin/store"
import { SignIn } from "@/components/admin/SignIn"

/**
 * The console's chrome, and its door.
 *
 * The gate lives here rather than on each page so a screen cannot be added
 * later that forgets it. It is not security and does not pretend to be: see
 * SignIn. When the backend is deployed this component keeps its shape and the
 * check becomes a real session.
 */

const NAV = [
  { href: "/admin", label: "The counter", hint: "What is open today" },
  { href: "/admin/prices", label: "Prices", hint: "The parts that cannot be sold" },
  { href: "/admin/shots", label: "Shot list", hint: "Parts waiting on a photograph" },
  { href: "/admin/enquiries", label: "Enquiries", hint: "Quotes, surveys and trade" },
  { href: "/admin/people", label: "People", hint: "Who gets in, and as what" },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const state = useAdmin()
  const pathname = usePathname()

  if (!state.who) return <SignIn />

  return (
    <div className="flex min-h-screen flex-col bg-panel">
      <header className="sticky top-0 z-40 border-b border-rule bg-paper">
        <div className="flex items-center justify-between gap-6 px-5 py-3">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-base font-bold tracking-tight">AllFix</span>
            <span className="callout">Counter console</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-xs text-slate sm:inline">{state.who}</span>
            <button onClick={signOut} className="callout hover:text-ink">
              Sign out
            </button>
            <Link href="/" className="callout hover:text-ink">
              The shop
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <nav className="border-b border-rule bg-paper lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
          <ul className="flex overflow-x-auto lg:sticky lg:top-[3.25rem] lg:block lg:overflow-visible">
            {NAV.map((item) => {
              // The counter is the only exact match. Everything else owns its
              // subtree, so a product's price history still lights up Prices.
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

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
