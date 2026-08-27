"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ShopCard } from "@/components/shop/ShopCard"
import {
  activeCount,
  CATEGORIES,
  EMPTY_QUERY,
  facetsFor,
  filterItems,
  parseQuery,
  PRICE_BANDS,
  SORTS,
  toParams,
  type Category,
  type Facet,
  type ShopData,
  type ShopQuery,
} from "@/lib/shop"
import { SHOP, whatsapp } from "@/lib/format"

const ASK = whatsapp("Hello AllFix, I am looking for a part I cannot find on the site:")

/** A page of parts. 24 divides evenly across the 2, 3 and 4 column grids. */
const PAGE_SIZE = 24

/**
 * The faceted shop, filtering in memory for an instant feel.
 *
 * State lives in React and the URL mirrors it, rather than the other way round:
 * every keystroke and toggle updates the grid immediately, and a debounced
 * write keeps the address bar shareable without re-running the server on each
 * change. Reading the URL once on mount is what makes a shared link open on the
 * same view.
 */
export function ShopBrowser({ data, category }: { data: ShopData; category?: Category }) {
  const params = useSearchParams()
  // The URL is the opening state, read once. After that React owns it, so the
  // filters stay instant and a shared link still opens on the same view.
  //
  // A category page opens on its own category, and the query string cannot
  // argue with it: the path is the stronger statement of the two, and a
  // `/shop/rod?category=rail` that showed rails would be a page contradicting
  // its own address.
  const [query, setQuery] = useState<ShopQuery>(() => {
    const read = parseQuery(new URLSearchParams(params.toString()), data)
    return category ? { ...read, category } : read
  })
  const [drawer, setDrawer] = useState(false)
  const [page, setPage] = useState(() => {
    const n = Number(params.get("page"))
    return Number.isInteger(n) && n > 1 ? n : 1
  })
  const firstSync = useRef(true)
  const top = useRef<HTMLDivElement>(null)

  const results = useMemo(() => filterItems(data.items, query), [data.items, query])
  // Counts answer the panel as it currently stands, so a number beside a box is
  // what ticking it would give rather than what the whole catalogue holds.
  const facets = useMemo(() => facetsFor(data.items, data, query), [data, query])
  const active = activeCount(query)

  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  // A filter change can leave the page beyond the new, shorter result set, so
  // the effective page is always clamped rather than trusted.
  const current = Math.min(page, pages)
  const shown = results.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  // Mirror state back to the address bar, debounced, without a navigation.
  useEffect(() => {
    if (firstSync.current) {
      firstSync.current = false
      return
    }
    const id = setTimeout(() => {
      const next = toParams(query)
      if (current > 1) next.set("page", String(current))
      // A category page owns its category through the path, so repeating it in
      // the query would leave `/shop/rod?category=rod` in the address bar and
      // two places saying the same thing. Change the category and the browser
      // leaves that page for `/shop`, which is where a mixed view belongs.
      const onOwnPage = category && query.category === category
      if (onOwnPage) next.delete("category")
      const base = onOwnPage ? `/shop/${category}` : "/shop"
      const search = next.toString()
      window.history.replaceState(window.history.state, "", search ? `${base}?${search}` : base)
    }, 250)
    return () => clearTimeout(id)
  }, [query, current, category])

  // Any change to the filters returns to the first page: staying on page 5 of a
  // result set that just shrank to two pages is how a filter looks broken.
  const patch = (change: Partial<ShopQuery>) => {
    setQuery((q) => ({ ...q, ...change }))
    setPage(1)
  }
  const toggle = (key: "systems" | "ranges" | "parts", value: string) => {
    setQuery((q) => ({
      ...q,
      [key]: q[key].includes(value) ? q[key].filter((v) => v !== value) : [...q[key], value],
    }))
    setPage(1)
  }
  const toggleDiameter = (value: number) => {
    setQuery((q) => ({
      ...q,
      diameters: q.diameters.includes(value)
        ? q.diameters.filter((v) => v !== value)
        : [...q.diameters, value],
    }))
    setPage(1)
  }
  const clear = () => {
    setQuery({ ...EMPTY_QUERY })
    setPage(1)
  }

  const goToPage = (next: number) => {
    setPage(next)
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const heading =
    query.ranges.length === 1
      ? `${label(facets.ranges, query.ranges[0])} curtain rods`
      : query.systems.length === 1
        ? query.category === "blind"
          ? `${label(facets.blinds, query.systems[0])} parts`
          : `Parts that fit a ${label(facets.systems, query.systems[0])} rail`
        : query.category
          ? (CATEGORIES.find((c) => c.id === query.category)?.label ?? "Every part we stock")
          : "Every part we stock"

  const filters = (
    <div className="space-y-7">
      <Group title="What is above the window">
        <Radio
          label="Everything"
          group="category"
          count={data.items.length}
          checked={!query.category}
          onChange={() => patch({ category: null, systems: [], ranges: [], diameters: [] })}
        />
        {facets.categories.map((f) => (
          <Radio
            key={f.slug}
            label={f.label}
            group="category"
            count={f.count}
            checked={query.category === f.slug}
            onChange={() =>
              patch({
                category: query.category === f.slug ? null : (f.slug as Category),
                // Each category has its own second axis, and holding one from
                // the category you just left guarantees an empty grid: nothing
                // is both a #20 track part and an antique brass rod.
                systems: [],
                ranges: [],
                diameters: [],
              })
            }
          />
        ))}
      </Group>

      {(!query.category || query.category === "rail") && (
        <Group title="Rail system">
          {facets.systems.map((f) => (
            <Check
              key={f.slug}
              label={f.label}
              count={f.count}
              checked={query.systems.includes(f.slug)}
              onChange={() => toggle("systems", f.slug)}
            />
          ))}
        </Group>
      )}

      {(!query.category || query.category === "blind") && (
        <Group title="Blind">
          {facets.blinds.map((f) => (
            <Check
              key={f.slug}
              label={f.label}
              count={f.count}
              checked={query.systems.includes(f.slug)}
              onChange={() => toggle("systems", f.slug)}
            />
          ))}
        </Group>
      )}

      {(!query.category || query.category === "rod") && (
        <>
          <Group title="Rod finish">
            {facets.ranges.map((f) => (
              <Check
                key={f.slug}
                label={f.label}
                count={f.count}
                swatch={f.swatch}
                checked={query.ranges.includes(f.slug)}
                onChange={() => toggle("ranges", f.slug)}
              />
            ))}
          </Group>

          {/* A finial made for a 25mm pole will not go on a 19mm one, so the
              bore matters as much as the finish. Parts with no bore of their
              own, a bracket say, are never filtered out by it. */}
          <Group title="Rod size">
            {facets.diameters.map((f) => (
              <Check
                key={f.slug}
                label={f.label}
                count={f.count}
                checked={query.diameters.includes(Number(f.slug))}
                onChange={() => toggleDiameter(Number(f.slug))}
              />
            ))}
          </Group>
        </>
      )}

      <Group title="Part">
        {facets.parts.map((f) => (
          <Check
            key={f.slug}
            label={f.label}
            count={f.count}
            checked={query.parts.includes(f.slug)}
            onChange={() => toggle("parts", f.slug)}
          />
        ))}
      </Group>

      <Group title="Price">
        {PRICE_BANDS.map((b) => (
          <Radio
            key={b.id}
            label={b.label}
            group="price"
            checked={query.price === b.id}
            onChange={() => patch({ price: query.price === b.id ? null : b.id })}
          />
        ))}
      </Group>

      <Group title="Availability">
        <Check
          label="Ready to buy now"
          checked={query.buyable}
          onChange={() => patch({ buyable: !query.buyable })}
        />
      </Group>

      {active > 0 && (
        <button onClick={clear} className="text-sm text-oxblood underline underline-offset-4">
          Clear all filters
        </button>
      )}
    </div>
  )

  return (
    <>
      <h1 className="display-lg mt-5 max-w-[24ch] font-display font-bold tracking-tight">{heading}</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-slate">
        Rails and the fittings that match them, plus the rod ranges in four finishes. Prices are in
        shillings and the counter at {SHOP.street} carries the full range.
      </p>

      <div ref={top} className="mt-8 flex scroll-mt-24 gap-10">
        {/* Sticky under the header. self-start stops the flex item stretching
            full height, which is what lets sticky engage, and its own scroll
            keeps the price and availability groups reachable on a short screen. */}
        <aside className="hidden w-60 shrink-0 lg:block lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:self-start lg:max-h-[calc(100vh-var(--header-h)-2rem)] lg:overflow-y-auto lg:pr-2">
          {filters}
        </aside>

        <div className="min-w-0 flex-1">
          {/* --------------------------------------------------------- toolbar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-rule pb-4">
            <label className="relative flex-1 min-w-[12rem]">
              <span className="sr-only">Search parts</span>
              <SearchIcon />
              <input
                type="search"
                value={query.q}
                onChange={(e) => patch({ q: e.target.value })}
                placeholder="Search a part or SKU"
                className="w-full rounded-sm border border-rule bg-paper py-2 pl-9 pr-3 text-sm outline-none focus:border-ink"
              />
            </label>

            <button
              onClick={() => setDrawer(true)}
              className="inline-flex items-center gap-2 rounded-sm border border-rule px-4 py-2 text-sm font-medium lg:hidden"
            >
              Filters
              {active > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-oxblood px-1 text-[11px] font-bold text-white">
                  {active}
                </span>
              )}
            </button>

            <label className="flex items-center gap-2">
              <span className="sr-only">Sort by</span>
              <select
                value={query.sort}
                onChange={(e) => patch({ sort: e.target.value as ShopQuery["sort"] })}
                className="rounded-sm border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="callout mt-4">
            {results.length} {results.length === 1 ? "product" : "products"}
            {active > 0 && <span className="text-mute"> of {data.items.length}</span>}
            {pages > 1 && <span className="text-mute"> · page {current} of {pages}</span>}
          </p>

          {/* ------------------------------------------------------------ grid */}
          {results.length === 0 ? (
            <div className="mt-6 border border-dashed border-rule px-6 py-16 text-center">
              <p className="font-display text-lg font-semibold tracking-tight">
                Nothing matches that combination
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate">
                Clear a filter and try again, or ask us. The counter carries more than the site
                lists.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  onClick={clear}
                  className="rounded-sm border border-ink px-5 py-2.5 text-sm font-medium transition-colors hover:bg-ink hover:text-paper"
                >
                  Clear filters
                </button>
                <a
                  href={ASK}
                  className="rounded-sm bg-[#1d8649] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#15703c]"
                >
                  Ask on WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {shown.map((item) => (
                  <ShopCard key={item.slug} item={item} />
                ))}
              </div>
              <Pager page={current} pages={pages} onGo={goToPage} />
            </>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------- mobile drawer */}
      <div
        onClick={() => setDrawer(false)}
        className={`fixed inset-0 z-50 bg-ink/40 transition-opacity lg:hidden ${
          drawer ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        className={`fixed top-0 bottom-0 left-0 z-50 w-[86%] max-w-sm overflow-y-auto bg-paper p-5 transition-transform duration-300 lg:hidden ${
          drawer ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-label="Filters"
        /*
         * `inert` rather than `aria-hidden`. The drawer stays mounted so it has
         * something to slide in from, and `aria-hidden` on a subtree full of
         * checkboxes hides it from a screen reader while leaving every one of
         * them in the tab order: focus lands on a control that is not announced
         * and, off screen, cannot be seen either. `inert` takes both away, and
         * takes the aria with it.
         */
        inert={!drawer}
      >
        <div className="mb-6 flex items-center justify-between">
          <p className="font-display text-lg font-semibold tracking-tight">Filters</p>
          <button onClick={() => setDrawer(false)} aria-label="Close filters" className="p-2">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {filters}
        <button
          onClick={() => setDrawer(false)}
          className="mt-8 w-full rounded-sm bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
        >
          Show {results.length} {results.length === 1 ? "product" : "products"}
        </button>
      </div>
    </>
  )
}

/**
 * A compact numbered pager. The first, last and current pages are always
 * reachable, with the run around the current page filled in and the rest
 * elided, so a long catalogue does not spill a hundred page numbers.
 */
function Pager({ page, pages, onGo }: { page: number; pages: number; onGo: (n: number) => void }) {
  if (pages <= 1) return null

  const visible = new Set([1, pages, page, page - 1, page + 1])
  const numbers: (number | "gap")[] = []
  let previous = 0
  for (let n = 1; n <= pages; n++) {
    if (!visible.has(n)) continue
    if (previous && n - previous > 1) numbers.push("gap")
    numbers.push(n)
    previous = n
  }

  const step =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-sm border px-3 text-sm transition-colors"

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
      <button
        onClick={() => onGo(page - 1)}
        disabled={page === 1}
        className={`${step} border-rule text-slate hover:border-ink hover:text-ink disabled:opacity-40 disabled:hover:border-rule disabled:hover:text-slate`}
        aria-label="Previous page"
      >
        Prev
      </button>

      {numbers.map((n, index) =>
        n === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-mute" aria-hidden="true">
            &hellip;
          </span>
        ) : (
          <button
            key={n}
            onClick={() => onGo(n)}
            aria-current={n === page ? "page" : undefined}
            className={`${step} ${
              n === page ? "border-ink bg-ink font-medium text-paper" : "border-rule text-slate hover:border-ink hover:text-ink"
            }`}
          >
            {n}
          </button>
        ),
      )}

      <button
        onClick={() => onGo(page + 1)}
        disabled={page === pages}
        className={`${step} border-rule text-slate hover:border-ink hover:text-ink disabled:opacity-40 disabled:hover:border-rule disabled:hover:text-slate`}
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="callout mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({
  checked,
  onChange,
  label,
  count,
  swatch,
  round,
  group,
}: {
  checked: boolean
  onChange: () => void
  label: string
  count?: number
  swatch?: string
  round: boolean
  /** Names the radio group, so the browser knows which choices are exclusive. */
  group?: string
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
      <span
        aria-hidden="true"
        className={`flex h-4 w-4 shrink-0 items-center justify-center border transition-colors ${
          round ? "rounded-full" : "rounded-[3px]"
        } ${checked ? "border-oxblood bg-oxblood text-white" : "border-rule"}`}
      >
        {checked && !round && (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M2.5 6.2l2.3 2.3L9.5 3.5" />
          </svg>
        )}
        {checked && round && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </span>
      {swatch && (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/15"
          style={{ background: swatch }}
        />
      )}
      {/*
        The real control, visually hidden behind the marker above. Its type
        follows the shape: a round marker is a single choice and announced as a
        radio, a square one is a multi select and announced as a checkbox. They
        used to all be checkboxes, so the type family picker read as "Rails,
        checkbox" beside "Rods, checkbox" in a group where only one can be on.
      */}
      <input
        type={round ? "radio" : "checkbox"}
        name={round ? group : undefined}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span className={`flex-1 ${checked ? "text-ink" : "text-slate"}`}>{label}</span>
      {count !== undefined && <span className="font-mono text-xs text-mute">{count}</span>}
    </label>
  )
}

function Check(props: Omit<Parameters<typeof Row>[0], "round">) {
  return <Row {...props} round={false} />
}

function Radio(props: Omit<Parameters<typeof Row>[0], "round">) {
  return <Row {...props} round />
}

function label(facets: Facet[], slug: string) {
  return facets.find((f) => f.slug === slug)?.label ?? slug
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-mute"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  )
}
