"use client"

import { useMemo, useState, useTransition } from "react"
import {
  Card,
  Choices,
  EmptyState,
  Note,
  PageHead,
  Pill,
  Stat,
  Stats,
  Table,
  Td,
  Th,
  Toolbar,
} from "@/components/admin/parts"
import type { Counted, StockRow } from "@/lib/admin/stock-service"
import type { PriceBasis } from "@/lib/catalogue"

/**
 * What is on the shelf.
 *
 * Its own screen rather than a column on the parts worksheet, and the reason is
 * worth keeping. That worksheet builds its rows from the committed catalogue and
 * holds its edits in this browser, which is right for a price: a price is
 * decided once and is the same file for everybody. A count is the opposite. It
 * changes between two people looking at it, it is the shop's rather than the
 * build's, and read from the catalogue it is empty for every part. Putting a
 * live figure on a page that also holds unsaved local edits would make "changed
 * here" mean two different things at once.
 *
 * Only counted parts appear. Every one of the 188 in the catalogue is uncounted
 * today, and listing them would bury the handful that matter under a screen of
 * blanks. A part joins this screen the first time somebody goes and counts it.
 */

const FIELD =
  "h-9 w-20 rounded-sm border border-rule bg-paper text-center font-mono text-sm outline-none focus:border-ink"

type Show = "low" | "all"

const SHOWS: { value: Show; label: string }[] = [
  { value: "low", label: "Running low" },
  { value: "all", label: "Everything counted" },
]

/** Stable identity, so the memo below is not invalidated by a fresh empty set. */
const EMPTY: ReadonlySet<string> = new Set()

