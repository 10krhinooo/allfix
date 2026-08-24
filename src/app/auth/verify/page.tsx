import type { Metadata } from "next"
import Link from "next/link"
import { verifyEmail } from "@/lib/admin/registration"
import { Sheet } from "@/components/auth/Sheet"

export const metadata: Metadata = {
  title: "Confirming your email",
  robots: { index: false, follow: false },
}

/**
 * The other end of the registration email.
 *
 * Verified on the server as the page renders, so somebody following the link
 * lands on the answer rather than on a spinner and a second request. A failure
 * here is nearly always an expired or already used link, which is why the way
 * out is "ask for another" rather than "try again".
 */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>
}) {
  const { token } = await searchParams
  const one = Array.isArray(token) ? token[0] : token
  const outcome = one ? await verifyEmail(one) : null

  const ok = outcome?.ok ?? false

  return (
    <Sheet
      label="Email confirmation"
      stageLine={ok ? "That is you. Come in." : "Njugu Lane, and a counter with real people behind it."}
      title={ok ? "That is confirmed." : "That link did not work."}
      lead={
        ok
          ? "Your address is verified. You can sign in now."
          : (outcome?.message ??
            "This link is missing its token. Open it straight from the email rather than copying part of it.")
      }
    >
      <div className="mt-7">
        <Link
          href={ok ? "/sign-in" : "/auth/forgot"}
          className="inline-block bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
        >
          {ok ? "Sign in" : "Ask for a new link"}
        </Link>
      </div>
    </Sheet>
  )
}
