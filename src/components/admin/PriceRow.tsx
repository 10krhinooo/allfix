"use client"

import { useState } from "react"
import Link from "next/link"
import type { DeskRow } from "@/lib/admin/rows"
import type { PriceEdit } from "@/lib/admin/store"
import { BASES, priceProblem, toPrice } from "@/lib/admin/pricing"
import { Blank } from "@/components/admin/parts"

/**
 * One line of the worksheet.
 *
 * The price is a plain text field rather than a number input on purpose. A
 * number input treats an empty box and a zero as near neighbours, offers a
 * spinner nobody wants on a price, and silently swallows what it cannot parse.
 * Here the empty string is a real and common value, meaning "still unpriced",
 * and it has to survive being typed, cleared and typed again.
 *
 * Nothing saves while the field has focus. A part priced 1,200 passes through
 * 1, 12 and 120 on the way, and writing each of those to the history would
 * bury the real change under three that never happened.
 */
export function PriceRow({
  row,
  value,
  edited,
  onSave,
}: {
  row: DeskRow
  value: PriceEdit
  edited: boolean
  onSave: (row: DeskRow, next: PriceEdit, reason: string | null) => void
}) {
  const [draft, setDraft] = useState(value.priceKes === null ? "" : String(value.priceKes))
  const [note, setNote] = useState(value.priceNote ?? "")
  const [reason, setReason] = useState("")
  const [open, setOpen] = useState(false)

  /**
   * Follows the stored value when it changes underneath, which happens on the
   * first hydration from localStorage and when the console's edits are
   * cleared.
   *
   * Adjusted during render rather than in an effect. An effect would render the
   * stale draft once, then correct it, and React re-runs this component before
   * touching the DOM so the intermediate value is never seen. The comparison is
   * on the fields rather than on the object, because `currentPrice` builds a
   * fresh one every render for any part with no override, and comparing
   * identity would loop forever.
   */
  const stored = `${value.priceKes ?? ""}|${value.priceNote ?? ""}`
  const [seen, setSeen] = useState(stored)
  if (seen !== stored) {
    setSeen(stored)
    setDraft(value.priceKes === null ? "" : String(value.priceKes))
    setNote(value.priceNote ?? "")
  }

  const problem = priceProblem(draft)
  const sellable = value.priceKes !== null && value.priceKes > 0

  function commit(over: Partial<PriceEdit> = {}) {
    if (problem) return
    onSave(
      row,
      {
        priceKes: toPrice(draft),
        priceBasis: value.priceBasis,
        priceNote: note.trim() || null,
        ...over,
      },
      reason.trim() || null,
    )
    setReason("")
  }

  return (
    <li className={`border-b border-rule last:border-b-0 ${edited ? "bg-brass-soft/40" : ""}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-5">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="block max-w-full text-left"
          >
            <span className="block truncate text-sm font-medium text-ink">{row.name}</span>
            <span className="mt-0.5 flex flex-wrap items-baseline gap-x-3">
              <span className="font-mono text-[11px] text-mute">{row.ref}</span>
              <span className="text-xs text-slate">{row.group}</span>
              <span className="text-xs text-mute">{row.componentLabel}</span>
              {row.skus > 1 && <span className="text-xs text-mute">{row.skus} SKUs</span>}
              {!row.photographed && <span className="text-xs text-brass">no photo</span>}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-mute">KES</span>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => commit()}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur()
            }}
            inputMode="decimal"
            aria-label={`Price for ${row.name}`}
            aria-invalid={problem ? true : undefined}
            placeholder="blank"
            className={`w-28 rounded-sm border bg-paper px-2 py-1.5 text-right font-mono text-sm outline-none ${
              problem ? "border-oxblood text-oxblood" : "border-rule text-ink focus:border-ink"
            }`}
          />
          <select
            value={value.priceBasis}
            onChange={(event) => commit({ priceBasis: event.target.value as PriceEdit["priceBasis"] })}
            aria-label={`What that price buys for ${row.name}`}
            className="w-28 rounded-sm border border-rule bg-paper px-2 py-1.5 text-xs outline-none focus:border-ink"
          >
            {BASES.map((basis) => (
              <option key={basis.value} value={basis.value}>
                {basis.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {problem && (
        <p className="border-l-2 border-oxblood bg-oxblood/5 px-4 pb-2.5 pt-1 text-xs leading-relaxed text-oxblood sm:px-5">
          {problem}
        </p>
      )}

      {!problem && !sellable && !open && (
        <p className="px-4 pb-2.5 text-xs sm:px-5">
          {value.priceNote ? (
            <span className="text-slate">
              Quoted in words: <span className="text-ink">{value.priceNote}</span>
            </span>
          ) : (
            <Blank>waiting on a price</Blank>
          )}
        </p>
      )}

      {open && (
        <div className="border-t border-dashed border-rule bg-panel px-4 py-4 sm:px-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="callout">How it is quoted, in words</span>
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                onBlur={() => commit()}
                placeholder="Included in the track rate per metre"
                className="mt-1.5 w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
              />
              <span className="mt-1.5 block text-xs leading-relaxed text-slate">
                For a part the price list describes rather than costs. It shows in place of a
                figure, and is never guessed into a number.
              </span>
            </label>

            <label className="block">
              <span className="callout">Why, for the record</span>
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Supplier put it up in June"
                className="mt-1.5 w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
              />
              <span className="mt-1.5 block text-xs leading-relaxed text-slate">
                Optional, and saved with the next change to this part.
              </span>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate">
            <Link href={`/product/${row.slug}`} className="callout hover:text-ink">
              See it on the shop
            </Link>
            {row.imageName && (
              <span className="font-mono text-[11px] text-mute">
                waiting on {row.imageName}
              </span>
            )}
          </div>
        </div>
      )}
    </li>
  )
}