export function Stock({
  rows,
  owner,
  onCount,
  onThreshold,
}: {
  rows: StockRow[] | null
  /** Whether this account may say what counts as low. Admin's, not the counter's. */
  owner: boolean
  onCount: (slug: string, counted: number | null, note: string | null) => Promise<Counted>
  onThreshold: (slug: string, lowStockAt: number | null) => Promise<Counted>
}) {
  const [show, setShow] = useState<Show>("low")
  const [query, setQuery] = useState("")
  const [busy, start] = useTransition()
  const [problem, setProblem] = useState<string | null>(null)

  const all = useMemo(() => rows ?? [], [rows])

  /*
   * Rows held visible while they are being counted.
   *
   * Straight from `Worksheet.tsx`, which found this the hard way. Typing a new
   * figure under "running low" makes the row stop being low halfway through the
   * number, so it vanishes from under the cursor and the next keystroke lands on
   * whatever slid up into its place. The filter key is stamped onto the held set
   * rather than cleared, so a stale stamp simply stops matching.
   */
  const filter = `${show}|${query.trim()}`
  const [held, setHeld] = useState({ filter, slugs: new Set<string>() })
  const heldNow = held.filter === filter ? held.slugs : EMPTY

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return all.filter((row) => {
      if (heldNow.has(row.slug)) return true
      if (show === "low" && !row.low) return false
      if (!needle) return true
      return (
        row.name.toLowerCase().includes(needle) ||
        (row.sku ?? "").toLowerCase().includes(needle)
      )
    })
  }, [all, show, query, heldNow])

  function hold(slug: string) {
    setHeld((previous) => ({
      filter,
      slugs: new Set(previous.filter === filter ? [...previous.slugs, slug] : [slug]),
    }))
  }

  function run(slug: string, action: () => Promise<Counted>) {
    setProblem(null)
    hold(slug)
    start(async () => {
      const answer = await action()
      if (!answer.ok) setProblem(answer.message)
    })
  }

  if (!rows) {
    return (
      <>
        <PageHead title="Stock" lead="What is on the shelf, and what is running out." />
        <EmptyState
          title="No stock service is reachable"
          body="Counts are kept by the shop's own records rather than in this browser, so there is nothing to show until it answers. A count taken meanwhile has nowhere to go but the shelf itself."
        />
      </>
    )
  }

  const low = all.filter((row) => row.low)

  return (
    <>
      <PageHead title="Stock" lead="What is on the shelf, and what is running out.">
        <Note>
          Only parts somebody has counted are here. A shelf nobody has been to look at is not the
          same as an empty one, so an uncounted part is left alone: it never runs low and it never
          refuses an order.
        </Note>
      </PageHead>

      <Stats>
        <Stat label="Running low" value={low.length} accent={low.length > 0} />
        <Stat label="Counted" value={all.length} hint="The rest of the catalogue is uncounted." />
        <Stat
          label="None left"
          value={all.filter((row) => row.stock <= 0).length}
          hint="Counted to zero, so these refuse an order."
        />
      </Stats>

      <Toolbar>
        <Choices label="Show" options={SHOWS} value={show} onChange={setShow} />
        <label className="sm:ml-auto">
          <span className="sr-only">Search by name or code</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or code"
            className="w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ink sm:w-56"
          />
        </label>
        <p aria-live="polite" className="text-xs text-slate">
          {visible.length} of {all.length} counted
        </p>
      </Toolbar>

      {problem && (
        <div className="mb-4">
          <Card>
            <p role="alert" className="text-sm text-oxblood">
              {problem}
            </p>
          </Card>
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState
          title={show === "low" ? "Nothing is running low" : "Nothing has been counted yet"}
          body={
            show === "low"
              ? "Every counted part is above the figure it is meant to be reordered at."
              : "A part appears here the first time somebody counts it. Until then it is left alone rather than treated as an empty shelf."
          }
        />
      ) : (
        <Card padded={false}>
          <Table>
            <thead>
              <tr>
                <Th>Part</Th>
                <Th align="right">On the shelf</Th>
                <Th align="right">Low at</Th>
                <Th>State</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <StockLine
                  key={row.slug}
                  row={row}
                  owner={owner}
                  busy={busy}
                  onCount={(counted) => run(row.slug, () => onCount(row.slug, counted, null))}
                  onThreshold={(at) => run(row.slug, () => onThreshold(row.slug, at))}
                />
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  )
}

function StockLine({
  row,
  owner,
  busy,
  onCount,
  onThreshold,
}: {
  row: StockRow
  owner: boolean
  busy: boolean
  onCount: (counted: number | null) => void
  onThreshold: (lowStockAt: number | null) => void
}) {
  const [counted, setCounted] = useState(String(row.stock))
  const [at, setAt] = useState(row.lowStockAt === null ? "" : String(row.lowStockAt))

  return (
    <tr>
      <Td>
        <span className="block text-ink">{row.name}</span>
        <span className="font-mono text-xs text-mute">
          {row.sku ?? row.slug}
          {row.group ? ` · ${row.group}` : ""}
        </span>
      </Td>
      <Td align="right">
        <span className="inline-flex items-center gap-2">
          <label>
            <span className="sr-only">How many {row.name} are on the shelf</span>
            <input
              type="number"
              min={0}
              step="0.5"
              value={counted}
              disabled={busy}
              onChange={(event) => setCounted(event.target.value)}
              onBlur={() => {
                const next = counted.trim() === "" ? null : Number(counted)
                if (next !== null && Number.isNaN(next)) return
                if (next === row.stock) return
                onCount(next)
              }}
              className={FIELD}
            />
          </label>
          <span className="w-10 text-left text-xs text-mute">{unit(row.basis)}</span>
        </span>
      </Td>
      <Td align="right">
        {owner ? (
          <label>
            <span className="sr-only">What counts as low for {row.name}</span>
            <input
              type="number"
              min={0}
              value={at}
              disabled={busy}
              placeholder="shop"
              onChange={(event) => setAt(event.target.value)}
              onBlur={() => {
                const next = at.trim() === "" ? null : Number(at)
                if (next !== null && Number.isNaN(next)) return
                if (next === row.lowStockAt) return
                onThreshold(next)
              }}
              className={FIELD}
            />
          </label>
        ) : (
          <span className="font-mono text-sm text-slate">
            {row.lowStockAt === null ? "shop" : row.lowStockAt}
          </span>
        )}
      </Td>
      <Td>
        {row.stock <= 0 ? (
          <Pill tone="todo">None left</Pill>
        ) : row.low ? (
          <Pill tone="waiting">Running low</Pill>
        ) : (
          <Pill tone="quiet">On the shelf</Pill>
        )}
      </Td>
    </tr>
  )
}

/**
 * What a figure counts, which is not always "of them".
 *
 * A track is sold and counted by the metre, so 24 on that row means 24 metres.
 * The same reason money in this shop never renders without its basis.
 */
function unit(basis: PriceBasis) {
  switch (basis) {
    case "metre":
      return "m"
    case "pair":
      return "pairs"
    case "box":
      return "boxes"
    case "roll":
      return "rolls"
    case "length":
      return "lengths"
    default:
      return ""
  }
}
