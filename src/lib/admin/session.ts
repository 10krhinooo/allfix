import { PEOPLE, type Person } from "@/lib/admin/desk"

/**
 * The session cookie's shape and signature, in one place.
 *
 * Mirrors `SessionCookie.java` in `allfix-backend`: HttpOnly so no script can
 * read it, SameSite=Lax so it rides ordinary navigations but not a form posted
 * from another origin, Secure outside development, where there is no TLS to be
 * secure over.
 *
 * What the signature is for: it stops somebody opening devtools, changing
 * `"role":"STAFF"` to `"ADMIN"` and re-encoding. Role separation is the thing
 * this console is demonstrating, so it has to survive a curious viewer.
 *
 * What it is not: a session. There is no token table here, so a cookie already
 * handed out cannot be revoked before it expires, and revocation is exactly what
 * the backend's `account_session` rows exist to provide. This is a bicycle lock,
 * and it is labelled as one.
 */

export const COOKIE = "allfix_session"

/** Re-exported so the server has one import for everything cookie shaped. */
export { HINT } from "@/lib/admin/hint"

/** Fourteen days, matching AuthResource.FOURTEEN_DAYS. */
const MAX_AGE = 14 * 24 * 60 * 60

export interface Desk {
  email: string
  name: string
  role: Person["role"]
}

interface Payload {
  email: string
  exp: number
}

/**
 * The signing key, and what happens when nobody set one.
 *
 * The fallback used to be a string in this file, so a deployment that never set
 * `ALLFIX_SESSION_SECRET` was signing sessions with a key anybody can read:
 * forging `{"email":"hafsah@allfix.co.ke"}` and landing in the console as the
 * owner is then a two line script. Documenting that the variable "must be set"
 * is not a control, because the failure is silent and looks exactly like
 * success.
 *
 * So it fails closed instead. Outside development a missing secret means no
 * session can be sealed and none can be opened: the console is shut rather than
 * open to everybody. It is checked at the point of use rather than at import,
 * because a throw at import time would take out the build itself, and a build
 * that cannot run is a worse way to learn this than a sign in that refuses and
 * says why.
 */
/**
 * The development stand-in is generated per process rather than written here.
 *
 * A fallback constant in this file is a signing key published in a public
 * repository, and a scanner is right to call that what it is. Generated, it
 * cannot be known off the page, and the only cost is that restarting `next dev`
 * signs you out: set `ALLFIX_SESSION_SECRET` in `.env.local` if that is a
 * nuisance, which is the same thing every deployment has to do anyway.
 */
const DEVELOPMENT_SECRET = crypto.randomUUID()

/**
 * Thirty two characters, because the key is imported as raw HMAC-SHA256 material
 * and a key shorter than the digest it feeds has less in it than the signature it
 * produces. A floor, not a measure of quality: it catches `secret`, `changeme`
 * and a paste that lost its tail, and it cannot tell a long guessable phrase from
 * a random one. `openssl rand -base64 32` clears it and the question stops being
 * interesting.
 *
 * A key that does not clear it is treated as no key at all, so it gets the same
 * refusal an absent one gets rather than a second failure mode to reason about:
 * shut in production, per process stand-in outside it. Trimmed first, because a
 * key that arrived with the newline `echo` adds is the key nobody meant to set,
 * and it would sign perfectly well while quietly being a different key.
 */
const MINIMUM_KEY = 32

function secret(): string | null {
  const set = process.env.ALLFIX_SESSION_SECRET?.trim()
  if (set && set.length >= MINIMUM_KEY) return set
  return process.env.NODE_ENV === "production" ? null : DEVELOPMENT_SECRET
}

function encode(bytes: Uint8Array<ArrayBuffer>): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function decode(text: string): Uint8Array<ArrayBuffer> {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4))
  return Uint8Array.from(raw, (character) => character.charCodeAt(0))
}

/**
 * Web Crypto rather than `node:crypto`. Proxy runs on Node in Next 16, but the
 * route handlers import this same module and there is no reason to make the
 * runtime something anybody has to remember. `crypto.subtle.verify` is also
 * constant time by construction, so the comparison does not have to be written
 * carefully by hand.
 */
async function key(): Promise<CryptoKey | null> {
  const signing = secret()
  if (!signing) return null
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signing),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
}

/** Thrown rather than returned: there is no half-signed cookie to fall back to. */
export class NoSessionSecret extends Error {
  constructor() {
    // Which of the two it is never reaches the person signing in, who cannot act
    // on it either way. It belongs in the log the operator reads, and telling
    // them "not set" when the key is set but short would cost them the afternoon.
    const set = process.env.ALLFIX_SESSION_SECRET?.trim()
    super(
      set
        ? `ALLFIX_SESSION_SECRET is ${set.length} characters and ${MINIMUM_KEY} is the ` +
          "minimum, so no session can be signed. A key with less in it than the signature " +
          "it produces is not a key. Generate one with `openssl rand -base64 32`."
        : "ALLFIX_SESSION_SECRET is not set, so no session can be signed. Set it wherever " +
          "this is deployed. Signing with the development key would let anybody forge a " +
          "console session.",
    )
  }
}

export async function seal(person: Person): Promise<string> {
  const signing = await key()
  if (!signing) throw new NoSessionSecret()

  const payload: Payload = { email: person.email, exp: Date.now() + MAX_AGE * 1000 }
  const body = encode(new TextEncoder().encode(JSON.stringify(payload)))
  const signature = await crypto.subtle.sign("HMAC", signing, new TextEncoder().encode(body))
  return `${body}.${encode(new Uint8Array(signature))}`
}

/**
 * The payload carries an address and an expiry, and nothing else. Name and role
 * are read from `PEOPLE` on every request rather than copied into the cookie, so
 * suspending somebody takes effect on their next request instead of whenever
 * their token happens to expire. That is the one revocation property this file
 * can honestly offer, and it is worth having.
 */
export async function open(token: string | undefined): Promise<Desk | null> {
  if (!token) return null
  const [body, signature] = token.split(".")
  if (!body || !signature) return null

  const signing = await key()
  // Nothing to verify against, so nobody is signed in. The refusal to seal is
  // where somebody finds out why.
  if (!signing) return null

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      signing,
      decode(signature),
      new TextEncoder().encode(body),
    )
    if (!valid) return null

    const payload = JSON.parse(new TextDecoder().decode(decode(body))) as Payload
    if (!payload.exp || payload.exp < Date.now()) return null

    const person = PEOPLE.find((candidate) => candidate.email === payload.email)
    if (!person || !person.active) return null

    return { email: person.email, name: person.name, role: person.role }
  } catch {
    // A cookie that will not parse is stale or tampered with, and either way the
    // answer is the same: nobody is signed in.
    return null
  }
}

/**
 * One set of attributes for both issuing and clearing. A cookie cleared with
 * attributes that do not match the one it is replacing is simply a second
 * cookie, and the browser keeps sending the first.
 */
export function cookieOptions(maxAge: number = MAX_AGE) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  }
}

/** The hint's attributes: the same lifetime, and deliberately not HttpOnly. */
export function hintOptions(maxAge: number = MAX_AGE) {
  return { ...cookieOptions(maxAge), httpOnly: false }
}
