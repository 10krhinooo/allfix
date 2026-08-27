import { PEOPLE, type Person } from "@/lib/admin/desk"
import type { ServiceSession } from "@/lib/admin/accounts"
import { DEFAULT_SESSION, SESSION_ENV, idleMinutes } from "@/lib/settings"

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
  /**
   * How long this session has left before inactivity ends it, in ms.
   *
   * Milliseconds remaining rather than the deadline itself, because the only
   * consumer is a browser and a browser's clock is not ours. A machine ten
   * minutes fast handed an absolute timestamp signs itself out on arrival.
   */
  idleInMs: number
  /** The whole window, so a caller can pace itself against it rather than guess. */
  idleWindowMs: number
}

interface Payload {
  email: string
  /**
   * The absolute cap, written once at sign in. `refresh()` carries it across
   * untouched: a re-seal that recomputed it would make a session that is used
   * once a day last for ever, and the fourteen days would quietly stop being a
   * limit at all.
   */
  exp: number
  /** When this session was last used. The only field a re-seal moves. */
  seen: number
  /** The window it was sealed under, in ms, so the gate needs no settings read. */
  idle: number
  /**
   * Who this is, when the service said so rather than `desk.ts`.
   *
   * Absent on a seeded session, where the roster is the answer and re-reading it
   * on every request is the point: a role withdrawn there takes effect at once
   * rather than when a fortnight old cookie happens to expire.
   *
   * Present once a real service is answering, because it has accounts this
   * server has never heard of and looking them up in a hardcoded list would
   * refuse every one. `svc` is the service's own opaque session, held here on
   * the customer's behalf and forwarded on calls made for them, which is what
   * lets the service know who is ordering. It is inside the sealed payload and
   * never reaches the browser.
   */
  who?: {
    name: string
    role: Person["role"]
    svc: string
    tier: "retail" | "trade"
  }
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

/**
 * How long an account may do nothing before it is signed out.
 *
 * Read from the environment here rather than through `settings-service.ts`, and
 * that is the point: this function is called on the path that opens every
 * session, including in the proxy, and a settings fetch there would be a
 * network round trip in front of every gated request. The console's screen is
 * the place the number is *set*; a sealed cookie carries the answer with it, so
 * the gate only ever compares two integers.
 *
 * Written in the shape of `configured()` in `src/lib/rate-limit.ts`, for its
 * reason as well as its shape: a malformed value falls back to the default and
 * never to no timeout at all, because the failure mode of a typo here should be
 * the window somebody expected and never an open door.
 */
export function configuredIdle(): number {
  /*
   * Seconds first, and only ever as a lever for a test.
   *
   * The minutes variable is the one an operator sets and it is floored at five,
   * because a window shorter than that expires people mid-task. That floor also
   * makes the feature impossible to test in anything like reasonable time, which
   * is the same bind `ALLFIX_LIMIT_*` exists to solve in `rate-limit.ts`: the
   * end to end suite needs the behaviour to happen in seconds on purpose. Named
   * in seconds so it cannot be confused with the setting, and left out of the
   * console entirely.
   */
  const seconds = Number(process.env.ALLFIX_SESSION_IDLE_SECONDS?.trim())
  if (Number.isFinite(seconds) && seconds >= 1) return seconds * 1000

  const raw = process.env[SESSION_ENV.idleMinutes]
  return (idleMinutes(raw) ?? DEFAULT_SESSION.idleMinutes) * 60 * 1000
}

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

async function sign(payload: Payload): Promise<string> {
  const signing = await key()
  if (!signing) throw new NoSessionSecret()

  const body = encode(new TextEncoder().encode(JSON.stringify(payload)))
  const signature = await crypto.subtle.sign("HMAC", signing, new TextEncoder().encode(body))
  return `${body}.${encode(new Uint8Array(signature))}`
}

export async function seal(person: Person, service?: ServiceSession): Promise<string> {
  const now = Date.now()
  return sign({
    email: person.email,
    exp: now + MAX_AGE * 1000,
    seen: now,
    idle: configuredIdle(),
    who: service
      ? { name: person.name, role: person.role, svc: service.token, tier: service.tier }
      : undefined,
  })
}

/**
 * The same session, used again just now.
 *
 * A separate function rather than an argument to `seal()`, because the whole
 * difference between them is which fields may move, and that is worth being
 * unable to get wrong: `exp` is carried across verbatim and only `seen` is
 * rewritten. Sealing afresh on every touch would hand out a new fourteen days
 * each time and there would be no cap left.
 *
 * The window is re-read while we are here, so an owner who shortens it on the
 * settings screen reaches sessions that are already open, on their next touch,
 * rather than only sessions opened afterwards.
 *
 * Returns null when the token no longer opens, so a caller cannot accidentally
 * extend something that had already lapsed.
 */
export async function refresh(token: string | undefined): Promise<string | null> {
  const payload = await verified(token)
  if (!payload) return null
  return sign({ ...payload, seen: Date.now(), idle: configuredIdle() })
}

/**
 * The payload carries an address and an expiry, and nothing else. Name and role
 * are read from `PEOPLE` on every request rather than copied into the cookie, so
 * suspending somebody takes effect on their next request instead of whenever
 * their token happens to expire. That is the one revocation property this file
 * can honestly offer, and it is worth having.
 */
async function verified(token: string | undefined): Promise<Payload | null> {
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
    const now = Date.now()
    if (!payload.exp || payload.exp < now) return null

    /*
     * A cookie sealed before there was an idle rule carries neither field.
     * Treated as used just now and re-sealed by the next touch, which
     * grandfathers everybody in for one window. Aging it from its issue time
     * instead would be a forced sign out of every live session the moment this
     * deploys, which is a real cost to pay for a rule nobody has been given the
     * chance to obey yet.
     */
    const seen = payload.seen ?? now
    const idle = payload.idle ?? configuredIdle()
    if (now - seen > idle) return null

    return { ...payload, seen, idle }
  } catch {
    // A cookie that will not parse is stale or tampered with, and either way the
    // answer is the same: nobody is signed in.
    return null
  }
}

export async function open(token: string | undefined): Promise<Desk | null> {
  const payload = await verified(token)
  if (!payload) return null

  // The service's answer where there is one, and the roster otherwise. Not both:
  // an account the service knows about is not in `PEOPLE` and never will be, so
  // falling through to the roster would refuse every real customer.
  const who = payload.who
  const person = who ? null : PEOPLE.find((candidate) => candidate.email === payload.email)
  if (!who && (!person || !person.active)) return null

  return {
    email: payload.email,
    name: who?.name ?? person!.name,
    role: who?.role ?? person!.role,
    idleInMs: Math.max(0, payload.seen + payload.idle - Date.now()),
    idleWindowMs: payload.idle,
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

/**
 * The service session this cookie is holding, for a call made on the customer's
 * behalf. Null on a seeded session, and null when there is no service at all.
 *
 * Separate from `open()` because they answer different questions and only one of
 * them is a secret. `open()` is what a page renders a name and a role from; this
 * is a credential, so it is asked for by name at the one or two call sites that
 * genuinely act as the customer, rather than travelling on every `Desk`.
 */
export async function heldSession(
  token: string | undefined,
): Promise<{ svc: string; tier: "retail" | "trade" } | null> {
  const payload = await verified(token)
  if (!payload?.who) return null
  return { svc: payload.who.svc, tier: payload.who.tier }
}
