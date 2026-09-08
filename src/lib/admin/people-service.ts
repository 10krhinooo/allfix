import type { Person } from "@/lib/admin/desk"

/**
 * Who has an account, and the three things that can be changed about one.
 *
 * The gap this closes was not a missing screen, it was a missing mechanism. The
 * shop advertises a trade account in the strip above every page and hands the
 * application off to WhatsApp, and nothing on either side could act on that
 * message: there was no endpoint that set a role or a tier, so the only way to
 * make somebody a trade customer was a SQL update against production.
 *
 * Every refusal here comes back from the service in words, and is shown to the
 * person unchanged. The rules are the service's ("this is the only
 * administrator left"), and a console that invented its own wording for a rule
 * it does not own would drift from the rule the moment either changed.
 *
 * Server only, like the other console seams. Never `NEXT_PUBLIC_`.
 */

const API = process.env.ALLFIX_API_URL ?? ""
const SERVICE_TOKEN = process.env.ALLFIX_SERVICE_TOKEN ?? ""

/** The roles this screen may hand out. The service refuses anything else. */
export const GRANTABLE = ["ADMIN", "STAFF", "TRADE", "CUSTOMER"] as const
export type Grantable = (typeof GRANTABLE)[number]

export interface Account {
  id: string
  email: string
  name: string
  phone: string | null
  status: "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED"
  emailVerified: boolean
  roles: string[]
  /** The tier code, or null for a retail account. */
  tier: string | null
  /** What that tier takes off list, stated by the service so this holds no copy. */
  tradeRate: number | null
}

export interface Tier {
  code: string
  name: string
  discountRate: number
}

export type Changed =
  | { ok: true }
  | { ok: false; message: string }

/** The wording used wherever there is nothing to ask. */
const NO_SERVICE =
  "No account service is reachable, so nothing was changed. The roster below is the seeded one."

function headers(): HeadersInit {
  return SERVICE_TOKEN
    ? { "X-Allfix-Service": SERVICE_TOKEN, "content-type": "application/json" }
    : { "content-type": "application/json" }
}

/**
 * Everybody with an account.
 *
 * `null` means nobody could ask, which the screen says in words rather than
 * drawing an empty roster: a shop with no accounts and a shop that cannot be
 * asked look identical, and only one of them is worth acting on.
 */
export async function readAccounts(): Promise<Account[] | null> {
  if (!API) return null

  try {
    const response = await fetch(`${API}/api/admin/accounts`, {
      headers: headers(),
      cache: "no-store",
    })
    if (!response.ok) return null

    const body: unknown = await response.json()
    if (!Array.isArray(body)) return null

    return body.map((entry) => ({
      id: String(entry.id),
      email: String(entry.email),
      name: String(entry.displayName ?? entry.email),
      phone: entry.phone ?? null,
      status: entry.status,
      emailVerified: Boolean(entry.emailVerified),
      roles: Array.isArray(entry.roles) ? entry.roles.map(String) : [],
      tier: entry.tier ?? null,
      tradeRate: entry.tradeRate === null || entry.tradeRate === undefined ? null : Number(entry.tradeRate),
    }))
  } catch {
    return null
  }
}

/** Every tier the shop has, so the screen offers what exists rather than a guess. */
export async function readTiers(): Promise<Tier[] | null> {
  if (!API) return null

  try {
    const response = await fetch(`${API}/api/admin/tiers`, { headers: headers(), cache: "no-store" })
    if (!response.ok) return null
    const body: unknown = await response.json()
    if (!Array.isArray(body)) return null
    return body.map((each) => ({
      code: String(each.code),
      name: String(each.name),
      discountRate: Number(each.discountRate),
    }))
  } catch {
    return null
  }
}

async function change(path: string, body: unknown): Promise<Changed> {
  if (!API) return { ok: false, message: NO_SERVICE }

  try {
    const response = await fetch(`${API}${path}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(body),
      cache: "no-store",
    })
    if (response.ok) return { ok: true }

    // The service says why in a sentence somebody can act on. Passed through
    // unchanged: the rule is the service's and so is the wording for it.
    const answer: unknown = await response.json().catch(() => null)
    const message =
      answer && typeof answer === "object" && typeof (answer as { message?: unknown }).message === "string"
        ? (answer as { message: string }).message
        : "That change was refused, and the service did not say why."
    return { ok: false, message }
  } catch {
    return { ok: false, message: NO_SERVICE }
  }
}

export function setRole(id: string, role: Grantable, granted: boolean): Promise<Changed> {
  return change(`/api/admin/accounts/${encodeURIComponent(id)}/role`, { role, granted })
}

/** An empty code takes an account off a tier, which is a real answer. */
export function setTier(id: string, tier: string | null): Promise<Changed> {
  return change(`/api/admin/accounts/${encodeURIComponent(id)}/tier`, { tier: tier ?? "" })
}

export function setSuspended(id: string, suspended: boolean): Promise<Changed> {
  return change(`/api/admin/accounts/${encodeURIComponent(id)}/status`, { suspended })
}

/**
 * The seeded roster, in the shape the screen draws.
 *
 * Reached only when nobody could ask, and it carries no id, because there is
 * nothing to change: the screen shows it as a roster and offers no controls
 * over it. Pretending otherwise would give somebody a button that silently
 * does nothing.
 */
export function fromSeeded(people: Person[]): Account[] {
  return people.map((person) => ({
    id: "",
    email: person.email,
    name: person.name,
    phone: null,
    status: person.active ? "ACTIVE" : "SUSPENDED",
    emailVerified: true,
    roles: [person.role],
    tier: person.role === "TRADE" ? "TRADE" : null,
    tradeRate: person.role === "TRADE" ? 0.2 : null,
  }))
}
