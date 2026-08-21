"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

/**
 * One search across the console.
 *
 * Before this, finding a part meant knowing it was a price question rather than
 * a photograph question and going to the right screen first. The counter does
 * not think that way: somebody is on the phone holding a bracket, and the
 * question is just "what do we know about this".
 *
 * The index is built on the server and kept to three string fields per row, so
 * carrying it in the chrome costs a few kilobytes rather than the catalogue.
 */

export interface Findable {
  ref: string
  name: string
  href: string
  kind: "part" | "enquiry"
}

export function ConsoleSearch({ items }: { items: Findable[] }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)

  const hits = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (needle.length < 2) return []
    return items
      .filter(
        (item) =>
          item.name.toLowerCase().includes(needle) || item.ref.toLowerCase().includes(needle),
      )
      .slice(0, 8)
  }, [items, query])

  function go(href: string) {
    setQuery("")
    setOpen(false)
    router.push(href)
  }

  return (
    <div className="relative min-w-0 flex-1 sm:max-w-sm">
      <input
        type="search"
        value={query}
        placeholder="Search parts and enquiries"
        aria-label="Search parts and enquiries"
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        // A blur that fires before the click lands would close the list out from
        // under the pointer, so closing waits a frame.
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && hits[0]) go(hits[0].href)
          if (event.key === "Escape") setOpen(false)
        }}
        className="w-full rounded-sm border border-rule bg-paper px-3 py-1.5 text-sm outline-none focus:border-ink"
      />

      {open && hits.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 border border-rule bg-paper shadow-sm">
          {hits.map((hit) => (
            <li key={`${hit.kind}-${hit.ref}`} className="border-b border-rule last:border-b-0">
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => go(hit.href)}
                className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-brass-soft"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ink">{hit.name}</span>
                  <span className="block font-mono text-[11px] text-mute">{hit.ref}</span>
                </span>
                <span className="callout shrink-0">{hit.kind}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
