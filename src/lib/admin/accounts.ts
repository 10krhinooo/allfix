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
  | { ok: true; person: Person }
  | { ok: false; status: 401 | 403; message: string }

export function signInWith(email: string, password: string): SignIn {
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
