import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { DEMO_LOGINS } from "@/lib/admin/accounts"
import { readDesk } from "@/lib/admin/guard"
import { landing, safeNext } from "@/lib/admin/roles"
import { SignInForm } from "@/components/admin/SignInForm"

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
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="stage flex flex-col justify-between p-8 sm:p-12">
        <span className="font-display text-lg font-bold tracking-tight">AllFix By Kipekee</span>
        <div>
          <p className="callout">Counter console</p>
          <p className="display-lg mt-3 max-w-[14ch] font-display font-bold tracking-tight">
            The back of the shop.
          </p>
          <p className="mt-4 max-w-sm leading-relaxed text-stage-mute">
            Prices, the parts still waiting on a photograph, and whoever has called in
            today. Everything a customer never sees.
          </p>
        </div>
        <p className="font-mono text-xs text-stage-mute">Njugu Lane, Nairobi CBD</p>
      </div>

      <div className="flex items-center justify-center bg-paper p-8 sm:p-12">
        <SignInForm logins={DEMO_LOGINS} next={safeNext(next)} />
      </div>
    </div>
  )
}
