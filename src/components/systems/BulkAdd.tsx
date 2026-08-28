"use client"

import { useCallback, useMemo, useState } from "react"
import { useFades } from "@/lib/notice"
import { addToCart, MAX_QUANTITY, useCart } from "@/lib/cart"
import { price } from "@/lib/format"
import { useTier } from "@/lib/tier-client"
import { ratePhrase, unitFor } from "@/lib/tiers"

/**
 * Forty runners and twelve brackets, without opening two product pages.
 *
 * A fundi fitting out a block already knows what the rail takes; what they are
 * doing on this page is counting. The product page is the right screen for
 * deciding whether a part fits, and the wrong one for ordering nine of them and
 * then going back for the next line. So the same list the page already shows
 * takes quantities directly, and everything with a number against it goes into
 * the basket in one action.
 *
 * Parts priced on request are listed and cannot be given a quantity, for the
 * same reason there is no basket button on their product page: the order
 * endpoint refuses to check one out, and a field whose only outcome is a
 * refusal three screens later is worse than no field.
 *
 * The figures are at the visitor's own tier, which for a trade account is the
 * rate their order will actually be priced at. It is still the server that
 * decides the charge.
 */

export interface BulkPart {
  sku: string
  name: string
  component: string
  priceKes: number | null
  priceBasis: string
}

export function BulkAdd({ parts, system }: { parts: BulkPart[]; system: string }) {
  const { tier } = useTier()
  const cart = useCart()
  const [open, setOpen] = useState(false)
  const [wanted, setWanted] = useState<Record<string, number>>({})
  const [added, setAdded] = useState<number | null>(null)

  useFades(added !== null, useCallback(() => setAdded(null), []))

  const priced = useMemo(() => parts.filter((part) => (part.priceKes ?? 0) > 0), [parts])
  const onRequest = parts.length - priced.length

  const unit = (part: BulkPart) => unitFor({ priceKes: part.priceKes }, tier) ?? 0
  const lines = priced.filter((part) => (wanted[part.sku] ?? 0) > 0)
  const total = lines.reduce((sum, part) => sum + unit(part) * (wanted[part.sku] ?? 0), 0)

  function set(sku: string, raw: string) {
    setAdded(null)
    const value = Number(raw)
    setWanted((previous) => ({
      ...previous,
      // An empty field is somebody clearing it, which is zero rather than one:
      // this is a list where most rows are meant to stay blank.
      [sku]: Number.isFinite(value) ? Math.min(Math.max(Math.round(value), 0), MAX_QUANTITY) : 0,
    }))
  }

  function add() {
    if (lines.length === 0) return
    for (const part of lines) addToCart(part.sku, wanted[part.sku]!)
    setAdded(lines.length)
    setWanted({})
  }

  if (priced.length === 0) return null

  return (
    <section className="mt-14 border border-rule">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-rule bg-panel px-5 py-4 sm:px-6">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Order several at once
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate">
            Set the quantities against the {system} parts you need and add the whole lot to the
            basket in one go.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((was) => !was)}
          aria-expanded={open}
          className="shrink-0 border border-ink px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          {open ? "Close the list" : `Open the list of ${priced.length}`}
        </button>
      </div>

      {open && (
        <div className="px-5 py-5 sm:px-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-rule text-left">
                  <th scope="col" className="callout py-2 pr-4 font-normal">
                    Part
                  </th>
                  <th scope="col" className="callout py-2 pr-4 text-right font-normal">
                    {tier === "trade" ? "Your rate" : "Price"}
                  </th>
                  <th scope="col" className="callout py-2 pr-4 text-right font-normal">
                    Quantity
                  </th>
                  <th scope="col" className="callout py-2 text-right font-normal">
                    Line
                  </th>
                </tr>
              </thead>
              <tbody>
                {priced.map((part) => {
                  const quantity = wanted[part.sku] ?? 0
                  const inBasket = cart.lines.find((line) => line.sku === part.sku)
                  return (
                    <tr key={part.sku} className="border-b border-rule align-top">
                      <td className="py-3 pr-4">
                        <span className="block text-ink">{part.name}</span>
                        <span className="mt-0.5 block font-mono text-[11px] text-mute">
                          {part.sku} · {part.component}
                          {inBasket ? ` · ${inBasket.quantity} in your basket` : ""}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-slate">
                        {price(unit(part), part.priceBasis)}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <label>
                          <span className="sr-only">How many {part.name}</span>
                          <input
                            type="number"
                            min={0}
                            max={MAX_QUANTITY}
                            value={quantity === 0 ? "" : quantity}
                            placeholder="0"
                            onChange={(event) => set(part.sku, event.target.value)}
                            className="w-20 border-b border-rule bg-transparent py-1 text-right font-mono text-sm text-ink outline-none focus:border-ink"
                          />
                        </label>
                      </td>
                      <td className="py-3 text-right font-mono text-ink">
                        {quantity > 0 ? price(unit(part) * quantity) : ""}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {onRequest > 0 && (
            <p className="mt-4 text-sm leading-relaxed text-slate">
              {onRequest} more {onRequest === 1 ? "part is" : "parts are"} priced on request and
              cannot be added here. The counter quotes those, and they can go on the same order.
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate">
              <span className="callout">
                {lines.length} {lines.length === 1 ? "line" : "lines"}
              </span>
              <span className="ml-3 font-mono text-lg text-ink">{price(total)}</span>
              {tier === "trade" && <span className="ml-3 callout">at {ratePhrase(tier)}</span>}
            </p>
            <button
              type="button"
              onClick={add}
              disabled={lines.length === 0}
              className="bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep disabled:cursor-not-allowed disabled:opacity-55"
            >
              Add {lines.length > 0 ? `${lines.length} ` : ""}
              {lines.length === 1 ? "part" : "parts"} to the basket
            </button>
          </div>

          {added !== null && (
            <p
              role="status"
              className="mt-4 border-l-2 border-brass bg-brass-soft px-4 py-3 text-sm leading-relaxed text-ink"
            >
              {added} {added === 1 ? "part is" : "parts are"} in your basket. Carry on setting
              quantities, or go to the basket when you are done.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
