import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { SEEDED_DOOR_IS_LOCKED } from "@/lib/admin/accounts"
import { readDesk } from "@/lib/admin/guard"
import { landing, safeNext } from "@/lib/admin/roles"
import { SignInForm } from "@/components/admin/SignInForm"
import { Sheet } from "@/components/auth/Sheet"

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
 * The chrome belongs to neither side, so it comes from `Sheet`, which every
 * door in the shop now shares: the drawing sheet on the drafting ground, and
 * the dark house beside it running the rail sections. Registration and the
 * password screens are the same kind of object and wear the same thing.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string }>
}) {
  const { next, reset } = await searchParams
  const desk = await readDesk()

  // Already through the door. Handled here rather than in the proxy matcher,
  // which stays limited to the gated subtrees themselves.
  if (desk) redirect(landing(desk.role, next))

  return (
    <Sheet
      label="Sign in"
      title="Welcome back."
      lead="Your orders and the windows you have measured, the trade desk, or the counter. One door, and it knows where you belong."
      stageLine="The rail you already own, and the parts that fit it."
      footer={
        <span className="flex flex-wrap items-baseline justify-between gap-3">
          <Link href="/auth/forgot" className="text-oxblood underline underline-offset-4">
            Forgotten your password?
          </Link>
          <Link href="/auth/register" className="underline-offset-4 hover:text-ink hover:underline">
            Open an account
          </Link>
        </span>
      }
    >
      {reset && (
        <p
          role="status"
          className="mt-5 border-l-2 border-brass bg-brass-soft px-3 py-2 text-sm leading-relaxed text-ink"
        >
          Your password is set. Sign in with the new one.
        </p>
      )}

      <SignInForm next={safeNext(next)} secured={SEEDED_DOOR_IS_LOCKED} />
    </Sheet>
  )
}
