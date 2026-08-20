import { products, systems, ranges, componentsInOrder, imageFor, skusOf } from "@/lib/catalogue"
import type { Family, PriceBasis } from "@/lib/catalogue"

/**
 * The catalogue as a worksheet.
 *
 * The storefront's own projections are the wrong shape for this. `shopData()`
 * builds what a customer browses: the parts worth showing, described well
 * enough to sell. The counter needs the opposite, every part including the ones
 * that cannot be sold yet, described only well enough to identify and correct.
 *
 * So this carries no copy, no specs and no description, and it carries two
 * fields the storefront has no use for: whether the part has a real price and
 * whether it has ever been photographed. Those two are the work.
 */
export interface DeskRow {
  /** The SKU, or the slug for a variant group that has none of its own. */
  ref: string
  slug: string
  name: string
  family: Family
  /** The rail system or rod finish this belongs to, already resolved to a name. */
  group: string
  component: string
  componentLabel: string
  priceKes: number | null
  priceBasis: PriceBasis
  priceNote: string | null
  photographed: boolean
  /** The shot this part is waiting for, on everything not yet photographed. */
  imageName: string | null
  image: string | null
  /** SKUs behind this row: a variant group is several orderable parts. */
  skus: number
}

export interface DeskCounts {
  products: number
  skus: number
  priced: number
  unpriced: number
  /** Unpriced, but carrying the client's own words about how it is quoted. */
  quotedInProse: number
  photographed: number
  unphotographed: number
}

export function deskRows(): DeskRow[] {
  const systemName = new Map(systems.map((s) => [s.slug, s.shortName]))
  const rangeName = new Map(ranges.map((r) => [r.slug, r.shortName]))

  return products
    .map((product) => ({
      ref: product.sku ?? product.slug,
      slug: product.slug,
      name: product.name,
      family: product.family,
      group:
        (product.system ? systemName.get(product.system) : null) ??
        (product.range ? rangeName.get(product.range) : null) ??
        (product.universal ? "Fits anything" : "Unassigned"),
      component: product.component,
      componentLabel: product.componentLabel,
      priceKes: product.priceKes,
      priceBasis: product.priceBasis,
      priceNote: product.priceNote,
      photographed: Boolean(product.image),
      imageName: product.imageName,
      image: imageFor(product),
      skus: skusOf(product),
    }))
    .sort((a, b) => a.group.localeCompare(b.group) || a.ref.localeCompare(b.ref))
}

export function deskCounts(rows: DeskRow[]): DeskCounts {
  const priced = rows.filter((row) => row.priceKes !== null && row.priceKes > 0)
  const shot = rows.filter((row) => row.photographed)
  return {
    products: rows.length,
    skus: rows.reduce((total, row) => total + row.skus, 0),
    priced: priced.length,
    unpriced: rows.length - priced.length,
    quotedInProse: rows.filter((row) => !row.priceKes && row.priceNote).length,
    photographed: shot.length,
    unphotographed: rows.length - shot.length,
  }
}

/** The component types, in assembly order, for the worksheet's filter. */
export function deskComponents(rows: DeskRow[]) {
  const used = new Set(rows.map((row) => row.component))
  return componentsInOrder()
    .filter((component) => used.has(component.slug))
    .map((component) => ({ slug: component.slug, name: component.name }))
}

/** The rail systems and rod finishes, as one list, because the worksheet mixes them. */
export function deskGroups(rows: DeskRow[]) {
  return [...new Set(rows.map((row) => row.group))].sort()
}
