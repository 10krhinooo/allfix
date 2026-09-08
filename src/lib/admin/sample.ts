import type { DeskOrder } from "@/lib/admin/orders-service"
import type { Platform, Summary } from "@/lib/admin/reports-service"
import type { StockRow } from "@/lib/admin/stock-service"

/**
 * Figures for a shop that has not been connected to anything yet.
 *
 * The console's screens are built to read a service, and there is no service in
 * front of this shop today: the storefront is deployed and the Quarkus half is
 * not hosted, so every read comes back empty and the dashboard draws its "no
 * order service is reachable" state. That is the correct answer and a poor
 * thing to show somebody who is being asked to look at the shop.
 *
 * So the screens fall back to this. It exists to be replaced: the moment
 * `ALLFIX_API_URL` points at a running service, `readSummary` and `readPlatform`
 * return real figures and nothing below is ever read again. Deleting this file
 * and the two `??` that reference it is the whole removal.
 *
 * Everything here is fixed rather than generated. No clock, no randomness: a
 * dashboard whose figures move between two refreshes looks broken, and a fixed
 * set can be pointed at in a conversation and still be the same set afterwards.
 * The shapes are the real ones from `reports-service.ts`, so this cannot drift
 * from what the service returns without the compiler saying so.
 */

/** A month at the counter, in the proportions this shop actually trades in. */
const DAILY = [
  0, 4_800, 6_200, 5_100, 0, 12_400, 3_900, 0, 8_700, 15_200, 6_400, 4_100, 0, 9_800,
  22_600, 7_300, 5_900, 0, 11_400, 8_200, 6_700, 0, 14_900, 9_100, 5_400, 7_800, 0,
  18_300, 10_600, 12_900,
]

/**
 * The thirty days ending today.
 *
 * The dates are the only thing here worked out from the clock, because a chart
 * labelled with last spring's dates is the one part of this that would read as
 * broken rather than as quiet.
 */
function series() {
  const today = new Date()
  return DAILY.map((takenKes, index) => {
    const day = new Date(today)
    day.setDate(today.getDate() - (DAILY.length - 1 - index))
    return {
      day: day.toISOString().slice(0, 10),
      takenKes,
      // Roughly the shop's average order, and zero on the days it was shut.
      orders: takenKes === 0 ? 0 : Math.max(1, Math.round(takenKes / 3_400)),
    }
  })
}

export function sampleSummary(): Summary {
  const days = series()
  const month = days.reduce((sum, day) => sum + day.takenKes, 0)
  const orders = days.reduce((sum, day) => sum + day.orders, 0)
  const week = days.slice(-7).reduce((sum, day) => sum + day.takenKes, 0)

  return {
    money: {
      takenToday: days[days.length - 1]?.takenKes ?? 0,
      takenThisWeek: week,
      takenThisMonth: month,
      takenPreviousMonth: Math.round(month * 0.88),
      // Smaller than what was taken, because most of this shop settles at the
      // counter and never touches the payment table. The gap is the truth.
      settledThisMonth: Math.round(month * 0.31),
      ordersThisMonth: orders,
      averageOrderKes: orders === 0 ? null : Math.round(month / orders),
    },
    trade: { tradeOrdersThisMonth: 9, tradeTakenThisMonth: 74_200, tradeAccounts: 4 },
    // Mostly uncounted, which is the true state of this catalogue and the whole
    // reason the shelf panel reports uncounted beside low.
    shelf: { counted: 41, uncounted: 147, low: 6, outOfStock: 2 },
    series: days,
    topParts: [
      { sku: "RL#20_004", name: "#20 Runners", takenKes: 38_400, quantity: 480 },
      { sku: "RL#28_001", name: "#28 Track", takenKes: 31_200, quantity: 78 },
      { sku: "RD#AB_001", name: "Antique brass rod, 25mm", takenKes: 24_800, quantity: 31 },
      { sku: "RL#MO_001", name: "Motorised track, fitted", takenKes: 19_500, quantity: 2 },
      { sku: "RL#20_006", name: "#20 Single Wall Bracket", takenKes: 12_960, quantity: 162 },
      { sku: "RD#BL_004", name: "Antique black finial, pair", takenKes: 9_600, quantity: 24 },
      { sku: "RL#20_005", name: "#20 Stopper", takenKes: 6_300, quantity: 210 },
      { sku: "RL#KS_003", name: "KS bracket", takenKes: 4_150, quantity: 83 },
    ],
    // More of this shop's trade comes over the counter than online, which is
    // the fact `order_channel` was added to record.
    channels: [
      { channel: "ONLINE", orders: 18, takenKes: 41_300 },
      { channel: "COUNTER", orders: 47, takenKes: 118_600 },
      { channel: "WHATSAPP", orders: 21, takenKes: 52_400 },
      { channel: "PHONE", orders: 8, takenKes: 19_900 },
    ],
    statuses: [
      { status: "PLACED", orders: 6 },
      { status: "PACKING", orders: 3 },
      { status: "DISPATCHED", orders: 4 },
      { status: "COLLECTED", orders: 79 },
      { status: "CANCELLED", orders: 2 },
    ],
  }
}

