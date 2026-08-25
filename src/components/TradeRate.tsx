"use client"

import { useTier } from "@/lib/tier-client"
import { price } from "@/lib/format"
import { ratePhrase, unitFor } from "@/lib/tiers"

/**
 * What this part costs the account looking at it.
 *
 * It draws nothing at all for a retail visitor, which is most of them, and
 * nothing for a part priced on request: a discount off an absent price is not a
 * number. So the page reads exactly as it did unless there is a trade account
 * behind it, and then the rate is on the part rather than in a sentence on
 * another screen.
 *
 * The list figure stays, struck through. A trade customer is quoting their own
 * client from the same page, and the number they mark up from is the one they
 * pay, but the one they compare against is list.
 */
export function TradeRate({
  listKes,
  basis,
  tradeKes = null,
}: {
  listKes: number | null
  basis?: string
  /** The figure the counter has set for trade, where there is one. */
  tradeKes?: number | null
}) {
  const { tier, ready } = useTier()
  if (!ready || tier !== "trade") return null

  const yours = unitFor({ priceKes: listKes, tradeKes }, tier)
  if (yours === null) return null

  return (
    <div className="mt-4 border-l-2 border-brass bg-brass-soft px-4 py-3">
      <p className="callout">{ratePhrase(tier)}</p>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-3">
        <span className="font-mono text-xl font-medium text-ink">{price(yours, basis)}</span>
        <span className="font-mono text-sm text-mute line-through">{price(listKes)}</span>
      </p>
      <p className="mt-1 text-sm leading-relaxed text-slate">
        Your account rate, applied when the order is priced. The counter confirms it before
        anything is charged.
      </p>
    </div>
  )
}
