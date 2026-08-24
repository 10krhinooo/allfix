import type { OrderLine, OrderStage } from "@/lib/orders"
import { lineTotal, ordered } from "@/lib/orders"

/**
 * A shopper's own view of the shop.
 *
 * The trade desk answers "where is my order and what will this cost me". A
 * walk-in customer asks something narrower: what did I buy, where is it going,
 * and what did I have you work out for that window. So this models four
 * records, and the two that matter most are the two that exist before a single
 * order does: the delivery book, and the saved rail.
 *
 * Orders and invoices are seeded here rather than fetched, because the order
 * pipeline is phase 4 and there is nothing to fetch yet. The shapes are what
 * `allfix-backend` will return, so the screens above do not change when it
 * starts returning them. Addresses and saved rails are different: those the
 * backend already owns, on `feature/account-book`, and `AccountBookDto` there
 * is field for field what `Address` and `SavedRail` are here.
 */

export type { OrderLine, OrderStage } from "@/lib/orders"
export { ORDER_STAGE, ORDER_FLOW, lineTotal, ordered } from "@/lib/orders"

/** How an order was settled. The two paths the commerce model allows. */
export type Settlement = "mpesa" | "counter"

export const SETTLEMENT: Record<Settlement, string> = {
  mpesa: "M-Pesa",
  counter: "Paid at the counter",
}

export interface CustomerOrder {
  reference: string
  stage: OrderStage
  /** Hours since it was placed, so the seed does not age into nonsense. */
  hoursAgo: number
  lines: OrderLine[]
  settlement: Settlement
  /** The address label it went to, or null when it was collected. */
  deliveredTo: string | null
  note: string | null
}

/**
 * A receipt or a proforma.
 *
 * Two documents, one record, because they differ by what they are for rather
 * than by what they contain: a receipt says money arrived, a proforma says what
 * it would cost if it did. Phase 5 renders both as PDFs; until then this is the
 * list they will be rendered from.
 */
export type DocumentKind = "receipt" | "proforma"

export const DOCUMENT_KIND: Record<DocumentKind, string> = {
  receipt: "Receipt",
  proforma: "Proforma invoice",
}

export interface AccountDocument {
  reference: string
  kind: DocumentKind
  orderReference: string
  hoursAgo: number
  totalKes: number
  /**
   * The lines the document itemises.
   *
   * A receipt that shows only a total is not a receipt anybody can do anything
   * with: it cannot be checked against what arrived, and it is no use to a
   * customer claiming the VAT back or to a landlord being billed for a fit out.
   */
  lines: OrderLine[]
}

/** Where a document is found, and by whom. */
export function documentFor(email: string, reference: string): AccountDocument | undefined {
  return documentsFor(email).find((one) => one.reference === reference)
}

/** Field for field `AccountBookDto.Address` on the backend. */
export interface Address {
  id: string
  label: string
  recipient: string
  phone: string
  line: string
  area: string
  town: string
  directions: string | null
  isDefault: boolean
}

/**
 * Field for field `AccountBookDto.Rail`.
 *
 * The inputs to the configurator, never the bill it produced: a saved bill is a
 * price list frozen on the day it was saved, and the shop reprices. Reopening
 * one re-runs `billOfMaterials` against today's catalogue.
 */
export interface SavedRail {
  id: string
  name: string
  system: string
  widthM: number
  panels: number
  mount: "ceiling" | "wall"
  runnersPerM: number
  bracketsPerM: number
}

const ORDERS: Record<string, CustomerOrder[]> = {
  "p.ochieng@gmail.com": [
    {
      // Placed and not yet paid, going to an address. The one order on the seed
      // that carries a tax invoice rather than a receipt, so all four documents
      // are reachable from the account without inventing a state to reach them.
      reference: "AF-2262",
      stage: "packing",
      hoursAgo: 3,
      settlement: "counter",
      deliveredTo: "Home",
      note: "Cut the track to 3.4 m. Ring before the rider sets off.",
      lines: [
        { ref: "RL#20_001", name: "#20 Track", quantity: 4, basis: "each", unitKes: 2000 },
        { ref: "RL#20_006", name: "#20 Single Wall Bracket", quantity: 8, basis: "each", unitKes: 100 },
        { ref: "RL#20_005", name: "#20 Stoppers", quantity: 8, basis: "each", unitKes: 20 },
      ],
    },
    {
      reference: "AF-2211",
      stage: "dispatched",
      hoursAgo: 19,
      settlement: "mpesa",
      deliveredTo: "Home",
      note: "On the boda now. The rider will call before he gets to the gate.",
      lines: [
        { ref: "RL#20_004", name: "#20 Runners", quantity: 60, basis: "each", unitKes: 10 },
        { ref: "RL#20_005", name: "#20 Stoppers", quantity: 4, basis: "each", unitKes: 20 },
      ],
    },
    {
      reference: "AF-2160",
      stage: "collected",
      hoursAgo: 640,
      settlement: "counter",
      deliveredTo: null,
      note: null,
      lines: [
        { ref: "RL#20_001", name: "#20 Track", quantity: 2, basis: "each", unitKes: 2000 },
        { ref: "RL#20_003", name: "#20 Single Ceiling Bracket", quantity: 12, basis: "each", unitKes: 20 },
        { ref: "RL#ACC_001", name: "3 Pleat Hooks", quantity: 1, basis: "box", unitKes: 1000 },
      ],
    },
    {
      reference: "AF-2098",
      stage: "cancelled",
      hoursAgo: 1180,
      settlement: "mpesa",
      deliveredTo: "Home",
      note: "Cancelled and refunded: the 28mm finials were the wrong finish.",
      lines: [
        { ref: "RD#BL_006", name: "Antique Black Basket Finial", quantity: 2, basis: "each", unitKes: 150 },
      ],
    },
  ],
}

