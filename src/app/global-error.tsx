"use client"

import { Fault } from "@/components/Fault"
import { SHOP } from "@/lib/format"
import "./globals.css"

/**
 * When the root layout itself is what failed.
 *
 * This file replaces the root layout rather than rendering inside it, so it
 * carries its own document and cannot lean on anything the layout sets up: no
 * fonts, no head scripts, and therefore no stored theme. It is deliberately
 * light, because a screen that cannot read the theme should pick one rather
 * than inherit whatever the operating system happens to say.
 *
 * The stylesheet is imported here for the same reason. Without it this page
 * arrives as unstyled black on white, which is exactly the impression a shop
 * cannot afford at the moment something has gone badly wrong. The inline colours
 * on `body` are the belt to that braces: if the stylesheet is the thing that
 * failed to load, the page is still legible.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <html lang="en-KE">
      <body style={{ background: "#ffffff", color: "#16151a" }}>
        <title>Something went wrong | AllFix By Kipekee</title>
        <Fault
          code={error.digest ? `500 · ${error.digest}` : "500"}
          art="cloth"
          title="The whole shop came down."
          body="Not one page this time: the site itself failed to start. Trying again is worth one go, and after that the counter is the faster route."
        >
          <button
            type="button"
            onClick={retry}
            className="rounded-sm bg-oxblood px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
          >
            Try that again
          </button>
          <a
            href={`tel:${SHOP.phoneIntl}`}
            className="rounded-sm border border-ink px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Call {SHOP.phone}
          </a>
        </Fault>
      </body>
    </html>
  )
}
