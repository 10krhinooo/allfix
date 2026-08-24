"use client"

import Link from "next/link"
import { useCartCount } from "@/lib/cart"

/**
 * The basket in the header.
 *
 * Renders nothing at all while the basket is empty. A permanently visible
 * empty basket is a permanent reminder of a thing not done, and this shop's
 * header is already carrying a phone number and a door.
 *
 * The count comes from `localStorage`, so it is zero on the server and correct
 * after hydration. That is the right way round: the alternative is rendering a
 * count on the server that is wrong for everybody.
 */
export function BasketLink({ className = "" }: { className?: string }) {
  const count = useCartCount()
  if (count === 0) return null

  return (
    <Link
      href="/cart"
      className={`flex items-center gap-2 text-sm transition-colors hover:text-oxblood ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-[18px] w-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path d="M3 5h2l2.2 10.2a1.5 1.5 0 0 0 1.47 1.18h8.1a1.5 1.5 0 0 0 1.47-1.18L20 8H6" />
        <circle cx="9.5" cy="20" r="1.2" />
        <circle cx="17" cy="20" r="1.2" />
      </svg>
      <span className="sr-only">Basket, </span>
      <span className="font-mono text-xs">{count}</span>
    </Link>
  )
}
