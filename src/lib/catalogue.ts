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

export interface Variant {
  sku: string
  label: string
  swatch: string
  priceKes: number | null
  tradePriceKes: number | null
  stock: number | null
  image: string | null
  legacyUrl: string | null
}

export interface Product {
  sku: string | null
  name: string
  slug: string
  system: string | null
  universal: boolean
  fitsSystems: string[]
  component: string
  componentLabel: string
  specs: Spec[]
  summary: string
  priceKes: number | null
  tradePriceKes: number | null
  stock: number | null
  image: string | null
  legacyUrl: string | null
  variantAxis?: string
  variants?: Variant[]
}

export interface System {
  slug: string
  name: string
  shortName: string
  blurb: string
  flagship?: boolean
  skuPrefixes: string[]
  partCount: number
  components: string[]
}

export interface Component {
  slug: string
  name: string
  purpose: string
}

const data = catalogue as unknown as {
  systems: System[]
  components: Component[]
  products: Product[]
  skuCount: number
}

export const systems = data.systems
export const components = data.components
export const products = data.products
export const skuCount = data.skuCount

export function getSystem(slug: string) {
  return systems.find((s) => s.slug === slug)
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
  "track", "bracket", "holder", "joint", "corner-joint",
  "runner", "master-carrier", "stopper",
  "motor", "drive-unit", "belt",
  "tape", "hook", "buckle",
]

function order(component: string) {
  const index = ASSEMBLY.indexOf(component)
  return index === -1 ? ASSEMBLY.length : index
}

export function componentsInOrder() {
  return [...components].sort((a, b) => order(a.slug) - order(b.slug))
}

/** The image the migration wrote for a SKU. Falls back to the product slug. */
export function imageFor(product: Product, variant?: Variant) {
  const key = (variant?.sku ?? product.sku ?? product.slug)
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
