import Link from "next/link"
import { Logo } from "@/components/Logo"
import { MobileNav } from "@/components/MobileNav"
import { BasketLink } from "@/components/cart/BasketLink"
import { SHOP } from "@/lib/format"
import { ratePercent } from "@/lib/tiers"

/*
 * Both browse axes, because they are co-equal and the customer arrives knowing
 * which one they are on. A rail owner and a rod owner are looking for different
 * things and nothing that fits a #20 fits a 28mm pole, so sending both to "All
 * parts" and letting them filter is what the old site did.
 */
const NAV = [
  { href: "/systems", label: "Rail systems" },
  { href: "/ranges", label: "Rod finishes" },
  { href: "/shop", label: "All parts" },
  { href: "/build", label: "Build a rail" },
  { href: "/services", label: "Services" },
]

export function Header() {
  return (
    // The header stands off the wall rather than being ruled off it: at noon a
    // thing fixed to a wall casts a shadow onto what is behind it, and that is
    // what says this one is in front of the page rather than part of it.
    <header className="sunlit sunlit-near sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur">
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

        <div className="ml-auto flex items-center gap-3">
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

          {/* Beside the account control and before the theme toggle: the two
              things somebody reaches for mid task are the basket and the way
              into their account, so they sit together and at the same size. It
              is outside the `md:` wrapper above, because a basket matters most
              on a phone. */}
          <BasketLink className="text-ink" />

          <MobileNav items={NAV} />
        </div>
      </div>

      {/*
        The counter is the business. Say where it is on every page.

        It wraps rather than scrolls sideways. As a scroller it was a region a
        keyboard could never reach: nothing inside it is focusable, so there was
        no way to scroll it without a mouse or a finger, and half the line was
        simply unreadable on a narrow phone. Two short lines of text have no
        business being a carousel.
      */}
      <div className="border-t border-rule bg-panel">
        <div className="shell flex min-h-8 flex-wrap items-center gap-x-4 gap-y-0.5 py-1">
          <span className="callout">
            Counter sales · {SHOP.street}, {SHOP.area}
          </span>
          {/*
            The rate comes from `tiers.ts` rather than being typed here, and it
            is a link rather than a claim: it is the loudest promise the shop
            makes and the page that explains it was a click nobody was offered.
          */}
          <Link href="/trade" className="callout text-brass hover:underline">
            Wholesale {ratePercent("trade")} off
          </Link>
        </div>
      </div>
    </header>
  )
}
