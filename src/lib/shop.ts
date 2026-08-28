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
  railSystems,
  blindSystems,
  ranges,
  components,
  type Product,
} from "@/lib/catalogue"
import { sellable } from "@/lib/commerce"

/**
 * What is above the window, which is what a customer knows before anything else.
 *
 * This replaces a two way rail/rod split that stopped describing the shelf the
 * moment the August sheet arrived. A third of what was filed under "rails" is
 * now blinds, and a blind is not a rail: it takes no runners, it is quoted by
 * the metre with its fittings included rather than sold as parts, and somebody
 * shopping for one has nothing to say about a bracket. Leaving them mixed meant
 * a customer with a #20 track wading past roller blind tubes.
 *
 * Rods stay where they were. Curtain-side parts, the tapes and hooks and
 * buckles, stay with rails: they are bought to dress a curtain on a track, and
 * a system filter is expected to keep showing them, which is the promise
 * `fitsSystems` makes everywhere else in the shop.
 */
export type Category = "rail" | "blind" | "rod"

export const CATEGORIES: { id: Category; label: string; blurb: string }[] = [
  { id: "rail", label: "Rails", blurb: "Tracks, and everything that fits one" },
  { id: "blind", label: "Blinds", blurb: "Roman, roller and zebra" },
  { id: "rod", label: "Rods", blurb: "Poles and finials, by finish" },
]

/**
 * Which of the three a part belongs to.
 *
 * The blind slugs are passed in rather than read here, because the catalogue is
 * now a fetch and a module-scope read of it would be a promise nobody awaits.
 * The caller has them already: `shopData` asks for the systems anyway.
 */
function categoryOf(product: Product, blindSlugs: Set<string>): Category {
  if (product.family === "rod") return "rod"
  return product.system && blindSlugs.has(product.system) ? "blind" : "rail"
}

export interface ShopSwatch {
  label: string
  swatch: string
}

