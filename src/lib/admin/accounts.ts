import { PEOPLE, type Person } from "@/lib/admin/desk"
import { SHOP } from "@/lib/format"

/**
 * The credential check, and the one file that changes when the backend deploys.
 *
 * `allfix-backend` has already built the real thing on `feature/authentication`:
 * accounts, BCrypt passwords, opaque revocable sessions and role checks, with
 * tests passing. It is not hosted yet, so this stands in for it, written to the
 * same contract so the swap is a change of one function rather than a change of
 * shape. The refusals below are copied from `AuthResource.login` word for word,
 * which is what makes them worth copying: when the fetch replaces the table, the
 * screens above do not notice.
 *
 * The demo passwords are plaintext on purpose. A BCrypt hash here would imply a
 * property this file does not have, and the passwords are printed on the sign in
 * page regardless: the point of a demo door is that anybody can open it.
 */

/** One password for every account, so the on-screen list stays readable. */
const DEMO_PASSWORD = "allfix"

/**
 * Refused for a wrong password and for an address nobody has registered, both.
 * Anything else turns the door into a way of enumerating the shop's customers.
 *
 * The real backend also equalises the timing with a dummy hash. This cannot, and
 * does not pretend to.
 */
const REFUSED = "That email address and password do not match."

export interface DemoLogin {
  email: string
  name: string
  role: Person["role"]
  post: string
  /** What this row is here to demonstrate, shown on the sign in page. */
  note: string
}

/**
 * Derived from `PEOPLE` rather than a second list, so the roster cannot fork.
 *
 * The suspended account and the shopper are deliberately included. A door that
 * only ever opens demonstrates nothing: the refusals are the half of the model
 * worth seeing, and the old name picker could not show them at all.
 */
export const DEMO_LOGINS: DemoLogin[] = PEOPLE.map((person) => ({
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

  if (!person || password !== DEMO_PASSWORD) {
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
