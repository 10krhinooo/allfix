import {
  products,
  systems,
  ranges,
  getSystem,
  getRange,
  componentsInOrder,
  imageFor,
  skusOf,
} from "@/lib/catalogue"
import { ENQUIRIES, type Enquiry } from "@/lib/admin/desk"
import type { FiledEnquiry } from "@/lib/admin/store"
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

/**
 * What the chrome needs to count, and nothing more.
 *
 * The rail carries the number outstanding on each screen, and that number has
 * to be worked out the same way the screen itself works it out, through
 * `currentPrice`, or the badge and the page disagree. So the chrome gets the
 * four fields that decision reads rather than the whole worksheet: 188 rows of
 * names, groups and image paths have no business in the layout's payload when
 * three of the fields decide everything.
 */
export interface BadgeRow {
  slug: string
  priceKes: number | null
  priceBasis: PriceBasis
  priceNote: string | null
}

export function badgeRows(rows: DeskRow[]): BadgeRow[] {
  return rows.map((row) => ({
    slug: row.slug,
    priceKes: row.priceKes,
    priceBasis: row.priceBasis,
    priceNote: row.priceNote,
  }))
}

/** The rail systems and rod finishes, as one list, because the worksheet mixes them. */
export function deskGroups(rows: DeskRow[]) {
  return [...new Set(rows.map((row) => row.group))].sort()
}

/**
 * The queue, as one list.
 *
 * Two screens read enquiries: Today shows the newest few, and the queue shows
 * all of them. Both had to merge what came through the site into what was
 * seeded, and both did it separately, building objects of slightly different
 * shapes. That is a disagreement waiting to happen: the two screens could count
 * the same enquiry differently, and nothing would flag it. One merge, one shape.
 *
 * Filed enquiries come first because they are the newest and the ones nobody
 * has looked at yet.
 */
export interface DeskEnquiry extends Enquiry {
  /** Present only on the ones sent through the site, which carry a reference. */
  reference?: string
  /** When it arrived, for the filed ones. Seeded rows use `hoursAgo` instead. */
  at?: number
}

export function deskEnquiries(inbox: FiledEnquiry[]): DeskEnquiry[] {
  const filed: DeskEnquiry[] = inbox.map((entry) => ({
    id: entry.id,
    kind: entry.kind,
    name: entry.name,
    phone: entry.phone,
    email: entry.email.trim() || null,
    area: entry.area.trim() || "Not given",
    // The clock time it arrived rather than how long ago, which would mean
    // reading the clock during render. It is also the better answer on a
    // counter screen: "14:32, 3 Aug" is what you repeat down a phone, and it
    // does not quietly go stale while the tab sits open all afternoon.
    hoursAgo: 0,
    at: entry.at,
    summary: entry.summary,
    detail: entry.detail,
    system: entry.system ?? null,
    reference: entry.reference,
  }))
  return [...filed, ...ENQUIRIES]
}

/** A part the counter can put on an order, projected small for the form. */
export interface OrderablePart {
  sku: string
  name: string
  group: string
  priceKes: number
  basis: PriceBasis
}

/**
 * What a counter may key onto an order.
 *
 * Only what has a price and a SKU. A part priced on request has no figure to
 * charge and the service refuses to check one out, so offering it here would be
 * a line that fails on save with somebody waiting at the counter. The same rule
 * `BulkAdd` applies on a system page, and the same one the order endpoint
 * applies on arrival.
 */
export function orderable(): OrderablePart[] {
  return products
    .filter((product) => product.sku && (product.priceKes ?? 0) > 0)
    .map((product) => ({
      sku: product.sku!,
      name: product.name,
      group:
        getSystem(product.system ?? "")?.shortName ??
        getRange(product.range ?? "")?.shortName ??
        "Fits anything",
      priceKes: product.priceKes!,
      basis: product.priceBasis,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
