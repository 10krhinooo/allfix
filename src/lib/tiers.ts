import type { Person } from "@/lib/admin/desk"

/**
 * What an account pays, and the one place the trade rate is stated.
 *
 * A tier is a property of an account, never of a request. Nothing a browser
 * sends can choose one: the storefront shows a figure so somebody can decide
 * whether to buy, and the price they are charged is resolved again where the
 * order is placed, from the catalogue and whoever the session says they are.
 * A signed out visitor is retail, always, because there is no account to look a
 * tier up on.
 *
 * The 20% is the rate the shop advertises on `/trade` and in the header strip,
 * so it is stated here once and read from here everywhere. Whether it is flat
 * across the catalogue or set per SKU is outstanding on the client (plan item
 * 3). The shape below answers both: `tradeKes` on a part is the figure the
 * counter has set against that part, and the rate is what applies when there is
 * none. Today no part carries one, so the rate is what every trade figure comes
 * from.
 *
 * `unitFor` is the mirror of `OrderService.unitPriceFor` on the backend, in the
 * way `password.ts` mirrors `PasswordPolicy`: the same rule written twice on
 * purpose, so the shop can quote at the keystroke and the server can still be
 * the only thing that decides a charge. The backend's copy falls back to list
 * rather than to the rate, which has to change with it, or a trade account will
 * be shown 320 and charged 400.
 */

export type Tier = "retail" | "trade"

/** The advertised wholesale rate, off list. */
export const TRADE_RATE = 0.2

export const TIER_LABEL: Record<Tier, string> = {
  retail: "List",
  trade: "Your trade rate",
}

/** Which tier a role buys at. Everything that is not a trade account is retail. */
export function tierFor(role: Person["role"] | null | undefined): Tier {
  return role === "TRADE" ? "trade" : "retail"
}

export function rateFor(tier: Tier): number {
  return tier === "trade" ? TRADE_RATE : 0
}

/** The rate as it is spoken and printed: "20% off list". */
export function ratePhrase(tier: Tier): string {
  return `${Math.round(rateFor(tier) * 100)}% off list`
}

/** Just enough of a part to price it. Anything with a price can be passed in. */
export interface Priceable {
  priceKes: number | null
  /** The figure the counter has set against this part for trade, where there is one. */
  tradeKes?: number | null
}

/**
 * What one of this part costs at this tier.
 *
 * A part the counter has priced for trade is sold at that figure whatever the
 * rate says, because a rate is a default and a set price is a decision. A part
 * with no price at all stays null: it is "ask us", not zero, and a tier cannot
 * turn an absent price into one.
 */
export function unitFor(part: Priceable, tier: Tier): number | null {
  if (part.priceKes === null || part.priceKes <= 0) return null
  if (tier === "trade" && typeof part.tradeKes === "number" && part.tradeKes > 0) {
    return part.tradeKes
  }
  // To the shilling. A trade rate that produced 319.20 would print as a figure
  // no counter would ever say out loud, and cents cannot be paid in cash.
  return Math.round(part.priceKes * (1 - rateFor(tier)))
}

/** What the tier takes off, for the line that says so. Zero at retail. */
export function savingOn(part: Priceable, tier: Tier): number {
  const list = part.priceKes
  const paid = unitFor(part, tier)
  if (list === null || paid === null) return 0
  return Math.max(0, list - paid)
}
