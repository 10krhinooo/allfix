import type { PriceBasis } from "@/lib/catalogue"

/**
 * What an order is, to whoever placed it.
 *
 * The trade desk described this first, and the customer account needs the same
 * words: an order moves through the same stages whether a curtain maker placed
 * it or a walk-in did, because it is the same counter working it. So the
 * vocabulary lives here and both sides read it, rather than the account area
 * growing a second copy that drifts apart the first time a stage is renamed.
 *
 * Only the shape is shared. What a caller pays is not: `trade.ts` applies the
 * tier discount and nothing in this file knows the tier exists.
 */

export type OrderStage = "placed" | "packing" | "dispatched" | "collected" | "cancelled"

export const ORDER_STAGE: Record<OrderStage, string> = {
  placed: "Placed",
  packing: "Being packed",
  dispatched: "On the way",
  collected: "Collected",
  cancelled: "Cancelled",
}

/** The stages an order moves through, in the order the counter works them. */
export const ORDER_FLOW: OrderStage[] = ["placed", "packing", "dispatched", "collected"]

export interface OrderLine {
  ref: string
  name: string
  quantity: number
  basis: PriceBasis
  /** What this account pays for one. Null while a part is unpriced. */
  unitKes: number | null
}

export function lineTotal(line: OrderLine): number | null {
  return line.unitKes === null ? null : line.unitKes * line.quantity
}

/** Null when any line is unpriced, because a partial total is a wrong total. */
export function ordered(lines: OrderLine[]): number | null {
  return lines.some((line) => line.unitKes === null)
    ? null
    : lines.reduce((sum, line) => sum + (lineTotal(line) ?? 0), 0)
}
