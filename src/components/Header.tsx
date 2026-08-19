import Link from "next/link"
import { Logo } from "@/components/Logo"
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
      <div className="mx-auto flex h-20 max-w-6xl items-center gap-6 px-5">
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
          <ThemeToggle />
        </div>
      </div>

      {/* The counter is the business. Say where it is on every page. */}
      <div className="border-t border-rule bg-panel">
        <div className="mx-auto flex max-w-6xl items-center gap-4 overflow-x-auto px-5 py-1.5">
          <span className="callout whitespace-nowrap">
            Counter sales · {SHOP.street}, {SHOP.area}
          </span>
          <span className="callout whitespace-nowrap text-brass">Wholesale 20% off</span>
        </div>
      </div>
    </header>
  )
}