const DOCUMENTS: Record<string, AccountDocument[]> = {
  "p.ochieng@gmail.com": [
    {
      reference: "RC-2211",
      kind: "receipt",
      orderReference: "AF-2211",
      hoursAgo: 19,
      totalKes: 680,
      lines: [
        { ref: "RL#20_004", name: "#20 Runners", quantity: 60, basis: "each", unitKes: 10 },
        { ref: "RL#20_005", name: "#20 Stoppers", quantity: 4, basis: "each", unitKes: 20 },
      ],
    },
    {
      reference: "RC-2160",
      kind: "receipt",
      orderReference: "AF-2160",
      hoursAgo: 640,
      totalKes: 5240,
      lines: [
        { ref: "RL#20_001", name: "#20 Track", quantity: 2, basis: "each", unitKes: 2000 },
        { ref: "RL#20_003", name: "#20 Single Ceiling Bracket", quantity: 12, basis: "each", unitKes: 20 },
        { ref: "RL#ACC_001", name: "3 Pleat Hooks", quantity: 1, basis: "box", unitKes: 1000 },
      ],
    },
    {
      reference: "PF-2244",
      kind: "proforma",
      orderReference: "AF-2244",
      hoursAgo: 5,
      totalKes: 18400,
      lines: [
        { ref: "RL#MOTOR_004", name: "Motorized Track", quantity: 4.2, basis: "metre", unitKes: 3000 },
        { ref: "RL#MOTOR_002", name: "Motor 45 watts", quantity: 1, basis: "each", unitKes: 5800 },
      ],
    },
  ],
}

const ADDRESSES: Record<string, Address[]> = {
  "p.ochieng@gmail.com": [
    {
      id: "seed-address-home",
      label: "Home",
      recipient: "Peter Ochieng",
      phone: "0733 265 741",
      line: "Mwiki Road, Sunton",
      area: "Kasarani",
      town: "Nairobi",
      directions: "Green gate opposite the chemist, second house after the borehole.",
      isDefault: true,
    },
    {
      id: "seed-address-shop",
      label: "The shop",
      recipient: "Peter Ochieng",
      phone: "0733 265 741",
      line: "Njugu Lane",
      area: "CBD",
      town: "Nairobi",
      directions: "Collecting at the counter.",
      isDefault: false,
    },
  ],
}

const RAILS: Record<string, SavedRail[]> = {
  "p.ochieng@gmail.com": [
    {
      id: "seed-rail-sitting",
      name: "Sitting room bay",
      system: "20",
      widthM: 4.2,
      panels: 2,
      mount: "ceiling",
      runnersPerM: 10,
      bracketsPerM: 1,
    },
    {
      id: "seed-rail-bedroom",
      name: "Main bedroom",
      system: "20",
      widthM: 2.4,
      panels: 2,
      mount: "wall",
      runnersPerM: 10,
      bracketsPerM: 1,
    },
  ],
}

function forEmail<T>(table: Record<string, T[]>, email: string): T[] {
  return table[email.toLowerCase()] ?? []
}

export function ordersFor(email: string): CustomerOrder[] {
  return forEmail(ORDERS, email)
}

export function documentsFor(email: string): AccountDocument[] {
  return forEmail(DOCUMENTS, email)
}

export function addressesFor(email: string): Address[] {
  return forEmail(ADDRESSES, email)
}

export function railsFor(email: string): SavedRail[] {
  return forEmail(RAILS, email)
}

/** What an order came to. Null when any line is unpriced. */
export function orderTotal(order: CustomerOrder): number | null {
  return ordered(order.lines)
}

export { lineTotal as orderLineTotal }

/** Still moving, so still worth showing at the top of the account. */
export function isOpen(order: CustomerOrder): boolean {
  return order.stage !== "collected" && order.stage !== "cancelled"
}

/**
 * The deep link back into the configurator for a saved rail.
 *
 * `/build` reads these off the query string, so a saved window reopens exactly
 * as it was measured rather than at the defaults.
 */
export function reopen(rail: SavedRail): string {
  const params = new URLSearchParams({
    system: rail.system,
    width: String(rail.widthM),
    panels: String(rail.panels),
    mount: rail.mount,
    runners: String(rail.runnersPerM),
    brackets: String(rail.bracketsPerM),
  })
  return `/build?${params.toString()}`
}
