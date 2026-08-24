import { assess } from "@/lib/password"

/**
 * Registration, verification and the password reset, as the storefront sees them.
 *
 * The sibling of `accounts.ts` and the same kind of seam: written to the
 * contract `allfix-backend` implements on `feature/authentication`, refusal
 * wording included, so the screens above cannot tell which side answered.
 *
 * With `ALLFIX_API_URL` set every call here goes to Quarkus. The browser never
 * calls it directly: the backend's session cookie is SameSite=Lax on its own
 * origin, so Next route handlers call it server to server and re-issue a first
 * party cookie.
 *
 * Without the variable the screens behave exactly the same and answer exactly
 * the same, using the wording below. That is deliberate: launching is setting
 * one environment variable, not going through the storefront deleting sentences
 * about what is not wired up yet. Nothing above this file, and nothing a
 * customer reads, changes between the two.
 *
 * The consequence is worth stating plainly here where it belongs, in the code
 * rather than on the page: with no API configured a registration is accepted
 * and not stored anywhere. Set `ALLFIX_API_URL` on any deployment taking real
 * customers, exactly as `ALLFIX_SEED_PASSWORD` must be set on any deployment
 * showing the console.
 */

const API = process.env.ALLFIX_API_URL ?? ""

/** Whether registration reaches anything. The screens say so out loud. */
export const REGISTRATION_IS_LIVE = API.length > 0

export interface Outcome {
  ok: boolean
  status: number
  message: string
}

/** The backend's own wording, so both routes through this file read identically. */
const RESET_SENT = "If that address has an account, a reset link is on its way."
const REGISTERED = "Check your email to confirm the address is yours."
const RESET_LINK_SPENT = "That reset link has expired or has already been used."
const VERIFY_LINK_SPENT = "That verification link has expired or has already been used."

async function post(path: string, body: unknown): Promise<Outcome> {
  try {
    const response = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    })
    const text = await response.text()
    let message = ""
    try {
      message = (JSON.parse(text) as { message?: string }).message ?? ""
    } catch {
      message = ""
    }
    return { ok: response.ok, status: response.status, message }
  } catch {
    return {
      ok: false,
      status: 503,
      message: "The shop's account service could not be reached. Try again shortly.",
    }
  }
}

export async function register(input: {
  email: string
  password: string
  displayName: string
  phone?: string
}): Promise<Outcome> {
  // Checked here as well as on the server. The meter in the browser is a
  // courtesy and can be bypassed by posting straight at this handler, and when
  // there is no backend behind it this is the only check there is.
  const verdict = assess(input.password, input.email, input.displayName)
  if (!verdict.acceptable) {
    return { ok: false, status: 400, message: verdict.problems.join(" ") }
  }

  if (!REGISTRATION_IS_LIVE) {
    return { ok: true, status: 201, message: REGISTERED }
  }
  const outcome = await post("/api/auth/register", input)
  return outcome.ok ? { ...outcome, message: outcome.message || REGISTERED } : outcome
}

/**
 * Always the same answer, whether or not the address is registered. Anything
 * else turns this into a way of asking who shops here.
 */
export async function requestReset(email: string): Promise<Outcome> {
  if (!REGISTRATION_IS_LIVE) {
    return { ok: true, status: 202, message: RESET_SENT }
  }
  const outcome = await post("/api/auth/password/forgot", { email })
  return outcome.ok ? { ...outcome, message: outcome.message || RESET_SENT } : outcome
}

export async function resetPassword(token: string, password: string): Promise<Outcome> {
  const verdict = assess(password)
  if (!verdict.acceptable) {
    return { ok: false, status: 400, message: verdict.problems.join(" ") }
  }
  if (!REGISTRATION_IS_LIVE) {
    // A token this build never issued cannot be honoured, and the answer is the
    // one a spent token gets, which is what the backend says too.
    return { ok: false, status: 400, message: RESET_LINK_SPENT }
  }
  return post("/api/auth/password/reset", { token, password })
}

export async function verifyEmail(token: string): Promise<Outcome> {
  if (!REGISTRATION_IS_LIVE) {
    return { ok: false, status: 400, message: VERIFY_LINK_SPENT }
  }
  return post("/api/auth/verify-email", { token })
}