/**
 * A platform with something wrong on it, because a screen that only ever shows
 * everything working has never been read properly. The two unset integrations
 * are the ones that really are unset today.
 */
export function samplePlatform(): Platform {
  const startedAt = new Date(Date.now() - 3.4 * 86_400_000).toISOString()
  const failedAt = new Date(Date.now() - 5.5 * 3_600_000).toISOString()

  return {
    runtime: {
      uptimeSeconds: Math.round(3.4 * 86_400),
      startedAt,
      heapUsedMb: 412,
      heapMaxMb: 1_024,
      heapPercent: 40,
      profile: "prod",
    },
    integrations: [
      {
        name: "M-Pesa (STK push)",
        configured: false,
        missing: ["consumer key", "consumer secret", "shortcode", "passkey"],
        note: "The payment prompt refuses and tells the customer to call the shop.",
      },
      {
        name: "Email",
        configured: true,
        missing: [],
        note: "Verification, reset and order messages are sent.",
      },
      {
        name: "Storefront service token",
        configured: true,
        missing: [],
        note: "The console can read and write through the service.",
      },
    ],
    migrations: { currentVersion: "24", pendingCount: 0, appliedCount: 24 },
    jobs: [
      {
        name: "Low stock digest",
        state: "Failing",
        lastSuccessAt: null,
        lastErrorAt: failedAt,
        lastErrorMessage:
          "The low stock digest did not run: no copyTo address is set, so there is nowhere to send it",
        scheduled: true,
      },
    ],
    errors: {
      last24h: { WARNING: 2, ERROR: 1, CRITICAL: 0 },
      last7d: { WARNING: 9, ERROR: 3, CRITICAL: 0 },
      openCount: 2,
      open: [
        {
          id: 2,
          at: failedAt,
          severity: "ERROR",
          source: "LowStockDigest",
          message:
            "The low stock digest did not run: no copyTo address is set, so there is nowhere to send it",
          resolved: false,
        },
        {
          id: 1,
          at: new Date(Date.now() - 19 * 3_600_000).toISOString(),
          severity: "WARNING",
          source: "MpesaService",
          message: "A payment was requested while M-Pesa is unconfigured, and was refused",
          resolved: false,
        },
      ],
    },
  }
}

/**
 * A shelf somebody has actually been round with a clipboard.
 *
 * Only counted parts appear, which is the screen's own rule: an uncounted part
 * is not a part with none, and it belongs on the worksheet rather than here.
 * The proportions match the dashboard's shelf panel, so the two screens agree.
 */
