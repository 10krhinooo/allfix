import type { Person } from "@/lib/admin/desk"

/**
 * What a role may do, in one place, so a capability question has one answer.
 *
 * The split is the one `ROLE_NOTE` in desk.ts already describes, rather than one
 * invented for the demo: admin is "everything, including who else gets in", and
 * staff is "the counter: prices, enquiries and orders". So staff price parts,
 * because that is counter work, and only admin sees the people screen or the
 * shop's own settings. Trade buys at a tier and has no console at all.
 *
 * Pure, and importable from a client component. Nothing here reads a cookie:
 * this answers "what may this role do", never "who is this".
 */

export interface Capabilities {
  console: boolean
  people: boolean
  prices: boolean
  /**
   * What the shop says about itself: the social accounts it links to and the
   * address its messages come from. Admin only, and for the same reason People
   * is: both change what a customer sees or receives from the whole shop, not
   * what one part costs.
   */
  settings: boolean
}

const CAPABILITIES: Record<Person["role"], Capabilities> = {
  ADMIN: { console: true, people: true, prices: true, settings: true },
  STAFF: { console: true, people: false, prices: true, settings: false },
  TRADE: { console: false, people: false, prices: false, settings: false },
  CUSTOMER: { console: false, people: false, prices: false, settings: false },
}

export function capabilities(role: Person["role"]): Capabilities {
  return CAPABILITIES[role] ?? CAPABILITIES.CUSTOMER
}

/**
 * Destinations worth being sent back to after signing in.
 *
 * The three desks, and checkout. Checkout is the odd one: it is not a desk and
 * the proxy does not gate it, but it is the one place a signed out visitor is
 * genuinely interrupted mid task. Leaving it out meant somebody with a full
 * basket signed in and landed on their account with no way back to the order
 * they were placing.
 */
const GATED = ["/admin", "/trade/account", "/account", "/checkout"]

/**
 * Where a role belongs once it is through the door.
 *
 * A trade account arriving with `?next=/admin/parts` is landed at its own desk
 * rather than bounced into a redirect loop, which is what happens if the
 * destination is honoured before the role is checked.
 */
export function landing(role: Person["role"], next?: string | null): string {
  const home = HOME[role] ?? HOME.CUSTOMER
  const wanted = safeNext(next)
  if (!wanted) return home
  // Somebody else's desk is not a destination, whoever asked for it. A customer
  // arriving with `?next=/trade/account` is landed at their own account rather
  // than at a desk the proxy will only bounce them out of again.
  return owns(role, wanted) ? wanted : home
}

/**
 * Where each role belongs once it is through the door.
 *
 * `CUSTOMER` used to fall through to `/trade/account`, which was invisible only
 * because the door refused customers outright. It stopped being invisible the
 * moment they were let in.
 */
const HOME: Record<Person["role"], string> = {
  ADMIN: "/admin",
  STAFF: "/admin",
  TRADE: "/trade/account",
  CUSTOMER: "/account",
}

/** Whether a role may be sent to a gated path at all. */
export function owns(role: Person["role"], path: string): boolean {
  if (path.startsWith("/admin")) return capabilities(role).console
  if (path.startsWith("/trade/account")) return role === "TRADE"
  if (path.startsWith("/account")) return role === "CUSTOMER"
  // Anybody signed in can buy something, including staff. The counter ordering
  // through the storefront is a real thing that happens.
  if (path.startsWith("/checkout")) return true
  return false
}

/**
 * A destination taken from the query string, made safe.
 *
 * Parsing against an invalid base is what does the work: `new URL` collapses
 * backslashes, decodes escapes and resolves the protocol-relative `//evil.example`
 * form, so anything that escapes the base origin fails the check. A
 * `startsWith("/")` test passes several of those and is the usual way this
 * becomes an open redirect.
 *
 * The prefix allowlist on top is safe because the set of gated routes is closed:
 * nowhere else is worth being sent back to after signing in.
 */
export function safeNext(raw: string | null | undefined): string | null {
  if (!raw) return null
  try {
    const base = "http://allfix.invalid"
    const url = new URL(raw, base)
    if (url.origin !== base) return null
    const path = url.pathname + url.search
    return GATED.some((prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`))
      ? path
      : null
  } catch {
    return null
  }
}
