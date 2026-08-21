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
            A plain link, never a "signed in as" state. Working that out means
            reading the session cookie, and this header is rendered on every
            storefront page, so a single cookie read here would turn the whole
            shop dynamic and give up the static rendering the catalogue pages
            depend on. Who is signed in is the console's business, not the
            shop's.
          */}
          <Link
            href="/sign-in"
            className="hidden rounded-sm border border-ink px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper md:inline-flex"
          >
            Sign in
          </Link>

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
