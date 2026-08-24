"use client"

import { useMemo, useState } from "react"
import { sendEnquiry } from "@/lib/enquiry"
import { price } from "@/lib/format"
import { tradePrice } from "@/lib/trade"

/**
 * A quote, built at the counter's speed.
 *
 * The thing a curtain maker asks for most often is not a basket, it is a price
 * on a list of parts they can hand to a client. So this is a list, not a shop:
 * search, quantity, next line, and the running total is at trade rates because
 * that is the figure they are actually quoting from.
 *
 * It sends through the same path as every other enquiry, so the request lands in
 * the counter's queue alongside the walk-ins rather than in a second inbox
 * somebody has to remember to check.
 */

export interface Pickable {
  slug: string
  ref: string
  name: string
  listKes: number | null
  basis: string
}

interface Line {
  ref: string
  name: string
  quantity: number
  unitKes: number | null
  basis: string
}

export function QuoteBuilder({ parts, account }: { parts: Pickable[]; account: string }) {
  const [query, setQuery] = useState("")
  const [lines, setLines] = useState<Line[]>([])
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)

  const hits = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (needle.length < 2) return []
    return parts
      .filter(
        (part) =>
          part.name.toLowerCase().includes(needle) || part.ref.toLowerCase().includes(needle),
      )
      .slice(0, 6)
  }, [parts, query])

  function add(part: Pickable) {
    setQuery("")
    setLines((previous) => {
      // Asking for the same part twice means more of it, not a second line.
      const already = previous.find((line) => line.ref === part.ref)
      if (already) {
        return previous.map((line) =>
          line.ref === part.ref ? { ...line, quantity: line.quantity + 1 } : line,
        )
      }
      return [
        ...previous,
        {
          ref: part.ref,
          name: part.name,
          quantity: 1,
          unitKes: tradePrice(part.listKes),
          basis: part.basis,
        },
      ]
    })
  }

  const total = lines.some((line) => line.unitKes === null)
    ? null
    : lines.reduce((sum, line) => sum + (line.unitKes ?? 0) * line.quantity, 0)

  async function send() {
    if (lines.length === 0 || sending) return
    setSending(true)
    setProblem(null)

    const written = lines
      .map((line) => `${line.quantity} x ${line.ref}  ${line.name}`)
      .join("\n")

    const result = await sendEnquiry({
      kind: "trade",
      name: account,
      // The counter already holds the account's number, and asking a signed in
      // customer to type it again is how a form gets abandoned.
      phone: "On the trade account",
      // Both blank for the same reason the phone reads as it does: the counter
      // already holds the account's details, and asking a signed in customer to
      // type them again is how a form gets abandoned.
      email: "",
      area: "Trade",
      summary: `Quote wanted on ${lines.length} ${lines.length === 1 ? "line" : "lines"}`,
      detail: `Trade quote requested from the account area.\n\n${written}`,
      system: null,
    })

    if (result.ok) {
      setSent(result.reference)
      setLines([])
    } else {
      setProblem(result.message)
    }
    setSending(false)
  }

  return (
    <div className="border border-rule bg-paper p-6 sm:p-7">
      <label className="block">
        <span className="callout">Add a part</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name or SKU"
          className="mt-1.5 w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
        />
      </label>

      {hits.length > 0 && (
        <ul className="mt-2 border border-rule">
          {hits.map((part) => (
            <li key={part.slug} className="border-b border-rule last:border-b-0">
              <button
                type="button"
                onClick={() => add(part)}
                className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-brass-soft"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ink">{part.name}</span>
                  <span className="block font-mono text-[11px] text-mute">{part.ref}</span>
                </span>
                <span className="shrink-0 font-mono text-xs text-slate">
                  {part.listKes === null ? "on request" : price(tradePrice(part.listKes))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {lines.length > 0 && (
        <ul className="mt-6 border-t border-rule">
          {lines.map((line) => (
            <li
              key={line.ref}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-rule py-3"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink">{line.name}</span>
                <span className="block font-mono text-[11px] text-mute">{line.ref}</span>
              </span>

              <label className="flex items-center gap-2">
                <span className="sr-only">Quantity of {line.name}</span>
                <input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(event) =>
                    setLines((previous) =>
                      previous.map((row) =>
                        row.ref === line.ref
                          ? { ...row, quantity: Math.max(1, Number(event.target.value) || 1) }
                          : row,
                      ),
                    )
                  }
                  className="w-20 rounded-sm border border-rule bg-paper px-2 py-1 text-sm outline-none focus:border-ink"
                />
                <span className="callout">{line.basis}</span>
              </label>

              <span className="w-28 text-right font-mono text-sm text-ink">
                {line.unitKes === null ? "on request" : price(line.unitKes * line.quantity)}
              </span>

              <button
                type="button"
                onClick={() => setLines((previous) => previous.filter((row) => row.ref !== line.ref))}
                className="callout hover:text-oxblood"
              >
                <span className="sr-only">Remove {line.name}</span>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {lines.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate">
            {total === null ? (
              <>Some of these are priced on request, so the counter will price the list.</>
            ) : (
              <>
                <span className="callout">At your rate</span>{" "}
                <span className="ml-2 font-mono text-lg text-ink">{price(total)}</span>
              </>
            )}
          </p>
          <button
            type="button"
            onClick={send}
            disabled={sending}
            className="rounded-sm bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep disabled:cursor-not-allowed disabled:opacity-55"
          >
            {sending ? "Sending" : "Ask the counter to price this"}
          </button>
        </div>
      )}

      {lines.length === 0 && !sent && (
        <p className="mt-4 text-sm leading-relaxed text-slate">
          Search for the parts you need and set the quantities. The total is at your trade rate,
          and the counter confirms it before anything is held.
        </p>
      )}

      {sent && (
        <p role="status" className="mt-5 border-l-2 border-brass bg-brass-soft px-4 py-3 text-sm leading-relaxed text-ink">
          Sent. Your reference is <span className="font-mono">{sent}</span>, and the counter will
          come back with a figure.
        </p>
      )}

      {problem && (
        <p role="alert" className="mt-5 border-l-2 border-oxblood bg-oxblood/5 px-4 py-3 text-sm text-ink">
          {problem}
        </p>
      )}
    </div>
  )
}
