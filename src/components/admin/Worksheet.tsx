"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { DeskRow } from "@/lib/admin/rows"
import { price as savePrice } from "@/app/admin/parts/actions"
import { currentPrice, isSellable, samePrice, type PriceEdit } from "@/lib/admin/pricing"
import {
  PageHead,
  Stats,
  Stat,
  Card,
  EmptyState,
  Note,
  Choices,
  Toolbar,
} from "@/components/admin/parts"
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
 *
 * Prices and the shot list used to be two screens. They were two lenses on one
 * object: both listed parts, both answered a version of "why can this not be
 * sold yet", and both were filtered the same way. Splitting them meant knowing
 * in advance whether a part's problem was money or photography, which is
 * exactly what somebody at the counter does not know yet. One list, filtered by
 * what is missing, answers the question they actually have.
 */

type Show = "all" | "unpriced" | "priced" | "words" | "unshot" | "ready"

/** Stable, so the memo below is not invalidated by a fresh empty set each render. */
const EMPTY: ReadonlySet<string> = new Set()

const SHOWS: { value: Show; label: string }[] = [
  { value: "unpriced", label: "Cannot be sold" },
  { value: "unshot", label: "No photograph" },
  { value: "words", label: "Priced in words" },
  { value: "ready", label: "Ready to sell" },
  { value: "priced", label: "Priced" },
  { value: "all", label: "Everything" },
]

