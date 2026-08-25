import type { AccountDocument, CustomerOrder, OrderLine } from "@/lib/account"
import { lineTotal, ordered, DOCUMENT_KIND, type DocumentKind } from "@/lib/account"

/**
 * The four documents the shop issues, described once.
 *
 * They differ in three ways and no more: what they are called, whether the
 * money on them has been paid or is still owed, and whether they carry money at
 * all. A delivery note is the one that does not, and that is the entire reason
 * it exists: it travels with the goods, and the rider, the gateman and whoever
 * signs for it have no business seeing what the customer paid.
 *
 * Written as data rather than as four templates, because four templates drift.
 * The first thing to go is the address block, and an invoice with a receipt's
 * footer on it is worse than no invoice.
 */

export type SheetKind = DocumentKind | "invoice" | "delivery-note"

export interface SheetSpec {
  /** What it is called at the head of the sheet, and in the tab. */
  title: string
  /** The word against the final figure. */
  settledLabel: string
  /** A delivery note shows quantities and no money at all. */
  showsMoney: boolean
  /** The sentence at the foot, which is the one that says what to do with it. */
  footer: string
}

export const SHEETS: Record<SheetKind, SheetSpec> = {
  receipt: {
    title: DOCUMENT_KIND.receipt,
    settledLabel: "Paid",
    showsMoney: true,
    footer: "Thank you. This is your receipt, and it is the reference to quote if you call.",
  },
  invoice: {
    title: "Tax invoice",
    settledLabel: "Due",
    showsMoney: true,
    footer:
      "Payable to AllFix By Kipekee. Quote the reference on the transfer so we can match it.",
  },
  proforma: {
    title: DOCUMENT_KIND.proforma,
    settledLabel: "Due",
    showsMoney: true,
    footer:
      "This is a proforma invoice and not a demand for payment. It holds the figures for " +
      "bank transfer. Call the shop to confirm before paying.",
  },
  "delivery-note": {
    title: "Delivery note",
    settledLabel: "",
    showsMoney: false,
    footer:
      "Check the parts against this note before signing. Anything short or damaged, tell the " +
      "rider and call the shop the same day.",
  },
}

export function isSheetKind(value: string): value is SheetKind {
  return value in SHEETS
}

/**
 * What a sheet actually prints.
 *
 * Both a stored document and a bare order resolve to this, so the template has
 * one shape to render and does not care which it was handed.
 */
export interface Sheet {
  kind: SheetKind
  reference: string
  orderReference: string
  hoursAgo: number
  lines: OrderLine[]
  totalKes: number | null
  deliverTo: string | null
  /**
   * What the record this sheet is issued against is called. Almost always an
   * order, and a proforma for a trade quote is the exception: it is issued
   * before there is an order, which is the whole point of one.
   */
  againstLabel?: string
}

export function sheetFromDocument(document: AccountDocument): Sheet {
  return {
    kind: document.kind,
    reference: document.reference,
    orderReference: document.orderReference,
    hoursAgo: document.hoursAgo,
    lines: document.lines,
    totalKes: document.totalKes,
    deliverTo: null,
  }
}

const PREFIX: Record<SheetKind, string> = {
  receipt: "RC",
  invoice: "IN",
  proforma: "PF",
  "delivery-note": "DN",
}

/** Anything a sheet can be issued against: an order today, a trade quote too. */
export interface Issuable {
  reference: string
  hoursAgo: number
  lines: OrderLine[]
  /** The figure the counter set, where it set one. Otherwise the lines are added up. */
  totalKes?: number | null
  deliverTo?: string | null
}

/**
 * A sheet built from the record it is issued against.
 *
 * The reference is derived rather than stored, because these are issued against
 * a record rather than filed in their own right: DN-2211 is the delivery note
 * for AF-2211 and there is never a second one. The same holds for a proforma
 * against a quote, which is why both go through here: PF-Q-1180 is the proforma
 * for AF-Q-1180, and printing it twice prints the same sheet.
 */
export function sheetFor(record: Issuable, kind: SheetKind, againstLabel?: string): Sheet {
  return {
    kind,
    reference: `${PREFIX[kind]}-${record.reference.replace(/^AF-/, "")}`,
    orderReference: record.reference,
    hoursAgo: record.hoursAgo,
    lines: record.lines,
    totalKes: record.totalKes ?? ordered(record.lines),
    deliverTo: record.deliverTo ?? null,
    againstLabel,
  }
}

export function sheetFromOrder(order: CustomerOrder, kind: SheetKind): Sheet {
  return sheetFor(
    {
      reference: order.reference,
      hoursAgo: order.hoursAgo,
      lines: order.lines,
      deliverTo: order.deliveredTo,
    },
    kind,
  )
}

/**
 * Which sheets an order can produce, given where it has got to.
 *
 * A receipt is only true once the money has arrived, and offering one for an
 * order still being packed would be the shop issuing a receipt for a payment it
 * has not had. A delivery note is pointless for a collection, because nobody is
 * delivering anything.
 */
export function sheetsFor(order: CustomerOrder): SheetKind[] {
  if (order.stage === "cancelled") return []

  const paid = order.settlement !== "counter" || order.stage === "collected"
  const sheets: SheetKind[] = paid ? ["receipt"] : ["invoice"]
  if (order.deliveredTo) sheets.push("delivery-note")
  return sheets
}

export { lineTotal }
