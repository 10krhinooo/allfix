import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { SEEDED_LOGINS, SEEDED_DOOR_IS_LOCKED } from "@/lib/admin/accounts"
import { readDesk } from "@/lib/admin/guard"
import { landing, safeNext } from "@/lib/admin/roles"
import { SignInForm } from "@/components/admin/SignInForm"
import { Logo } from "@/components/Logo"
import { SHOP } from "@/lib/format"

/**
 * Kept out of search results for the same reason the console is: a staff screen
 * indexed once stays indexed long after the mistake is noticed.
 */
export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
}

/**
 * The door.
 *
 * A route of its own rather than a component the console swaps in, so the gate
 * can live on the server. The old arrangement rendered the whole console and
 * then hid it behind a check on a name in localStorage, which meant the markup
 * had already been sent.
 *
 * The chrome belongs to neither side: a door is not a shopfront and not a
 * counter, so it sits outside both route groups and carries no header or footer.
 * What it gets instead is the sheet, drawn on the drafting ground the rest of
 * the shop is set on, with a title block at the head and the counter's address
 * at the foot. Sitting outside `(shop)` also keeps `PageCurtain` off it, which
 * is right: a wipe belongs between two pages of a shop, and this is the door.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  const desk = await readDesk()

  // Already through the door. Handled here rather than in the proxy matcher,
  // which stays limited to the two gated subtrees.
  if (desk) redirect(landing(desk.role, next))

  return (
    <main className="drafting flex min-h-screen items-center justify-center bg-panel px-4 py-10">
      <div className="w-full max-w-md border border-rule bg-paper">
        {/* The title block. On a drawing it says what the sheet is and whose it
            is, and it is the way back to the shop for anybody who arrived on a
            bookmark and wanted the storefront. */}
        <div className="flex items-center justify-between gap-4 border-b border-rule px-6 py-4">
          <Link
            href="/"
            title="Back to the shop"
            className="transition-opacity hover:opacity-70"
          >
            <Logo height={34} alt="AllFix By Kipekee, back to the shop" />
          </Link>
          <span className="callout">Counter console</span>
        </div>

        <div className="px-6 py-7">
          <h1 className="font-display text-2xl font-bold tracking-tight">The back of the shop.</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate">
            Prices, the parts still waiting on a photograph, and whoever has called in today.
            Everything a customer never sees.
          </p>

          <SignInForm
            logins={SEEDED_LOGINS}
            next={safeNext(next)}
            secured={SEEDED_DOOR_IS_LOCKED}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule bg-panel px-6 py-3">
          <span className="callout">
            {SHOP.street}, {SHOP.area}
          </span>
          <a href={`tel:${SHOP.phoneIntl}`} className="font-mono text-xs text-slate hover:text-ink">
            {SHOP.phone}
          </a>
        </div>
      </div>
    </main>
  )
}
