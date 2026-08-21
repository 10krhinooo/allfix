import Link from "next/link"
import { Logo } from "@/components/Logo"
import { MobileNav } from "@/components/MobileNav"
import { ThemeToggle } from "@/components/ThemeToggle"
import { SHOP } from "@/lib/format"

const NAV = [
  { href: "/systems", label: "Rail systems" },
  { href: "/shop", label: "All parts" },
  { href: "/build", label: "Build a rail" },
  { href: "/services", label: "Services" },
]

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur">
      <div className="shell flex h-20 items-center gap-6">
        <Link href="/" className="shrink-0" aria-label={`${SHOP.name} home`}>
          <Logo height={44} priority alt="" />
        </Link>

        <nav className="hidden flex-1 items-center gap-6 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-slate transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <a
            href={`tel:${SHOP.phoneIntl}`}
            className="hidden font-mono text-sm text-ink sm:block"
          >
            {SHOP.phone}
          </a>

          {/*
            Both controls are rendered and CSS picks one, driven by a boolean
            cookie read before first paint. Deciding it on the server instead
            would mean reading the session in a header that renders on every
            page, which turns the whole shop dynamic and gives up the static
            rendering the catalogue depends on. Where "your account" goes is the
            server's business: /account redirects by role.

            The breakpoint lives on the wrapper, not on the two links. Both are
            the same rule: whichever element the signed in state controls must
            not also carry a display utility, or the two rules fight and the
            desktop button turns up on a phone next to the drawer's own entry.
          */}
          <span className="hidden md:inline-flex">
            <Link
              href="/sign-in"
              className="when-signed-out rounded-sm border border-ink px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              Sign in
            </Link>
            <Link
              href="/account"
              className="when-signed-in rounded-sm border border-ink px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              Your account
            </Link>
          </span>

          <ThemeToggle />
          <MobileNav items={NAV} />
        </div>
      </div>

      {/* The counter is the business. Say where it is on every page. */}
      <div className="border-t border-rule bg-panel">
        <div className="shell flex h-8 items-center gap-4 overflow-x-auto">
          <span className="callout whitespace-nowrap">
            Counter sales · {SHOP.street}, {SHOP.area}
          </span>
          <span className="callout whitespace-nowrap text-brass">Wholesale 20% off</span>
        </div>
      </div>
    </header>
  )
}
