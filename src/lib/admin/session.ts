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

const SECRET = process.env.ALLFIX_DEMO_SECRET ?? "allfix-demo-secret-not-for-production"

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
async function key(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
}

export async function seal(person: Person): Promise<string> {
  const payload: Payload = { email: person.email, exp: Date.now() + MAX_AGE * 1000 }
  const body = encode(new TextEncoder().encode(JSON.stringify(payload)))
  const signature = await crypto.subtle.sign("HMAC", await key(), new TextEncoder().encode(body))
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

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await key(),
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
