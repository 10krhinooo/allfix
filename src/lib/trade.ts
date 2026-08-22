import type { PriceBasis } from "@/lib/catalogue"

/**
 * A trade account's own view of the shop.
 *
 * A fundi or a curtain maker buys differently from a walk-in: they order the
 * same fittings again and again, they buy by the box, and the thing they need
 * most often is not a basket but a price on a list of parts they can hand to a
 * client. So this models two records, an order that is being worked and a quote
 * that is being priced, and nothing else.
 *
 * The stages are the shop's own, borrowed from the workshop system Kipekee
 * Creations already runs, so the two businesses describe a job the same way to
 * the same customer.
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

export type QuoteStage = "requested" | "pricing" | "sent" | "accepted" | "expired"

export const QUOTE_STAGE: Record<QuoteStage, string> = {
  requested: "With the counter",
  pricing: "Being priced",
  sent: "Priced, waiting on you",
  accepted: "Accepted",
  expired: "Expired",
}

export interface TradeLine {
  ref: string
  name: string
  quantity: number
  basis: PriceBasis
  /** What the account pays for one, at their tier. Null while a part is unpriced. */
  unitKes: number | null
}

export interface TradeOrder {
  reference: string
  stage: OrderStage
  /** Hours since it was placed, so the seed does not age into nonsense. */
  hoursAgo: number
  lines: TradeLine[]
  /** What the counter last said about it, in the shop's own words. */
  note: string | null
}

export interface TradeQuote {
  reference: string
  stage: QuoteStage
  hoursAgo: number
  lines: TradeLine[]
  /** Set once the counter has priced it, so the account can accept a real figure. */
  totalKes: number | null
  note: string | null
}

/** The trade tier, and the one place the discount is stated. */
export const TRADE_DISCOUNT = 0.2

export function tradePrice(listKes: number | null): number | null {
  return listKes === null ? null : Math.round(listKes * (1 - TRADE_DISCOUNT))
}

export function lineTotal(line: TradeLine): number | null {
  return line.unitKes === null ? null : line.unitKes * line.quantity
}

/** Null when any line is unpriced, because a partial total is a wrong total. */
export function ordered(lines: TradeLine[]): number | null {
  return lines.some((line) => line.unitKes === null)
    ? null
    : lines.reduce((sum, line) => sum + (lineTotal(line) ?? 0), 0)
}

/**
 * Seed data, keyed by the account it belongs to.
 *
 * Held here rather than fetched because orders are the backend's to own and it
 * is not carrying them yet. The shape is what the endpoint will return, so the
 * screens above do not change when it does.
 */
export const TRADE_ORDERS: Record<string, TradeOrder[]> = {
  "njoroge@interiors.co.ke": [
    {
      reference: "AF-O-2041",
      stage: "packing",
      hoursAgo: 6,
      note: "Two boxes of runners are coming off the afternoon delivery.",
      lines: [
        { ref: "RL#20_004", name: "#20 Rail, 6m length", quantity: 24, basis: "length", unitKes: 720 },
        { ref: "RL#20_011", name: "#20 White runners, box of 100", quantity: 8, basis: "box", unitKes: 1040 },
        { ref: "RL#20_007", name: "#20 End stoppers", quantity: 48, basis: "pair", unitKes: 96 },
      ],
    },
    {
      reference: "AF-O-2038",
      stage: "dispatched",
      hoursAgo: 27,
      note: "With the rider, for the Kilimani site.",
      lines: [
        { ref: "RL#28_008", name: "28mm Bracket, double", quantity: 36, basis: "each", unitKes: 344 },
        { ref: "RD#AB_012", name: "Antique brass finial", quantity: 18, basis: "pair", unitKes: 560 },
      ],
    },
    {
      reference: "AF-O-2029",
      stage: "collected",
      hoursAgo: 96,
      note: null,
      lines: [
        { ref: "RL#KS_003", name: "KS Track, 4m", quantity: 12, basis: "length", unitKes: 1200 },
      ],
    },
  ],
}

export const TRADE_QUOTES: Record<string, TradeQuote[]> = {
  "njoroge@interiors.co.ke": [
    {
      reference: "AF-Q-1180",
      stage: "sent",
      hoursAgo: 3,
      totalKes: 184_600,
      note: "Held for seven days. Call the counter to turn it into an order.",
      lines: [
        { ref: "RL#20_004", name: "#20 Rail, 6m length", quantity: 60, basis: "length", unitKes: 720 },
        { ref: "RL#20_011", name: "#20 White runners, box of 100", quantity: 40, basis: "box", unitKes: 1040 },
        { ref: "RL#20_002", name: "#20 Brackets", quantity: 240, basis: "each", unitKes: 400 },
      ],
    },
    {
      reference: "AF-Q-1176",
      stage: "pricing",
      hoursAgo: 20,
      totalKes: null,
      note: "Checking the motor stock before the figure goes out.",
      lines: [
        { ref: "RL#MT_001", name: "Motorised track, per metre", quantity: 46, basis: "metre", unitKes: null },
        { ref: "RL#MT_004", name: "Drive unit", quantity: 6, basis: "each", unitKes: null },
      ],
    },
  ],
}

export function ordersFor(email: string): TradeOrder[] {
  return TRADE_ORDERS[email] ?? []
}

export function quotesFor(email: string): TradeQuote[] {
  return TRADE_QUOTES[email] ?? []
}
