"use client"

import Link from "next/link"
import { useEffect } from "react"
import { Fault } from "@/components/Fault"
import { SHOP } from "@/lib/format"

/**
 * Something came off its runners.
 *
 * The boundary for everything under the root layout. `retry()` re-fetches and
 * re-renders the segment that threw, which is worth offering first: a failure
 * here is usually a request that did not land rather than a page that cannot
 * exist, and trying again is free.
 *
 * The phone number is the real fallback. A shop whose site is down is still a
 * shop with a counter on Njugu Lane, and the whole point of this rebuild is
 * that an order can actually be placed.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    // The digest is the only thing that ties this screen to the server log, and
    // production deliberately withholds the message, so it is what gets kept.
    console.error("Page failed", error.digest ?? error.message)
  }, [error])

  return (
    <Fault
      code={error.digest ? `500 · ${error.digest}` : "500"}
      art="cloth"
      title="Something came off its runners."
      body="The page failed on our side, not yours. Trying again usually fixes it, and if it does not, the counter can take the order over the phone."
    >
      <button
        type="button"
        onClick={retry}
        className="rounded-sm bg-oxblood px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
      >
        Try that again
      </button>
      <Link
        href="/"
        className="rounded-sm border border-ink px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
      >
        The shop
      </Link>
      <a href={`tel:${SHOP.phoneIntl}`} className="font-mono text-sm text-slate hover:text-ink">
        or call {SHOP.phone}
      </a>
    </Fault>
  )
}
