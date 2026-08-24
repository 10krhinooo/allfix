"use client"

import Link from "next/link"
import { useCartCount } from "@/lib/cart"

/**
 * The basket in the header.
 *
 * Always there, on every page and at every width. A basket that only appears
 * once something is in it is a basket a first time visitor never learns the
 * shop has, and somebody halfway through gathering parts has no fixed place to
 * look. The count is what changes, not whether the control exists.
 *
 * The count comes from `localStorage`, so it is zero on the server and correct
 * after hydration. That is the right way round: the alternative is rendering a
 * count on the server that is wrong for everybody. The badge is suppressed at
 * zero rather than showing "0", which is the one piece of it worth hiding.
 */
export function BasketLink({ className = "" }: { className?: string }) {
  const count = useCartCount()

  return (
    <Link
      href="/cart"
      aria-label={count === 0 ? "Basket, empty" : `Basket, ${count} ${count === 1 ? "part" : "parts"}`}
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-sm transition-colors hover:text-oxblood ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 5h2l2.2 10.2a1.5 1.5 0 0 0 1.47 1.18h8.1a1.5 1.5 0 0 0 1.47-1.18L20 8H6" />
        <circle cx="9.5" cy="20" r="1.2" />
        <circle cx="17" cy="20" r="1.2" />
      </svg>

      {/* A badge rather than a number beside the glyph, so the control keeps one
          width whatever is in it and the row does not shuffle as parts go in.
          Suppressed at zero: an empty basket does not need a "0" on it. */}
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-oxblood px-1 font-mono text-[10px] font-bold text-white"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  )
}