export function Worksheet({
  rows,
  components,
  groups,
}: {
  rows: DeskRow[]
  components: { slug: string; name: string }[]
  groups: string[]
}) {
  const params = useSearchParams()

  const [show, setShow] = useState<Show>(() => readShow(params.get("show")))
  const [query, setQuery] = useState(() => params.get("q") ?? "")
  const [group, setGroup] = useState(() => params.get("group") ?? "")
  const [component, setComponent] = useState(() => params.get("part") ?? "")
  const [copied, setCopied] = useState(false)
  const [busy, start] = useTransition()
  const [problem, setProblem] = useState<string | null>(null)

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
      window.history.replaceState(window.history.state, "", search ? `/admin/parts?${search}` : "/admin/parts")
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
      const now = currentPrice(row)
      if (heldNow.has(row.slug)) return true
      if (show === "unpriced" && isSellable(now)) return false
      if (show === "priced" && !isSellable(now)) return false
      if (show === "words" && (isSellable(now) || !now.priceNote)) return false
      if (show === "unshot" && row.photographed) return false
      if (show === "ready" && (!isSellable(now) || !row.photographed)) return false
      if (group && row.group !== group) return false
      if (component && row.component !== component) return false
      if (needle && !row.name.toLowerCase().includes(needle) && !row.ref.toLowerCase().includes(needle)) {
        return false
      }
      return true
    })
  }, [rows, show, group, component, query, heldNow])

  const unpriced = rows.filter((row) => !isSellable(currentPrice(row))).length
  const unshot = rows.filter((row) => !row.photographed).length
  const ready = rows.filter((row) => isSellable(currentPrice(row)) && row.photographed).length

  function save(row: DeskRow, next: PriceEdit, reason: string | null) {
    // An edit that changes nothing writes no history. A log full of no-ops is
    // one nobody reads, and a worksheet that saves on every blur will produce
    // them by the dozen.
    if (samePrice(currentPrice(row), next)) return

    setHeld((previous) => ({
      filter,
      slugs: new Set(previous.filter === filter ? [...previous.slugs, row.slug] : [row.slug]),
    }))
    setProblem(null)

    start(async () => {
      // The whole pricing block every time, including the fields nobody
      // touched. The endpoint is a replacement rather than a patch, and
      // deliberately so: clearing a price is a real edit, and a shape that
      // could not say that would make it indistinguishable from leaving it be.
      const answer = await savePrice(row.slug, {
        priceKes: next.priceKes,
        priceBasis: next.priceBasis,
        priceNote: next.priceNote,
        tradePriceKes: row.tradePriceKes ?? null,
        reason,
      })
      if (!answer.ok) setProblem(`${row.ref}: ${answer.message}`)
    })
  }

  /**
   * The photographer's brief, as text.
   *
   * Carried over from the shot list, which is the one thing that screen did
   * that a worksheet row cannot: a photographer wants the whole list grouped by
   * system, in something they can paste into a message, not a filtered table.
   */
  async function copyBrief() {
    const waiting = visible.filter((row) => !row.photographed)
    const groupsInOrder = [...new Set(waiting.map((row) => row.group))]
    const brief = groupsInOrder
      .map((name) => {
        const inGroup = waiting.filter((row) => row.group === name)
        return `${name} (${inGroup.length})\n${inGroup
          .map((row) => `  ${row.ref}  ${row.name}  ${row.imageName ?? "no filename set"}`)
          .join("\n")}`
      })
      .join("\n\n")

    try {
      await navigator.clipboard.writeText(brief)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // The list is on the screen either way, so a refused clipboard is not
      // worth an error dialog.
    }
  }

  return (
    <>
      <PageHead
        title="Parts"
        lead={
          unpriced === 0
            ? "Every part in the catalogue carries a figure."
            : `${unpriced} of ${rows.length} parts cannot be sold, because nobody has priced them yet. A part left blank shows "price on request" on the shop and can still be asked about.`
        }
      >
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/admin/parts/new"
            className="rounded-sm bg-oxblood px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-oxblood-deep"
          >
            Add a part
          </Link>
          <Note>Every change is recorded against your name, with what it replaced.</Note>
        </div>
      </PageHead>

      <Stats>
        <Stat
          label="Cannot be sold"
          value={unpriced}
          accent={unpriced > 0}
          hint="No figure, so the shop can only take an enquiry."
        />
        <Stat
          label="No photograph"
          value={unshot}
          hint="Listed, but with a placeholder where the shot goes."
        />
        <Stat label="Ready to sell" value={ready} hint="Priced and photographed." />
        <Stat
          label="Priced in words"
          value={rows.filter((row) => !isSellable(currentPrice(row)) && row.priceNote).length}
          hint="Quoted in prose on the sheet, so no figure to sell at."
        />
      </Stats>

      {problem && (
        <div className="mb-4">
          <Card>
            <p role="alert" className="text-sm text-oxblood">
              {problem}
            </p>
          </Card>
        </div>
      )}

      <Toolbar>
        {/* Stacked on a phone and in one row from `sm`. Side by side at every
            width, the segmented filter and four controls beside it left the
            search box two characters wide. */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Choices label="Which parts to show" options={SHOWS} value={show} onChange={setShow} />

          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            {show === "unshot" && (
              <button
                type="button"
                onClick={copyBrief}
                className="rounded-sm border border-ink px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                {copied ? "Copied" : "Copy the shot list"}
              </button>
            )}
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name or SKU"
              aria-label="Search by name or SKU"
              className="w-full min-w-0 flex-1 rounded-sm border border-rule bg-paper px-3 py-1.5 text-sm outline-none focus:border-ink sm:w-44 sm:flex-none"
            />
            <select
              value={group}
              onChange={(event) => setGroup(event.target.value)}
              aria-label="Rail system or rod finish"
              className="min-w-0 flex-1 rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm outline-none focus:border-ink sm:flex-none"
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
              className="min-w-0 flex-1 rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm outline-none focus:border-ink sm:flex-none"
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

        <p aria-live="polite" className="mt-2 font-mono text-[11px] text-mute">
          {visible.length} of {rows.length} parts
          {busy ? ", saving" : ""}
          {copied ? ", shot list copied" : ""}
        </p>
      </Toolbar>

      {visible.length === 0 ? (
        <EmptyState
          title="Nothing matches"
          body="Widen the filters above, or clear the search, and the list comes back."
        />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <ul>
            {visible.map((row) => (
              <PriceRow
                key={row.slug}
                row={row}
                value={currentPrice(row)}
                onSave={save}
              />
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}

/** Unknown values are dropped rather than filtering the worksheet to nothing. */
function readShow(raw: string | null): Show {
  return SHOWS.some((option) => option.value === raw) ? (raw as Show) : "all"
}
