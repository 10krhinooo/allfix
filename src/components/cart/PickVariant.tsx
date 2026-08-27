"use client"

import { useState } from "react"
import { AddToCart } from "@/components/cart/AddToCart"

/**
 * Choosing the finish, on the two parts that are only sold as one.
 *
 * Curtain buckles and tape hooks have no SKU of their own, because they are not
 * a part: they are a group of seven finishes and two materials, each of which is
 * a part with its own code. The page showed the group's price and a read-only
 * list of the finishes, and then no basket button at all, because the button was
 * gated on a SKU the group does not have. So two things the shop stocks, both
 * priced, both in stock, said "KES 500" on the card and could not be bought.
 * The comment beside that gate said there was no cart yet, which stopped being
 * true when the cart landed.
 *
 * Nothing is preselected. A metal hook is 150 a box and a plastic one is 300
 * each, so defaulting to whichever the migration happened to sort first would
 * put a different thing in the basket than the person meant, at a different
 * price, in a different unit. The button appears once the choice is made rather
 * than sitting there disabled, because a control you cannot use is not an
 * explanation of why.
 */

export interface Pickable {
  sku: string
  label: string
  swatch: string
  /** Already formatted on the server, basis and all: "KES 150 per box". */
  priceLabel: string
  buyable: boolean
}

export function PickVariant({ options, axis }: { options: Pickable[]; axis: string }) {
  const [chosen, setChosen] = useState<string | null>(null)
  const picked = options.find((o) => o.sku === chosen)

  return (
    <div className="mt-7">
      <fieldset>
        <legend className="callout">{axis}</legend>
        <ul className="mt-3 flex flex-wrap gap-2">
          {options.map((option) => {
            const active = option.sku === chosen
            return (
              <li key={option.sku}>
                <label
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-sm border px-3 py-1.5 text-sm transition-colors ${
                    active ? "border-ink bg-brass-soft" : "border-rule hover:border-ink"
                  } ${option.buyable ? "" : "opacity-55"}`}
                >
                  <input
                    type="radio"
                    name="variant"
                    value={option.sku}
                    checked={active}
                    disabled={!option.buyable}
                    onChange={() => setChosen(option.sku)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="h-3.5 w-3.5 rounded-full border border-rule"
                    style={{ background: option.swatch }}
                  />
                  {option.label}
                  <span className="font-mono text-xs text-mute">{option.priceLabel}</span>
                </label>
              </li>
            )
          })}
        </ul>
      </fieldset>

      <div className="mt-6" aria-live="polite">
        {picked ? (
          <AddToCart key={picked.sku} sku={picked.sku} />
        ) : (
          <p className="text-sm text-slate">
            Choose {axis.toLowerCase() === "finish" ? "a finish" : "an option"} and it goes in
            your basket at that price.
          </p>
        )}
      </div>
    </div>
  )
}
