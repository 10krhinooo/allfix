import type { PriceBasis } from "@/lib/catalogue"
import type { PriceEdit } from "@/lib/admin/store"

/**
 * What the console will and will not accept as a price.
 *
 * These are the same rules `PricingService` enforces on the server, stated
 * again here so the counter is told at the keystroke rather than after a round
 * trip. The server keeps its copy regardless: this one is a courtesy, and
 * anything can post to the API without ever loading this page.
 */

/**
 * Above this a figure is almost certainly a typed extra digit. The dearest
 * thing in this catalogue is a motorised track in the tens of thousands, so the
 * ceiling clears real stock by a wide margin and still catches the slip that
 * would put a bracket at two million.
 */
const CEILING = 2_000_000

export const BASES: { value: PriceBasis; label: string }[] = [
  { value: "each", label: "each" },
  { value: "metre", label: "per metre" },
  { value: "pair", label: "per pair" },
  { value: "box", label: "per box" },
  { value: "roll", label: "per roll" },
  { value: "length", label: "per length" },
]

/**
 * A problem worth stopping for, or null.
 *
 * Zero gets a sentence of its own rather than a generic "must be positive",
 * because zero is not a slip here: it is what somebody types when a part has no
 * price yet and the field will not take a blank. Every product on the site this
 * replaces was priced 0, which is precisely why it could not take an order, so
 * the message says what to do instead.
 */
export function priceProblem(raw: string): string | null {
  const trimmed = raw.trim()
  if (trimmed === "") return null

  const value = Number(trimmed)
  if (!Number.isFinite(value)) return "That is not a number."
  if (value === 0) {
    return "0 is not a price. Leave it blank to keep the part unpriced, or say how it is quoted in the note."
  }
  if (value < 0) return "A price cannot be negative."
  if (value > CEILING) {
    return `That is over KES ${CEILING.toLocaleString("en-KE")}, which is usually an extra digit. Check it.`
  }
  return null
}

/** Shillings and cents, so a figure survives a round trip unchanged. */
export function toPrice(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === "" || priceProblem(trimmed)) return null
  return Math.round(Number(trimmed) * 100) / 100
}

export function samePrice(a: PriceEdit, b: PriceEdit) {
  return a.priceKes === b.priceKes && a.priceBasis === b.priceBasis && a.priceNote === b.priceNote
}

/**
 * What a part costs right now: the console's edit if there is one, otherwise
 * the figure the migration wrote.
 *
 * Every screen reads a price through this rather than off the row, so an edit
 * made on the worksheet shows on the counter's totals in the same breath. When
 * the backend lands, the override disappears and this returns the row.
 */
export function currentPrice(
  row: { slug: string; priceKes: number | null; priceBasis: PriceBasis; priceNote: string | null },
  prices: Record<string, PriceEdit>,
): PriceEdit {
  return (
    prices[row.slug] ?? {
      priceKes: row.priceKes,
      priceBasis: row.priceBasis,
      priceNote: row.priceNote,
    }
  )
}

export function isSellable(edit: PriceEdit) {
  return edit.priceKes !== null && edit.priceKes > 0
}
