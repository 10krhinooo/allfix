"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useCart, setQuantity, removeFromCart, clearCart, MAX_QUANTITY } from "@/lib/cart"
import { buyable, type BasketPart } from "@/lib/basket"
import { price } from "@/lib/format"
import { useTier } from "@/lib/tier-client"
import { ratePhrase, unitFor } from "@/lib/tiers"
import { Empty } from "@/components/ui"

/**
 * The basket, drawn.
 *
 * A line whose part is priced on request stays in the basket and is marked
 * rather than being silently dropped. Somebody put it there on purpose, and the
 * right answer is to tell them the counter has to quote it, not to make it
 * disappear between one page and the next.
 *
 * The total is described as ours to confirm, because it is: the server prices
 * the order from the catalogue and the caller's tier, and this figure is the
 * local catalogue's best guess for display.
 */
export function CartLines({
  catalogue,
  children,
}: {
  catalogue: Record<string, BasketPart>
  /** The checkout action, rendered by the server page so it can read the session. */
  children?: React.ReactNode
}) {
  const cart = useCart()
  // The basket is the same basket whoever is holding it. What changes for a
  // trade account is what each line costs, and the figure is worked out here
  // the same way the order endpoint works it out from the cookie.
  const { tier } = useTier()
  // Confirmed rather than immediate. Emptying a basket somebody spent ten
  // minutes filling is not something to do on a mis-tap, and there is no undo.
  const [confirming, setConfirming] = useState(false)

  if (cart.lines.length === 0) {
    return (
      <Empty title="Your basket is empty">
        <p>Browse the parts that fit your rail and add what you need.</p>
        <Link
          href="/shop"
          className="mt-5 inline-block bg-oxblood px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
        >
          Shop the range
        </Link>
      </Empty>
    )
  }

  const known = cart.lines.map((line) => ({ line, part: catalogue[line.sku] }))
  const priced = known.filter(({ part }) => buyable(part))
  const onRequest = known.filter(({ part }) => part && !buyable(part))
  const missing = known.filter(({ part }) => !part)

  const unit = (part: BasketPart) => unitFor({ priceKes: part.priceKes }, tier) ?? 0
  const subtotal = priced.reduce((sum, { line, part }) => sum + unit(part!) * line.quantity, 0)
  const list = priced.reduce(
    (sum, { line, part }) => sum + (part!.priceKes ?? 0) * line.quantity,
    0,
  )

  return (
    <>
      <ul className="border-t border-rule">
        {known.map(({ line, part }) => (
          <li key={line.sku} className="flex gap-4 border-b border-rule py-5">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-rule bg-panel">
              {part?.image ? (
                <Image
                  src={part.image}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full items-center justify-center font-mono text-[10px] text-mute">
                  no shot
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              {part ? (
                <Link
                  href={`/product/${part.slug}`}
                  className="font-medium text-ink hover:text-oxblood"
                >
                  {part.name}
                </Link>
              ) : (
                <span className="font-medium text-ink">{line.sku}</span>
              )}
              <p className="mt-0.5 font-mono text-[11px] text-mute">{line.sku}</p>

              {!part ? (
                <p className="mt-1 text-sm text-oxblood">
                  We no longer stock this one. Remove it to carry on.
                </p>
              ) : !buyable(part) ? (
                <p className="mt-1 text-sm text-slate">
                  Priced on request. The counter will quote it, and it can go on the same
                  order.
                </p>
              ) : (
                <p className="mt-1 font-mono text-sm text-slate">
                  {price(unit(part), part.priceBasis)}
                  {tier === "trade" && (
                    <span className="ml-2 text-mute line-through">{price(part.priceKes)}</span>
                  )}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2">
                  <span className="callout">Qty</span>
                  <input
                    type="number"
                    min={1}
                    max={MAX_QUANTITY}
                    value={line.quantity}
                    onChange={(event) => setQuantity(line.sku, Number(event.target.value))}
                    className="w-20 border-b border-rule bg-transparent py-1 text-right font-mono text-sm text-ink outline-none focus:border-ink"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeFromCart(line.sku)}
                  className="callout hover:text-oxblood"
                >
                  Remove
                </button>
              </div>
            </div>

            {part && buyable(part) && (
              <p className="shrink-0 font-mono text-sm text-ink">
                {price(unit(part) * line.quantity)}
              </p>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <span className="callout">Subtotal</span>
          <span className="ml-3 font-mono text-2xl text-ink">{price(subtotal)}</span>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-slate">
          {tier === "trade" && (
            <span className="mb-1 block text-ink">
              At {ratePhrase(tier)}, against {price(list)} list.
            </span>
          )}
          Delivery is quoted by county and confirmed with your order. We confirm the final
          figure before anything is charged.
        </p>
      </div>

      {(onRequest.length > 0 || missing.length > 0) && (
        <p className="mt-4 border-l-2 border-brass bg-brass-soft px-3 py-2 text-sm leading-relaxed text-ink">
          {missing.length > 0
            ? "Remove the parts we no longer stock and you can check the rest out."
            : "The parts priced on request are not in the subtotal. Check the rest out and we will quote those separately, or send the whole list over and we will price it in one go."}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {children}

        {confirming ? (
          <span className="flex flex-wrap items-center gap-3 text-sm text-ink">
            Empty the whole basket?
            <button
              type="button"
              onClick={() => {
                clearCart()
                setConfirming(false)
              }}
              className="callout text-oxblood hover:text-oxblood-deep"
            >
              Yes, empty it
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="callout hover:text-ink"
            >
              Keep it
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="ml-auto callout hover:text-oxblood"
          >
            Empty the basket
          </button>
        )}
      </div>
    </>
  )
}
