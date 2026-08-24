"use client"

import { useState } from "react"
import Link from "next/link"
import { addToCart, setQuantity, useCart, MAX_QUANTITY } from "@/lib/cart"

/**
 * Putting a part in the basket, in the quantity you actually want.
 *
 * The count is set here rather than in the basket, because here is where
 * somebody knows it. They are looking at the runner, reading that it takes ten
 * to the metre, and working out that a four metre run needs forty; making them
 * add one and then go and change it to forty on another screen is asking them
 * to do the same job twice.
 *
 * After it is in, the same control keeps working on the line that is now in the
 * basket, so a second thought does not mean a trip to the basket either. The
 * confirmation replaces the button rather than sitting beside it, because the
 * useful next action has changed: it is no longer "add this" but "go and pay for
 * it, or carry on". A toast that fades would take the way to checkout with it.
 *
 * There is no control at all for a part priced on request. The server refuses to
 * check one out, so offering one here would be a button whose only outcome is a
 * refusal three screens later.
 */

const STEP =
  "flex h-11 w-11 shrink-0 items-center justify-center border border-rule text-lg text-ink " +
  "transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
function Stepper({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (next: number) => void
  label: string
}) {
  return (
    <div className="flex items-stretch">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="One fewer"
        className={`${STEP} rounded-l-sm border-r-0`}
      >
        &minus;
      </button>
      <label className="flex items-center">
        <span className="sr-only">{label}</span>
        <input
          type="number"
          min={1}
          max={MAX_QUANTITY}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-11 w-16 border border-rule bg-transparent text-center font-mono text-sm text-ink outline-none focus:border-ink"
        />
      </label>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_QUANTITY}
        aria-label="One more"
        className={`${STEP} rounded-r-sm border-l-0`}
      >
        +
      </button>
    </div>
  )
}

export function AddToCart({ sku }: { sku: string }) {
  const cart = useCart()
  const [wanted, setWanted] = useState(1)
  const [added, setAdded] = useState(false)
  const inBasket = cart.lines.find((line) => line.sku === sku)

  // An empty field is somebody midway through typing, not a zero, so it is held
  // rather than snapped back to 1 under the caret.
  const clean = (next: number) =>
    Number.isFinite(next) ? Math.min(Math.max(Math.round(next), 1), MAX_QUANTITY) : 1

  if (added && inBasket) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Stepper
            value={inBasket.quantity}
            onChange={(next) => setQuantity(sku, clean(next))}
            label="Quantity in your basket"
          />
          <p className="text-sm text-slate">in your basket</p>
        </div>
        <Link
          href="/cart"
          className="inline-block rounded-sm bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
        >
          Go to basket
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Stepper value={wanted} onChange={(next) => setWanted(clean(next))} label="How many" />
      <button
        type="button"
        onClick={() => {
          addToCart(sku, wanted)
          setAdded(true)
        }}
        className="rounded-sm bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
      >
        Add to basket
      </button>
    </div>
  )
}
