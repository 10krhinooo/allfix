import Link from "next/link"
import { Logo } from "@/components/Logo"
import { systems } from "@/lib/catalogue"
import { SHOP } from "@/lib/format"

export function Footer() {
  return (
    <footer className="mt-24 border-t border-rule bg-panel">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo height={40} />
          <p className="mt-3 text-sm leading-relaxed text-slate">
            Curtain rails, rods and every fitting that goes with them, over the counter on{" "}
            {SHOP.street} and delivered across Kenya.
          </p>
        </div>

        <div>
          <p className="callout">Rail systems</p>
          <ul className="mt-3 space-y-1.5">
            {systems.slice(0, 6).map((system) => (
              <li key={system.slug}>
                <Link href={`/systems/${system.slug}`} className="text-sm text-slate hover:text-ink">
                  {system.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="callout">Shop</p>
          <ul className="mt-3 space-y-1.5">
            {[
              ["/shop", "All parts"],
              ["/build", "Build a rail"],
              ["/services", "Installation & curtaining"],
              ["/trade", "Trade accounts"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-sm text-slate hover:text-ink">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="callout">Visit or call</p>
          <address className="mt-3 space-y-1.5 text-sm not-italic text-slate">
            <p>{SHOP.street}</p>
            <p>{SHOP.area}</p>
            <a href={`tel:${SHOP.phoneIntl}`} className="block font-mono text-ink">{SHOP.phone}</a>
          </address>
        </div>
      </div>

      <div className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-5 gap-y-2 px-5 py-5">
          <p className="callout">© {new Date().getFullYear()} AllFix By Kipekee</p>
          <Link href="/terms" className="callout hover:text-ink">Terms</Link>
          <Link href="/privacy" className="callout hover:text-ink">Privacy</Link>
        </div>
      </div>
    </footer>
  )
}
