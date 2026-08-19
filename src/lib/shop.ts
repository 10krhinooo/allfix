/**
 * The shop's data projection and filter logic.
 *
 * The full catalogue carries specs and descriptions that a browse grid never
 * reads, and it is 200 KB. The browser filters in memory for an instant feel,
 * so it is handed this compact projection instead: the server builds it once
 * and only the slim array crosses into the client bundle. Everything the grid,
 * the cards and the facets need is here, and nothing else.
 */
import {
  imageFor,
  products,
  systems,
  ranges,
  components,
  type Product,
} from "@/lib/catalogue"
import { sellable } from "@/lib/commerce"

export interface ShopSwatch {
  label: string
  swatch: string
}

export interface ShopItem {
  slug: string
  name: string
  sku: string | null
  componentLabel: string
  component: string
  family: "rail" | "rod"
  system: string | null
  range: string | null
  fitsSystems: string[]
  diameter: number | null
  universal: boolean
  priceKes: number | null
  priceBasis: string
  priceNote: string | null
  buyable: boolean
  image: string | null
  swatches: ShopSwatch[]
  variantCount: number
  variantAxis: string | null
}

export interface Facet {
  slug: string
  label: string
  count: number
  swatch?: string
}

export interface ShopData {
  items: ShopItem[]
  familyFacets: Facet[]
  systemFacets: Facet[]
  rangeFacets: Facet[]
  partFacets: Facet[]
}

function toItem(product: Product): ShopItem {
  return {
    slug: product.slug,
    name: product.name,
    sku: product.sku,
    componentLabel: product.componentLabel,
    component: product.component,
    family: product.family,
    system: product.system,
    range: product.range,
    fitsSystems: product.fitsSystems,
    diameter: product.diameter,
    universal: product.universal,
    priceKes: product.priceKes,
    priceBasis: product.priceBasis,
    priceNote: product.priceNote,
    buyable: sellable(product),
    image: imageFor(product),
    swatches: (product.variants ?? []).map((v) => ({ label: v.label, swatch: v.swatch })),
    variantCount: product.variants?.length ?? 1,
    variantAxis: product.variantAxis ?? null,
  }
}

/** Everything the client browser needs, built once on the server. */
export function shopData(): ShopData {
  const items = products.map(toItem)
  const count = (predicate: (item: ShopItem) => boolean) => items.filter(predicate).length

  return {
    items,
    familyFacets: [
      { slug: "rail", label: "Rails", count: count((i) => i.family === "rail") },
      { slug: "rod", label: "Rods", count: count((i) => i.family === "rod") },
    ],
    systemFacets: systems.map((s) => ({
      slug: s.slug,
      label: s.name,
      count: count((i) => i.fitsSystems.includes(s.slug)),
    })),
    rangeFacets: ranges.map((r) => ({
      slug: r.slug,
      label: r.name,
      swatch: r.swatch,
      count: count((i) => i.range === r.slug),
    })),
    partFacets: components
      .map((c) => ({ slug: c.slug, label: c.name, count: count((i) => i.component === c.slug) }))
      .filter((c) => c.count > 0)
      .sort((a, b) => a.label.localeCompare(b.label)),
  }
}

// ------------------------------------------------------------------ filtering

export type SortKey = "featured" | "price-asc" | "price-desc" | "name"

export const SORTS: { id: SortKey; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "name", label: "Name: A to Z" },
]

/**
 * Price bands, in the shape a Nairobi shopper actually buys. Most of the
 * catalogue is under KES 500 fittings, so the low bands are fine grained and
 * the top one is open ended rather than splitting hairs above the tracks.
 */
export const PRICE_BANDS: { id: string; label: string; min: number; max: number }[] = [
  { id: "0-200", label: "Under KES 200", min: 0, max: 200 },
  { id: "200-500", label: "KES 200 to 500", min: 200, max: 500 },
  { id: "500-2000", label: "KES 500 to 2,000", min: 500, max: 2000 },
  { id: "2000-", label: "KES 2,000 and up", min: 2000, max: Infinity },
]

