/**
 * The catalogue data layer.
 *
 * Reads the migrated catalogue directly for now. Every accessor here is the
 * seam the Quarkus backend slots into: when the API lands, these functions
 * become fetches and nothing in the pages changes. Prices in particular are
 * deliberately routed through here rather than read off a product, because
 * price must eventually resolve server-side against the caller's account tier.
 */
import catalogue from "../../data/catalogue.json"

export interface Spec { label: string; value: string }

/**
 * What a price buys. The shop quotes track by the metre and tie backs by the
 * pair, so a bare figure would misprice both, and the rail configurator's bill
 * of materials depends on knowing which.
 */
export type PriceBasis = "each" | "metre" | "pair" | "box" | "roll" | "length"

/** Rails are browsed by system, rods by finish. The two do not interchange. */
export type Family = "rail" | "rod"

export interface Variant {
  sku: string
  label: string
  swatch: string
  priceKes: number | null
  priceBasis: PriceBasis
  tradePriceKes: number | null
  stock: number | null
  image: string | null
  legacyUrl: string | null
}

export interface Product {
  sku: string | null
  name: string
  slug: string
  family: Family
  system: string | null
  /** The rod finish, on rods only. Rails carry a `system` instead. */
  range: string | null
  /** Rod bore in millimetres, on the parts that have to match the pole. */
  diameter: number | null
  universal: boolean
  fitsSystems: string[]
  component: string
  componentLabel: string
  specs: Spec[]
  summary: string
  description: string
  priceKes: number | null
  priceBasis: PriceBasis
  /**
   * A price the sheet stated in words rather than figures, kept verbatim: the
   * roman blind fittings are included in the track's rate per metre, and the
   * double rail quotes a length price alongside its metre rate. Never guessed
   * into a number.
   */
  priceNote: string | null
  tradePriceKes: number | null
  stock: number | null
  image: string | null
  /** The shot this part is waiting for, on everything not yet photographed. */
  imageName: string | null
  legacyUrl: string | null
  variantAxis?: string
  variants?: Variant[]
}

export type SystemKind = "rail" | "blind"

export interface System {
  slug: string
  name: string
  shortName: string
  blurb: string
  /**
   * A track drawn on runners, or a blind raised on a cord.
   *
   * Both answer the same question, what the customer already has above the
   * window, which is why they share this table. Almost nothing else about them
   * is shared: a blind takes no runners, no stoppers and no tape, it is quoted
   * by the metre with its fittings included rather than sold as parts, and it
   * has no cross section to draw. Anywhere those differ, ask this rather than
   * naming a slug. The configurator named one and the other two walked straight
   * past it.
   */
  kind: SystemKind
  flagship?: boolean
  skuPrefixes: string[]
  partCount: number
  components: string[]
  /**
   * The length track is stocked in, in metres. A run longer than this needs a
   * joint, and the configurator counts joints against it. Unconfirmed with the
   * client: see the note in `tools/migrate/systems.py`.
   */
  stockLengthM: number
}

export interface Component {
  slug: string
  name: string
  purpose: string
  /**
   * How many of this part a metre of run takes, and the fewest any run takes.
   * The configurator counts with these, and `purpose` is written from them in
   * the migration, so the sentence a customer reads and the quantity they are
   * quoted can never drift apart.
   */
  perMetre: number | null
  minimum: number | null
}

/**
 * A curtain rod finish. Rods are the half of the shop the old site never had,
 * and they browse on their own axis: someone with an antique brass 28mm pole
 * needs a finial in the same brass and rings in the same 28, so finish leads
 * and diameter filters within it.
 */
export interface Range {
  slug: string
  name: string
  shortName: string
  blurb: string
  swatch: string
  skuPrefixes: string[]
  partCount: number
  components: string[]
  diameters: number[]
}

const data = catalogue as unknown as {
  systems: System[]
  ranges: Range[]
  components: Component[]
  products: Product[]
  skuCount: number
}

export const systems = data.systems
export const ranges = data.ranges
export const components = data.components
export const products = data.products
export const skuCount = data.skuCount

