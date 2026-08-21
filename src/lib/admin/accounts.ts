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
 * The seeded passwords are plaintext because they are seeds, not secrets. They
 * exist so the console can be worked on and shown, they are compiled out of the
 * sign in page in a production build, and a deployed shop replaces them by
 * granting real accounts.
 */

/** One password across the seeded accounts, so the development list stays usable. */
const SEED_PASSWORD = "allfix"

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
 * The suspended account and the shopper are included on purpose. Both are
 * refused, and the refusals are the half of the model worth being able to
 * exercise while working on the screens.
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
          : "A shopper, refused",
}))

export type SignIn =
  | { ok: true; person: Person }
  | { ok: false; status: 401 | 403; message: string }

export function signInWith(email: string, password: string): SignIn {
  const wanted = email.trim().toLowerCase()
  const person = PEOPLE.find((candidate) => candidate.email.toLowerCase() === wanted)

  if (!person || password !== SEED_PASSWORD) {
    return { ok: false, status: 401, message: REFUSED }
  }

  if (!person.active) {
    return {
      ok: false,
      status: 403,
      message: `This account is suspended. Call the shop on ${SHOP.phone}.`,
    }
  }

  // A shopper's account area is phase 3 work in PROJECT_PLAN.md and does not
  // exist, so saying "no console access" is the honest refusal rather than
  // signing somebody in to nowhere.
  if (person.role === "CUSTOMER") {
    return {
      ok: false,
      status: 403,
      message: "This is the staff and trade door. The shopper account area is not built yet.",
    }
  }

  return { ok: true, person }
}