export interface ShopQuery {
  family: string | null
  systems: string[]
  ranges: string[]
  parts: string[]
  price: string | null
  buyable: boolean
  q: string
  sort: SortKey
}

export const EMPTY_QUERY: ShopQuery = {
  family: null,
  systems: [],
  ranges: [],
  parts: [],
  price: null,
  buyable: false,
  q: "",
  sort: "featured",
}

/** Read a query out of URL params, accepting only values that name something real. */
export function parseQuery(params: URLSearchParams, data: ShopData): ShopQuery {
  const list = (key: string, allowed: Set<string>) =>
    (params.get(key) ?? "").split(",").map((v) => v.trim()).filter((v) => allowed.has(v))

  const family = params.get("family")
  const sort = params.get("sort") as SortKey
  return {
    family: family === "rail" || family === "rod" ? family : null,
    systems: list("system", new Set(data.systemFacets.map((f) => f.slug))),
    ranges: list("range", new Set(data.rangeFacets.map((f) => f.slug))),
    parts: list("part", new Set(data.partFacets.map((f) => f.slug))),
    price: PRICE_BANDS.some((b) => b.id === params.get("price")) ? params.get("price") : null,
    buyable: params.get("buy") === "1",
    q: (params.get("q") ?? "").trim(),
    sort: SORTS.some((s) => s.id === sort) ? sort : "featured",
  }
}

/** Serialise a query back to URL params, omitting anything at its default. */
export function toParams(query: ShopQuery): URLSearchParams {
  const params = new URLSearchParams()
  if (query.family) params.set("family", query.family)
  if (query.systems.length) params.set("system", query.systems.join(","))
  if (query.ranges.length) params.set("range", query.ranges.join(","))
  if (query.parts.length) params.set("part", query.parts.join(","))
  if (query.price) params.set("price", query.price)
  if (query.buyable) params.set("buy", "1")
  if (query.q) params.set("q", query.q)
  if (query.sort !== "featured") params.set("sort", query.sort)
  return params
}

export function activeCount(query: ShopQuery): number {
  return (
    (query.family ? 1 : 0) +
    query.systems.length +
    query.ranges.length +
    query.parts.length +
    (query.price ? 1 : 0) +
    (query.buyable ? 1 : 0) +
    (query.q ? 1 : 0)
  )
}

export function filterItems(items: ShopItem[], query: ShopQuery): ShopItem[] {
  const band = PRICE_BANDS.find((b) => b.id === query.price)
  const needle = query.q.toLowerCase()

  const kept = items.filter((item) => {
    if (query.family && item.family !== query.family) return false
    if (query.systems.length && !query.systems.some((s) => item.fitsSystems.includes(s))) return false
    if (query.ranges.length && !(item.range && query.ranges.includes(item.range))) return false
    if (query.parts.length && !query.parts.includes(item.component)) return false
    if (query.buyable && !item.buyable) return false
    if (band) {
      // A part with no price cannot sit in a price band. It is an "ask" item,
      // not a free one, so a price filter simply excludes it.
      if (item.priceKes === null) return false
      if (item.priceKes < band.min || item.priceKes >= band.max) return false
    }
    if (needle) {
      const hay = `${item.name} ${item.sku ?? ""} ${item.componentLabel}`.toLowerCase()
      if (!hay.includes(needle)) return false
    }
    return true
  })

  const priced = (item: ShopItem) => (item.buyable && item.priceKes !== null ? item.priceKes : Infinity)
  const sorted = [...kept]
  switch (query.sort) {
    case "price-asc":
      sorted.sort((a, b) => priced(a) - priced(b))
      break
    case "price-desc":
      // Unpriced parts still sink to the bottom rather than topping a high-to-low
      // list, because "ask for a price" is not the most expensive thing we sell.
      sorted.sort((a, b) => {
        const pa = a.buyable && a.priceKes !== null ? a.priceKes : -Infinity
        const pb = b.buyable && b.priceKes !== null ? b.priceKes : -Infinity
        return pb - pa
      })
      break
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name))
      break
    default:
      break
  }
  return sorted
}
