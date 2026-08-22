import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { SEEDED_LOGINS } from "@/lib/admin/accounts"
import { readDesk } from "@/lib/admin/guard"
import { landing, safeNext } from "@/lib/admin/roles"
import { SignInForm } from "@/components/admin/SignInForm"
import { AuthScene } from "@/components/admin/AuthScene"

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
 * What it gets instead is `AuthScene`, a rail with the cloth gathered at both
 * walls. Being outside `(shop)` also keeps `PageCurtain` off it, which matters
 * here more than anywhere: a transition curtain drawing across a screen that is
 * already curtains is the same cloth twice at two different scales.
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
    <AuthScene>
      <SignInForm logins={SEEDED_LOGINS} next={safeNext(next)} />
    </AuthScene>
  )
}
