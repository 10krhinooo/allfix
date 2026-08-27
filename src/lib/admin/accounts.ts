import { PEOPLE, type Person } from "@/lib/admin/desk"
import { SHOP } from "@/lib/format"

/**
 * The credential check.
 *
 * This is the only place a password is verified, and the only file that changes
 * when accounts move behind the API. It is written to the contract
 * `allfix-backend` implements, refusal messages included, so the screens above
 * cannot tell which side answered.
 *
 * There is no password in this file. There used to be one shared plaintext seed,
 * and while it was a seed rather than a secret, a checked in string that a
 * scanner reads as a credential costs more to explain every time than it saves.
 *
 * So the seeded door has no password to leak, and does not pretend to have one.
 * With `ALLFIX_SEED_PASSWORD` set it is required and checked. With it unset the
 * password is not checked at all, and the sign in sheet says so and stops making
 * the field compulsory, because a field that is asked for and never checked
 * teaches people to type anything into it, which is worse than not asking.
 *
 * That loses nothing worth demonstrating. The refusals this screen exists for
 * are decided by role and not by password: a suspended account, and an address
 * nobody has registered. Both still refuse, and they are the half of the model
 * worth exercising. A shopper was a third until phase 3 gave one somewhere to
 * land, and is now let through to `/account` like anybody else.
 *
 * The trade off is real and belongs in the open: an unset variable means anybody
 * who knows a seeded address can walk into the console on that deployment. Set
 * it on anything reachable from the internet.
 */

/**
 * Unset in development, so the seeded list stays usable on a bare clone. Set it
 * anywhere the console is shown to somebody who should not be able to walk in.
 */
const SEED_PASSWORD = process.env.ALLFIX_SEED_PASSWORD ?? ""

/**
 * Whether the door checks a password at all, for the sheet to say out loud.
 * Server side only: it reports that a password exists, never what it is.
 */
export const SEEDED_DOOR_IS_LOCKED = SEED_PASSWORD.length > 0

/**
 * Refused for a wrong password and for an address nobody has registered, both.
 * Anything else turns the door into a way of enumerating the shop's customers.
 *
 * The real backend also equalises the timing with a dummy hash. This cannot, and
 * does not pretend to.
 */
const REFUSED = "That email address and password do not match."

export interface SeededLogin {
  email: string
  name: string
  role: Person["role"]
  post: string
  /** What this account is for, shown beside it in development. */
  note: string
}

/**
 * Derived from `PEOPLE` rather than a second list, so the roster cannot fork.
 *
 * The suspended account is included on purpose: it is refused, and a refusal is
 * the half of the model worth being able to exercise while working on the
 * screens. The shopper is included because it now opens the account area, which
 * is the screen phase 3 added.
 */
export const SEEDED_LOGINS: SeededLogin[] = PEOPLE.map((person) => ({
  email: person.email,
  name: person.name,
  role: person.role,
  post: person.post,
  note: !person.active
    ? "Suspended, try it"
    : person.role === "ADMIN"
      ? "Everything, including People"
      : person.role === "STAFF"
        ? "The counter, without People"
        : person.role === "TRADE"
          ? "Trade rates, no console"
          : "The account area, no console",
}))

export type SignIn =
  | { ok: true; person: Person; service?: ServiceSession }
  | { ok: false; status: 401 | 403; message: string }

/**
 * The session the service issued, held on the customer's behalf.
 *
 * The storefront and the service each had a notion of who was signed in and
 * they were not the same notion. This one's cookie was minted and signed here,
 * over a roster in `desk.ts`; the service has never seen it and never issued
 * anything the storefront could show back. So every server to server call was
 * anonymous, and an order placed by a signed in customer was refused with "We
 * need a name and a phone number to deliver this and to call you about it",
 * which they had given when they registered. A guest could buy. A customer
 * could not.
 *
 * The token is the service's own opaque session, sealed inside this server's
 * cookie rather than handed to the browser. It never leaves the server, and the
 * browser holds exactly what it held before: one signed HttpOnly cookie.
 */
