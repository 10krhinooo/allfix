import type { Person } from "@/lib/admin/desk"

/**
 * What a role may do, in one place, so a capability question has one answer.
 *
 * The split is the one `ROLE_NOTE` in desk.ts already describes, rather than one
 * invented for the demo: admin is "everything, including who else gets in", and
 * staff is "the counter: prices, enquiries and orders". So staff price parts,
 * because that is counter work, and only admin sees the people screen. Trade
 * buys at a tier and has no console at all.
 *
 * Pure, and importable from a client component. Nothing here reads a cookie:
 * this answers "what may this role do", never "who is this".
 */

export interface Capabilities {
  console: boolean
  people: boolean
  prices: boolean
}

const CAPABILITIES: Record<Person["role"], Capabilities> = {
  ADMIN: { console: true, people: true, prices: true },
  STAFF: { console: true, people: false, prices: true },
  TRADE: { console: false, people: false, prices: false },
  CUSTOMER: { console: false, people: false, prices: false },
}

export function capabilities(role: Person["role"]): Capabilities {
  return CAPABILITIES[role] ?? CAPABILITIES.CUSTOMER
}

/** The gated subtrees. A destination outside this set is not worth returning to. */
const GATED = ["/admin", "/trade/account"]

/**
 * Where a role belongs once it is through the door.
 *
 * A trade account arriving with `?next=/admin/parts` is landed at its own desk
 * rather than bounced into a redirect loop, which is what happens if the
 * destination is honoured before the role is checked.
 */
export function landing(role: Person["role"], next?: string | null): string {
  const home = capabilities(role).console ? "/admin" : "/trade/account"
  const wanted = safeNext(next)
  if (!wanted) return home
  if (!capabilities(role).console && wanted.startsWith("/admin")) return home
  return wanted
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
