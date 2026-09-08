/**
 * What the shop did, and whether the shop is working.
 *
 * Two reads rather than one, because they answer different questions for
 * different people. The summary is the counter's: today's takings, what is
 * moving, what the shelf is short. The platform read is the owner's: which
 * secrets a deployment is missing, whether the schema is current, what has
 * failed lately.
 *
 * Both return `null` when nobody could ask, and the distinction matters more
 * here than anywhere else in the console. An empty dashboard and an unreachable
 * service look identical, and reporting zero takings to somebody who has been
 * selling all day is the one wrong thing to say. Every screen below branches on
 * `null` and says so in words.
 *
 * Server only, like the other console seams. Never `NEXT_PUBLIC_`.
 */

const API = process.env.ALLFIX_API_URL ?? ""
const SERVICE_TOKEN = process.env.ALLFIX_SERVICE_TOKEN ?? ""

export interface Money {
  takenToday: number
  takenThisWeek: number
  takenThisMonth: number
  takenPreviousMonth: number
  /** What the payment table says arrived, which is smaller than what was ordered. */
  settledThisMonth: number
  ordersThisMonth: number
  /** Absent rather than zero when there have been no orders. */
  averageOrderKes: number | null
}

export interface Trade {
  tradeOrdersThisMonth: number
  tradeTakenThisMonth: number
  tradeAccounts: number
}

export interface Shelf {
  counted: number
  /** Usually the largest of the four. A part nobody has counted is not a part with none. */
  uncounted: number
  low: number
  outOfStock: number
}

export interface Point {
  day: string
  takenKes: number
  orders: number
}

export interface TopPart {
  sku: string
  name: string
  takenKes: number
  quantity: number
}

export interface ChannelCount {
  channel: "ONLINE" | "COUNTER" | "WHATSAPP" | "PHONE"
  orders: number
  takenKes: number
}

export interface StatusCount {
  status: "PLACED" | "PACKING" | "DISPATCHED" | "COLLECTED" | "CANCELLED"
  orders: number
}

export interface Summary {
  money: Money
  trade: Trade
  shelf: Shelf
  series: Point[]
  topParts: TopPart[]
  channels: ChannelCount[]
  statuses: StatusCount[]
}

export type Severity = "WARNING" | "ERROR" | "CRITICAL"

export interface Runtime {
  uptimeSeconds: number
  startedAt: string
  heapUsedMb: number
  heapMaxMb: number
  /** Null when the heap is unbounded, rather than a figure that would be believed. */
  heapPercent: number | null
  profile: string
}

export interface Integration {
  name: string
  configured: boolean
  /** What is missing, named, so the fix does not need a developer. */
  missing: string[]
  note: string
}

export interface Migrations {
  currentVersion: string | null
  pendingCount: number
  appliedCount: number
}

export interface Job {
  name: string
  state: "Healthy" | "Failing" | "Recovered" | "Off"
  lastSuccessAt: string | null
  lastErrorAt: string | null
  lastErrorMessage: string | null
  scheduled: boolean
}

export interface SystemErrorEntry {
  id: number
  at: string
  severity: Severity
  source: string
  message: string
  resolved: boolean
}

export interface Errors {
  last24h: Record<Severity, number>
  last7d: Record<Severity, number>
  openCount: number
  open: SystemErrorEntry[]
}

export interface Platform {
  runtime: Runtime
  integrations: Integration[]
  migrations: Migrations
  jobs: Job[]
  errors: Errors
}

async function read<T>(path: string): Promise<T | null> {
  if (!API) return null

  try {
    const response = await fetch(`${API}${path}`, {
      headers: SERVICE_TOKEN ? { "X-Allfix-Service": SERVICE_TOKEN } : {},
      // Somebody refreshes a dashboard because they want to know what is true
      // now. A cached figure is wrong exactly when it is being read.
      cache: "no-store",
    })
    if (!response.ok) return null
    return (await response.json()) as T
  } catch {
    return null
  }
}

/** The counter's figures. `null` means nobody could ask, not that nothing sold. */
export function readSummary(): Promise<Summary | null> {
  return read<Summary>("/api/admin/reports/summary")
}

/**
 * The platform's own state.
 *
 * The one read in this file that means something when it fails: a platform
 * screen that cannot reach the service has, in failing, answered its own
 * question. The screen says so rather than drawing an empty page.
 */
export function readPlatform(): Promise<Platform | null> {
  return read<Platform>("/api/admin/platform")
}