export interface ServiceSession {
  token: string
  tier: "retail" | "trade"
}

const API = process.env.ALLFIX_API_URL ?? ""

/** The service names every role an account holds. The desk shows one. */
const RANK: Person["role"][] = ["ADMIN", "STAFF", "TRADE", "CUSTOMER"]

const POST_FOR: Record<Person["role"], string> = {
  ADMIN: "Owner",
  STAFF: "Counter",
  TRADE: "Trade account",
  CUSTOMER: "Customer",
}

function strongest(roles: unknown): Person["role"] {
  const held = Array.isArray(roles) ? roles.map(String) : []
  return RANK.find((role) => held.includes(role)) ?? "CUSTOMER"
}

/**
 * The service's own session cookie, off the response it just set.
 *
 * Read rather than forwarded. Passing the whole Set-Cookie through would put a
 * second session cookie in the customer's browser on a different domain and to
 * no purpose: nothing in the browser ever calls the service directly except the
 * enquiry form, which needs no session at all.
 */
function sessionFrom(response: Response): string | null {
  const header = response.headers.get("set-cookie") ?? ""
  return /(?:^|,\s*)allfix_session=([^;,\s]+)/.exec(header)?.[1] ?? null
}

export async function signInWith(email: string, password: string): Promise<SignIn> {
  if (API) return await signInAtTheService(email, password)
  return seeded(email, password)
}

/**
 * The real door, where there is one.
 *
 * The refusals are the service's own words rather than a translation of its
 * status codes. It distinguishes an unverified address from a suspended account
 * from a wrong password, and it has already decided how much of that is safe to
 * say; restating it here would be a second copy of a security judgement, drifting
 * from the first.
 */
async function signInAtTheService(email: string, password: string): Promise<SignIn> {
  let response: Response
  try {
    response = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
      cache: "no-store",
    })
  } catch {
    return {
      ok: false,
      status: 403,
      message: `We cannot reach the shop's records just now. Call us on ${SHOP.phone}.`,
    }
  }

  const body: Record<string, unknown> | null = await response.json().catch(() => null)

  if (!response.ok) {
    return {
      ok: false,
      status: response.status === 403 ? 403 : 401,
      message: typeof body?.message === "string" ? body.message : REFUSED,
    }
  }

  const token = sessionFrom(response)
  if (!token) {
    // Signed in with nothing to prove it afterwards. Better refused here than
    // let through to a checkout that cannot say who is checking out.
    return { ok: false, status: 403, message: REFUSED }
  }

  const role = strongest(body?.roles)
  return {
    ok: true,
    person: {
      email: String(body?.email ?? email).toLowerCase(),
      name: String(body?.displayName ?? email),
      role,
      // `post` is the roster's own word for what somebody is here to do, and the
      // service has no equivalent and no reason to. The People screen reads it,
      // and that screen shows the roster.
      post: POST_FOR[role],
      active: true,
    },
    service: { token, tier: role === "TRADE" ? "trade" : "retail" },
  }
}

function seeded(email: string, password: string): SignIn {
  const wanted = email.trim().toLowerCase()
  const person = PEOPLE.find((candidate) => candidate.email.toLowerCase() === wanted)

  // Checked only when there is something to check against. Unset, the door is
  // open by configuration rather than by accident, which is what the sheet says.
  const allowed = SEED_PASSWORD ? password === SEED_PASSWORD : true

  if (!person || !allowed) {
    return { ok: false, status: 401, message: REFUSED }
  }

  if (!person.active) {
    return {
      ok: false,
      status: 403,
      message: `This account is suspended. Call the shop on ${SHOP.phone}.`,
    }
  }

  // A shopper used to be refused here, because the account area did not exist
  // and signing somebody in to nowhere is worse than turning them away. It
  // exists now, at `/account`, so the refusal has gone with the reason for it.
  // The remaining refusals are the ones the backend also makes: a suspended
  // account, and an address nobody has registered.

  return { ok: true, person }
}
