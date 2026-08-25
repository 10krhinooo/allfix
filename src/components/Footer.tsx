import Link from "next/link"
import { Logo } from "@/components/Logo"
import { SocialRow } from "@/components/Social"
import { systems } from "@/lib/catalogue"
import { SHOP } from "@/lib/format"
import { readSettings } from "@/lib/settings-service"

/**
 * The social row is read rather than written in. The accounts are the shop's to
 * change from the console, and there are none set today, so the row draws
 * nothing at all: six icons pointing at accounts that do not exist would be a
 * worse footer than one without them.
 *
 * Async, and it does not make the pages dynamic. The settings are fetched on a
 * five minute revalidate when there is a service, and read from the environment
 * when there is not, so the storefront stays prerendered either way.
 */
export async function Footer() {
  const { social } = await readSettings()

  return (
    <footer className="mt-24 border-t border-rule bg-panel">
      <div className="shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
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

          <SocialRow links={social} className="mt-5" />
        </div>
      </div>

      <div className="border-t border-rule">
        <div className="shell flex flex-wrap gap-x-5 gap-y-2 py-5">
          <p className="callout">© {new Date().getFullYear()} AllFix By Kipekee</p>
          <Link href="/terms" className="callout hover:text-ink">Terms</Link>
          <Link href="/privacy" className="callout hover:text-ink">Privacy</Link>
        </div>
      </div>
    </footer>
  )
}