export function sampleStock(): StockRow[] {
  return [
    { sku: "RL#20_004", slug: "20-runners", name: "#20 Runners", group: "#20", component: "Runner", basis: "box", stock: 42, lowStockAt: null, low: false },
    { sku: "RL#20_005", slug: "20-stopper", name: "#20 Stopper", group: "#20", component: "Stopper", basis: "pair", stock: 4, lowStockAt: null, low: true },
    { sku: "RL#20_006", slug: "20-single-wall-bracket", name: "#20 Single Wall Bracket", group: "#20", component: "Bracket", basis: "each", stock: 118, lowStockAt: null, low: false },
    { sku: "RL#28_001", slug: "28-track", name: "#28 Track", group: "#28", component: "Track", basis: "metre", stock: 96.5, lowStockAt: 40, low: false },
    { sku: "RL#28_004", slug: "28-end-bracket", name: "#28 End Bracket", group: "#28", component: "Bracket", basis: "pair", stock: 3, lowStockAt: null, low: true },
    { sku: "RL#MO_001", slug: "motorised-track", name: "Motorised Track", group: "Motorised", component: "Track", basis: "metre", stock: 24, lowStockAt: 15, low: false },
    { sku: "RL#KS_003", slug: "ks-bracket", name: "KS Bracket", group: "KS", component: "Bracket", basis: "each", stock: 0, lowStockAt: null, low: true },
    { sku: "RD#AB_001", slug: "antique-brass-rod-25mm", name: "Antique brass rod, 25mm", group: "Antique brass", component: "Rod", basis: "length", stock: 31, lowStockAt: null, low: false },
    { sku: "RD#AB_004", slug: "antique-brass-finial", name: "Antique brass finial", group: "Antique brass", component: "Finial", basis: "pair", stock: 2, lowStockAt: 6, low: true },
    { sku: "RD#BL_001", slug: "antique-black-rod-25mm", name: "Antique black rod, 25mm", group: "Antique black", component: "Rod", basis: "length", stock: 17, lowStockAt: null, low: false },
    { sku: "RL#ACC_007", slug: "curtain-buckles-gold", name: "Curtain Buckles, gold", group: "Fits anything", component: "Accessory", basis: "each", stock: 0, lowStockAt: null, low: true },
    { sku: "RL#10_002", slug: "10-bendable-track", name: "#10 Bendable Track", group: "#10 bendable", component: "Track", basis: "metre", stock: 58, lowStockAt: null, low: false },
  ]
}

/**
 * The bench, with orders on it from every channel.
 *
 * More of them arrived over the counter and on WhatsApp than through the site,
 * which is the fact `order_channel` exists to record and the thing this screen
 * was built to make visible.
 */
export function sampleOrders(): DeskOrder[] {
  return [
    {
      reference: "AF-1042", stage: "placed", hoursAgo: 2, channel: "counter",
      lines: [
        { ref: "RL#28_001", name: "#28 Track", quantity: 12, basis: "metre", unitKes: 400 },
        { ref: "RL#28_004", name: "#28 End Bracket", quantity: 2, basis: "pair", unitKes: 250 },
      ],
      note: "Cut to 3.9m and 2.1m", customer: "Njoroge Interiors", customerPhone: "0748 552 118",
      takenBy: "Dennis Kimani", settlement: "counter", totalKes: 5_300, deliverTo: null, paid: true,
    },
    {
      reference: "AF-1041", stage: "packing", hoursAgo: 5, channel: "whatsapp",
      lines: [{ ref: "RL#20_004", name: "#20 Runners", quantity: 6, basis: "box", unitKes: 800 }],
      note: null, customer: "Grace Wanjiru", customerPhone: "0722 118 904",
      takenBy: "Faith Auma", settlement: "mpesa", totalKes: 4_800, deliverTo: "Kilimani", paid: true,
    },
    {
      reference: "AF-1040", stage: "placed", hoursAgo: 20, channel: "online",
      lines: [
        { ref: "RD#AB_001", name: "Antique brass rod, 25mm", quantity: 3, basis: "length", unitKes: 800 },
        { ref: "RD#AB_004", name: "Antique brass finial", quantity: 3, basis: "pair", unitKes: 400 },
      ],
      note: null, customer: "Peter Ochieng", customerPhone: "0733 265 741",
      takenBy: null, settlement: "mpesa", totalKes: 3_600, deliverTo: "Westlands", paid: false,
    },
    {
      reference: "AF-1039", stage: "dispatched", hoursAgo: 29, channel: "phone",
      lines: [{ ref: "RL#MO_001", name: "Motorised Track", quantity: 4.5, basis: "metre", unitKes: 3_400 }],
      note: "Fitting booked Thursday", customer: "Sunrise Apartments", customerPhone: "0700 441 200",
      takenBy: "Dennis Kimani", settlement: "proforma", totalKes: 15_300, deliverTo: "Lavington", paid: false,
    },
    {
      reference: "AF-1038", stage: "collected", hoursAgo: 52, channel: "counter",
      lines: [{ ref: "RL#20_006", name: "#20 Single Wall Bracket", quantity: 24, basis: "each", unitKes: 80 }],
      note: null, customer: "Walk in", customerPhone: null,
      takenBy: "Faith Auma", settlement: "counter", totalKes: 1_920, deliverTo: null, paid: true,
    },
  ]
}