export const rails = products.filter((p) => p.family === "rail")
export const rods = products.filter((p) => p.family === "rod")

export function getSystem(slug: string) {
  return systems.find((s) => s.slug === slug)
}

/** The tracks. What the configurator, and the rail browse axis, mean by a system. */
export function railSystems() {
  return systems.filter((s) => s.kind === "rail")
}

/** The blinds, which browse and sell differently enough to be asked for on their own. */
export function blindSystems() {
  return systems.filter((s) => s.kind === "blind")
}

export function getRange(slug: string) {
  return ranges.find((r) => r.slug === slug)
}

/** Every part in a rod finish, in assembly order, optionally for one bore only. */
export function partsForRange(slug: string, diameter?: number) {
  return rods
    .filter((p) => p.range === slug)
    .filter((p) => !diameter || p.diameter === null || p.diameter === diameter)
    .sort((a, b) => order(a.component) - order(b.component) || a.name.localeCompare(b.name))
}

/** Tapes, hooks and buckles, which attach to the curtain rather than the track. */
export function universalParts() {
  return products.filter((p) => p.universal)
}

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug)
}

export function getComponent(slug: string) {
  return components.find((c) => c.slug === slug)
}

/** Every part that fits a given rail, ordered so the track comes before its fittings. */
export function partsForSystem(slug: string) {
  return products
    .filter((p) => p.fitsSystems.includes(slug))
    .sort((a, b) => order(a.component) - order(b.component) || a.name.localeCompare(b.name))
}

/**
 * The order a rail is actually assembled in: the track first, then what carries
 * it, then what runs in it, then what finishes it. A part list sorted this way
 * reads as instructions rather than as inventory.
 */
const ASSEMBLY = [
  "track", "rod", "bracket", "holder", "joint", "corner-joint",
  "runner", "master-carrier", "stopper",
  "motor", "drive-unit", "roller-unit", "belt",
  "finial", "end-cup", "ring", "tie-back",
  "thread", "blind-ring", "fibre", "weight",
  "tape", "hook", "buckle",
]

function order(component: string) {
  const index = ASSEMBLY.indexOf(component)
  return index === -1 ? ASSEMBLY.length : index
}

export function componentsInOrder() {
  return [...components].sort((a, b) => order(a.slug) - order(b.slug))
}

/**
 * The optimised image the migration wrote for a SKU, or null when there isn't
 * one. Only the parts that came off the old site have been photographed: the
 * rod line and everything the client's sheet added are waiting on a shoot, and
 * they say so with `imageName` rather than pointing at a file that would 404.
 */
export function imageFor(product: Product, variant?: Variant) {
  const entry = variant ?? product
  if (!entry.image) return null
  // A variant group has no SKU of its own, and the migration writes one file
  // per variant keyed by that variant's SKU. The group shows its lead, so the
  // lead's SKU is the file to ask for. Falling back to the group slug asks for
  // a file that was never written.
  const key = (variant?.sku ?? product.sku ?? product.variants?.[0]?.sku ?? product.slug)
    .replace(/#/g, "")
    .replace(/\//g, "-")
    .toLowerCase()
  return `/products/${key}.webp`
}

export function skusOf(product: Product) {
  return product.variants?.length ?? 1
}

/**
 * The parts for a system, bucketed by component type and still in assembly
 * order. A system page reads as a build sheet rather than a wall of cards, and
 * the buckets double as its jump links.
 */
export function partsForSystemByComponent(slug: string) {
  const grouped = new Map<string, Product[]>()
  for (const product of partsForSystem(slug)) {
    const bucket = grouped.get(product.component)
    if (bucket) bucket.push(product)
    else grouped.set(product.component, [product])
  }

  return [...grouped].map(([component, parts]) => ({
    component: getComponent(component) ?? { slug: component, name: parts[0].componentLabel, purpose: "" },
    parts,
  }))
}

/** How many orderable SKUs sit behind a system, counting variants separately. */
export function skuCountForSystem(slug: string) {
  return partsForSystem(slug).reduce((total, product) => total + skusOf(product), 0)
}
