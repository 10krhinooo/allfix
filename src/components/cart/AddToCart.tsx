"use client"

import { useState } from "react"
import Link from "next/link"
import { addToCart, useCart } from "@/lib/cart"

/**
 * Putting a part in the basket.
 *
 * The confirmation replaces the button rather than appearing beside it, because
 * the useful next action changes the moment something is in the basket: it is
 * no longer "add this" but "go and pay for it, or carry on". A toast that fades
 * would take the way to checkout with it.
 *
 * There is no button at all for a part priced on request. The server refuses to
 * check one out, so offering it here would be a button whose only outcome is a
 * refusal three screens later.
 */
export function AddToCart({ sku, quantity = 1 }: { sku: string; quantity?: number }) {
  const cart = useCart()
  const [added, setAdded] = useState(false)
  const inBasket = cart.lines.find((line) => line.sku === sku)

  if (added && inBasket) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-ink">
          <span className="font-mono">{inBasket.quantity}</span> in your basket
        </p>
        <Link
          href="/cart"
          className="rounded-sm bg-oxblood px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
        >
          Go to basket
        </Link>
        <button
          type="button"
          onClick={() => addToCart(sku, quantity)}
          className="callout hover:text-ink"
        >
          Add another
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        addToCart(sku, quantity)
        setAdded(true)
      }}
      className="rounded-sm bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
    >
      Add to basket
    </button>
  )
}
