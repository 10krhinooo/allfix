"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import type { DeskRow } from "@/lib/admin/rows"
import { useAdmin, setPrice } from "@/lib/admin/store"
import type { PriceEdit } from "@/lib/admin/store"
import { currentPrice, isSellable, samePrice } from "@/lib/admin/pricing"
import { PageHead } from "@/components/admin/parts"
import { PriceRow } from "@/components/admin/PriceRow"

/**
 * The worksheet.
 *
 * This screen is the reason the project exists. The WooCommerce site it
 * replaces had every product priced 0 in the wrong currency and so could not
 * take an order; the catalogue that came out of the migration carries real
 * figures for most parts and an honest blank for the rest, and this is where
 * the rest get filled in.
 *
 * It is built as a worksheet rather than as a table of records with an edit
 * button per row. Somebody working down a price list has the list in one hand
 * and wants to type, tab, type, tab. Anything that puts a dialog between them
 * and the next figure turns twenty minutes of work into an afternoon.
 */

type Show = "all" | "unpriced" | "priced" | "words" | "edited"

/** Stable, so the memo below is not invalidated by a fresh empty set each render. */
const EMPTY: ReadonlySet<string> = new Set()

const SHOWS: { value: Show; label: string }[] = [
  { value: "unpriced", label: "Cannot be sold" },
  { value: "words", label: "Priced in words" },
  { value: "priced", label: "Priced" },
  { value: "edited", label: "Changed here" },
  { value: "all", label: "Everything" },
]

export function Prices({
  rows,
  components,
  groups,
}: {
  rows: DeskRow[]
  components: { slug: string; name: string }[]
  groups: string[]
}) {
  const params = useSearchParams()
  const state = useAdmin()

  const [show, setShow] = useState<Show>(() => readShow(params.get("show")))
  const [query, setQuery] = useState(() => params.get("q") ?? "")
  const [group, setGroup] = useState(() => params.get("group") ?? "")
  const [component, setComponent] = useState(() => params.get("part") ?? "")

  // The URL mirrors the view rather than driving it, the same arrangement the
  // shop's browser uses: typing must not run a navigation per keystroke, but a
  // link somebody copies out of the address bar has to open on what they saw.
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const timer = setTimeout(() => {
      const next = new URLSearchParams()
      if (show !== "all") next.set("show", show)
      if (query.trim()) next.set("q", query.trim())
      if (group) next.set("group", group)
      if (component) next.set("part", component)
      const search = next.toString()
      window.history.replaceState(window.history.state, "", search ? `/admin/prices?${search}` : "/admin/prices")
    }, 250)
    return () => clearTimeout(timer)
  }, [show, query, group, component])

  /**
   * Rows edited under the current filter, kept visible even once they stop
   * matching it.
   *
   * Without this, filling in a price while the worksheet is showing "cannot be
   * sold" makes the row vanish from under the cursor: the edit is what stops it
   * matching. Everything below jumps up, and the next figure gets typed into the
   * wrong part. A held row stays until the filter is touched again, which is the
   * moment somebody is actually asking for the list to be rebuilt.
   *
   * Stamped with the filter it was collected under rather than cleared by an
   * effect when the filter changes. A stale stamp simply stops matching, which
   * needs no effect, no extra render, and cannot leave the set holding rows from
   * a view nobody is looking at any more.
   */
  const filter = `${show}|${group}|${component}|${query.trim()}`
  const [held, setHeld] = useState({ filter, slugs: new Set<string>() })
  const heldNow = held.filter === filter ? held.slugs : EMPTY

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return rows.filter((row) => {
      const now = currentPrice(row, state.prices)
      if (heldNow.has(row.slug)) return true
      if (show === "unpriced" && isSellable(now)) return false
      if (show === "priced" && !isSellable(now)) return false
      if (show === "words" && (isSellable(now) || !now.priceNote)) return false
      if (show === "edited" && !state.prices[row.slug]) return false
      if (group && row.group !== group) return false
      if (component && row.component !== component) return false
      if (needle && !row.name.toLowerCase().includes(needle) && !row.ref.toLowerCase().includes(needle)) {
        return false
      }
      return true
    })
  }, [rows, state.prices, show, group, component, query, heldNow])

  const unpriced = rows.filter((row) => !isSellable(currentPrice(row, state.prices))).length
  const changed = Object.keys(state.prices).length

  function save(row: DeskRow, next: PriceEdit, reason: string | null) {
    const from = currentPrice(row, state.prices)
    // An edit that changes nothing writes no history. A log full of no-ops is
    // one nobody reads, and a worksheet that saves on every blur will produce
    // them by the dozen.
    if (samePrice(from, next)) return
    setHeld((previous) => ({
      filter,
      slugs: new Set(previous.filter === filter ? [...previous.slugs, row.slug] : [row.slug]),
    }))
    setPrice(row, from, next, reason)
  }

  return (
    <>
      <PageHead
        title="Prices"
        lead={
          unpriced === 0
            ? "Every part in the catalogue carries a figure."
            : `${unpriced} of ${rows.length} parts cannot be sold, because nobody has priced them yet. A part left blank shows "price on request" on the shop and can still be asked about.`
        }
      >
        <p className="max-w-xs border-l-2 border-brass bg-brass-soft px-3 py-2 text-xs leading-relaxed">
          Edits are held in this browser only, until the backend is deployed.
        </p>
      </PageHead>

      <div className="sticky top-[3.25rem] z-30 border-b border-rule bg-paper px-5 py-3 sm:px-8">
        <div className="flex flex-wrap items-center gap-2">
          {SHOWS.map((option) => {
            const active = show === option.value
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => setShow(option.value)}
                className={`rounded-sm border px-3 py-1.5 text-xs transition-colors ${
                  active
                    ? "border-ink bg-ink text-paper"
                    : "border-rule text-slate hover:border-ink hover:text-ink"
                }`}
              >
                {option.label}
              </button>
            )
          })}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name or SKU"
              aria-label="Search by name or SKU"
              className="w-44 rounded-sm border border-rule bg-paper px-3 py-1.5 text-sm outline-none focus:border-ink"
            />
            <select
              value={group}
              onChange={(event) => setGroup(event.target.value)}
              aria-label="Rail system or rod finish"
              className="rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm outline-none focus:border-ink"
            >
              <option value="">Every system</option>
              {groups.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={component}
              onChange={(event) => setComponent(event.target.value)}
              aria-label="Part type"
              className="rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm outline-none focus:border-ink"
            >
              <option value="">Every part</option>
              {components.map((part) => (
                <option key={part.slug} value={part.slug}>
                  {part.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-2 font-mono text-[11px] text-mute">
          {visible.length} of {rows.length} parts
          {changed > 0 ? `, ${changed} changed here` : ""}
        </p>
      </div>

      {visible.length === 0 ? (
        <p className="px-5 py-16 text-center text-sm text-slate sm:px-8">
          Nothing matches. Widen the filters above.
        </p>
      ) : (
        <ul className="bg-paper">
          {visible.map((row) => (
            <PriceRow
              key={row.slug}
              row={row}
              value={currentPrice(row, state.prices)}
              edited={Boolean(state.prices[row.slug])}
              onSave={save}
            />
          ))}
        </ul>
      )}
    </>
  )
}

/** Unknown values are dropped rather than filtering the worksheet to nothing. */
function readShow(raw: string | null): Show {
  return SHOWS.some((option) => option.value === raw) ? (raw as Show) : "all"
}