export interface ShopItem {
  slug: string
  category: Category
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

/**
 * The taxonomy, without counts.
 *
 * Counts used to be computed here, once, over the whole catalogue, and then
 * rendered beside every checkbox whatever else was ticked. So "Rods" and
 * "Tracks 11" sat side by side and the second returned nothing, because no rod
 * is a track. A count that does not answer the question on screen is worse than
 * no count. `facetsFor` works them out against the live query instead, in the
 * browser, where the filtering already happens.
 */
export interface ShopData {
  items: ShopItem[]
  /** Rail systems only. The blinds have their own list below. */
  systems: Omit<Facet, "count">[]
  blinds: Omit<Facet, "count">[]
  ranges: Omit<Facet, "count">[]
  parts: Omit<Facet, "count">[]
  /** Rod bores in millimetres. A finial in the wrong bore does not fit. */
  diameters: number[]
}

function toItem(product: Product, blindSlugs: Set<string>): ShopItem {
  return {
    slug: product.slug,
    name: product.name,
    sku: product.sku,
    componentLabel: product.componentLabel,
    component: product.component,
    category: categoryOf(product, blindSlugs),
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

/** The taxonomy the browser needs, built once on the server. */
export async function shopData(): Promise<ShopData> {
  const [all, rails, blinds, finishes, kinds] = await Promise.all([
    products(),
    railSystems(),
    blindSystems(),
    ranges(),
    components(),
  ])
  const blindSlugs = new Set(blinds.map((s) => s.slug))
  const items = all.map((product) => toItem(product, blindSlugs))

  return {
    items,
    systems: rails.map((s) => ({ slug: s.slug, label: s.name })),
    blinds: blinds.map((s) => ({ slug: s.slug, label: s.name })),
    ranges: finishes.map((r) => ({ slug: r.slug, label: r.name, swatch: r.swatch })),
    parts: kinds.map((c) => ({ slug: c.slug, label: c.name })),
    diameters: [...new Set(items.map((i) => i.diameter).filter((d): d is number => d !== null))].sort(
      (a, b) => a - b,
    ),
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
  category: Category | null
  systems: string[]
  ranges: string[]
  parts: string[]
  /** Rod bores, within a finish. A 25mm finial will not go on a 19mm pole. */
  diameters: number[]
  price: string | null
  buyable: boolean
  q: string
  sort: SortKey
}

export const EMPTY_QUERY: ShopQuery = {
  category: null,
  systems: [],
  ranges: [],
  parts: [],
  diameters: [],
  price: null,
  buyable: false,
  q: "",
  sort: "featured",
}

/** Read a query out of URL params, accepting only values that name something real. */
export function parseQuery(params: URLSearchParams, data: ShopData): ShopQuery {
  const list = (key: string, allowed: Set<string>) =>
    (params.get(key) ?? "").split(",").map((v) => v.trim()).filter((v) => allowed.has(v))

  const sort = params.get("sort") as SortKey
  return {
    category: readCategory(params),
    systems: list("system", new Set([...data.systems, ...data.blinds].map((f) => f.slug))),
    ranges: list("range", new Set(data.ranges.map((f) => f.slug))),
    parts: list("part", new Set(data.parts.map((f) => f.slug))),
    diameters: list("diameter", new Set(data.diameters.map(String))).map(Number),
    price: PRICE_BANDS.some((b) => b.id === params.get("price")) ? params.get("price") : null,
    buyable: params.get("buy") === "1",
    q: (params.get("q") ?? "").trim(),
    sort: SORTS.some((s) => s.id === sort) ? sort : "featured",
  }
}

/**
 * The category, or the family somebody bookmarked before there was one.
 *
 * `?family=rail` and `?family=rod` are on the home page, on every product page
 * and in the WooCommerce redirect table, and they are advertised as shareable
 * URLs. They still mean what they meant: rod is rod, and rail is rail with the
 * blinds now lifted out of it, which is closer to what anybody following that
 * link wanted anyway.
 */
function readCategory(params: URLSearchParams): Category | null {
  const asked = params.get("category") ?? params.get("family")
  return CATEGORIES.some((c) => c.id === asked) ? (asked as Category) : null
}

/** Serialise a query back to URL params, omitting anything at its default. */
export function toParams(query: ShopQuery): URLSearchParams {
  const params = new URLSearchParams()
  if (query.category) params.set("category", query.category)
  if (query.systems.length) params.set("system", query.systems.join(","))
  if (query.ranges.length) params.set("range", query.ranges.join(","))
  if (query.parts.length) params.set("part", query.parts.join(","))
  if (query.diameters.length) params.set("diameter", query.diameters.join(","))
  if (query.price) params.set("price", query.price)
  if (query.buyable) params.set("buy", "1")
  if (query.q) params.set("q", query.q)
  if (query.sort !== "featured") params.set("sort", query.sort)
  return params
}

export interface Facets {
  categories: Facet[]
  systems: Facet[]
  blinds: Facet[]
  ranges: Facet[]
  parts: Facet[]
  diameters: Facet[]
}

/**
 * Every count on the panel, worked out against what is already ticked.
 *
 * A facet is counted with its own dimension cleared, which is what stops
 * choosing one rail system from showing every other one as zero: the question a
 * count answers is "and how many if I also tick this", not "how many are left".
 * Its own dimension is the only one cleared, so "Rods" and "Tracks" can never
 * again sit side by side both claiming a number when together they are nothing.
 *
 * A part type with nothing behind it is dropped rather than shown as zero. That
 * is the whole of the old fault: twenty four of the thirty component types are
 * rail only and six are rod only, so more than half the list was always dead
 * whichever way a customer had come in.
 */
export function facetsFor(items: ShopItem[], data: ShopData, query: ShopQuery): Facets {
  const count = (q: ShopQuery, extra: (item: ShopItem) => boolean) =>
    filterItems(items, q).filter(extra).length

  const without = (keys: Partial<ShopQuery>) => ({ ...query, ...keys })

  const noCategory = without({ category: null })
  const noSystems = without({ systems: [] })
  const noRanges = without({ ranges: [] })
  const noParts = without({ parts: [] })
  const noDiameters = without({ diameters: [] })

  return {
    categories: CATEGORIES.map((c) => ({
      slug: c.id,
      label: c.label,
      count: count(noCategory, (i) => i.category === c.id),
    })),
    systems: data.systems.map((f) => ({
      ...f,
      count: count(noSystems, (i) => i.fitsSystems.includes(f.slug)),
    })),
    blinds: data.blinds.map((f) => ({
      ...f,
      count: count(noSystems, (i) => i.fitsSystems.includes(f.slug)),
    })),
    ranges: data.ranges.map((f) => ({
      ...f,
      count: count(noRanges, (i) => i.range === f.slug),
    })),
    parts: data.parts
      .map((f) => ({ ...f, count: count(noParts, (i) => i.component === f.slug) }))
      .filter((f) => f.count > 0),
    diameters: data.diameters
      .map((d) => ({
        slug: String(d),
        label: `${d} mm`,
        count: count(noDiameters, (i) => i.diameter === d),
      }))
      .filter((f) => f.count > 0),
  }
}

export function activeCount(query: ShopQuery): number {
  return (
    (query.category ? 1 : 0) +
    query.systems.length +
    query.ranges.length +
    query.parts.length +
    query.diameters.length +
    (query.price ? 1 : 0) +
    (query.buyable ? 1 : 0) +
    (query.q ? 1 : 0)
  )
}

export function filterItems(items: ShopItem[], query: ShopQuery): ShopItem[] {
  const band = PRICE_BANDS.find((b) => b.id === query.price)
  const needle = query.q.toLowerCase()

  const kept = items.filter((item) => {
    if (query.category && item.category !== query.category) return false
    if (query.systems.length && !query.systems.some((s) => item.fitsSystems.includes(s))) return false
    if (query.ranges.length && !(item.range && query.ranges.includes(item.range))) return false
    if (query.parts.length && !query.parts.includes(item.component)) return false
    // A part with no bore, a bracket say, goes on any pole and is never filtered out.
    if (query.diameters.length && item.diameter !== null && !query.diameters.includes(item.diameter))
      return false
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
