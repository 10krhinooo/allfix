/**
 * A limit on how often one caller may knock.
 *
 * The plan asks for rate limiting on authentication, password reset, payment
 * initiation and the enquiry forms, and there was none anywhere. Without it the
 * sign in endpoint will answer a password guess as fast as a script can ask,
 * and the reset form will send mail to any address anybody types as fast as they
 * can type it.
 *
 * Held in memory, and that is a real limitation rather than a detail: a serverless
 * deployment runs several instances and each keeps its own counter, so the
 * effective limit is the one below times however many instances are warm. It is
 * still worth having. It ends the single-process flood, which is the shape
 * nearly every one of these attempts takes, and it costs nothing to run. The
 * durable version belongs behind the shop's own service, where a counter can be
 * shared, and the backend enforces its own limits on the same endpoints for
 * exactly that reason: this one is a courtesy at the edge, that one is the
 * control.
 *
 * Keyed by address and by route together, so somebody guessing a password does
 * not also lock themselves out of ordering, and a shared office address does not
 * lock a whole street out of the shop because one person mistyped a password.
 */

interface Window {
  /** When the current window started. */
  from: number
  hits: number
}

const seen = new Map<string, Window>()

/** Belt and braces on memory: a map that only grows is a leak with a schedule. */
const MAX_KEYS = 10_000

export interface Limit {
  /** How many are allowed inside the window. */
  hits: number
  /** How long the window is, in seconds. */
  seconds: number
}

/**
 * The limits, per route, written where they can be read next to each other.
 *
 * They are deliberately generous for a person and mean for a script. Five sign
 * in attempts a minute is more than anybody types by hand and far less than a
 * dictionary needs; three password resets in ten minutes is more than one person
 * ever needs and stops the form being used to post mail at somebody.
 */
const DEFAULTS: Record<string, Limit> = {
  login: { hits: 5, seconds: 60 },
  register: { hits: 5, seconds: 600 },
  forgot: { hits: 3, seconds: 600 },
  reset: { hits: 5, seconds: 600 },
  order: { hits: 10, seconds: 60 },
}

/**
 * A limit can be set where the site is deployed, as `hits/seconds`.
 *
 * `ALLFIX_LIMIT_LOGIN=20/60` allows twenty sign in attempts a minute. It exists
 * for two real cases: a shop working from one office address behind one public
 * IP, where every counter looks like the same caller, and the end to end suite,
 * which signs in dozens of times in a minute on purpose and would otherwise be
 * testing this file rather than the shop. A malformed value is ignored rather
 * than obeyed, because the failure mode of a typo here should be the default
 * limit and never no limit at all.
 */
function configured(route: string): Limit | undefined {
  const raw = process.env[`ALLFIX_LIMIT_${route.toUpperCase()}`]
  if (!raw) return undefined

  const [hits, seconds] = raw.split("/").map((part) => Number(part.trim()))
  if (!Number.isFinite(hits) || !Number.isFinite(seconds) || hits! < 1 || seconds! < 1) {
    return undefined
  }
  return { hits: hits!, seconds: seconds! }
}

export function limitFor(route: string): Limit | undefined {
  const fallback = DEFAULTS[route]
  if (!fallback) return undefined
  return configured(route) ?? fallback
}

/**
 * Who is asking, as well as a proxy can tell.
 *
 * `x-forwarded-for` is set by the platform in front of this and can be spoofed
 * where nothing sets it, which is why the answer is only ever used to slow
 * somebody down and never to decide who they are. The leftmost entry is the
 * client as the first proxy saw it.
 */
export function caller(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]!.trim()
  return request.headers.get("x-real-ip")?.trim() || "unknown"
}

export interface Verdict {
  ok: boolean
  /** Seconds until the window resets, for the Retry-After header. */
  retryAfter: number
}

export function check(request: Request, route: string): Verdict {
  const limit = limitFor(route)
  if (!limit) return { ok: true, retryAfter: 0 }

  const now = Date.now()
  const key = `${route}:${caller(request)}`
  const window = seen.get(key)

  if (!window || now - window.from >= limit.seconds * 1000) {
    if (seen.size >= MAX_KEYS) {
      // Everything older than the longest window is spent. Cheaper and more
      // predictable than evicting one entry per insert.
      for (const [held, entry] of seen) {
        if (now - entry.from >= limit.seconds * 1000) seen.delete(held)
      }
    }
    seen.set(key, { from: now, hits: 1 })
    return { ok: true, retryAfter: 0 }
  }

  window.hits += 1
  if (window.hits > limit.hits) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((window.from + limit.seconds * 1000 - now) / 1000)),
    }
  }
  return { ok: true, retryAfter: 0 }
}

/**
 * The refusal, worded for a person who has simply been quick.
 *
 * Most of the people who see this are not attacking anything: they have mistyped
 * a password three times and are getting frustrated, so it says what to do and
 * how long for rather than accusing them of something.
 */
export function tooMany(retryAfter: number): Response {
  const wait = retryAfter < 60 ? `${retryAfter} seconds` : `${Math.ceil(retryAfter / 60)} minutes`
  return new Response(
    JSON.stringify({
      message: `That is a few too many tries in a row. Wait ${wait} and try again, or call the shop and we will sort it out at the counter.`,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    },
  )
}

/** Only for tests: forgets every window so one spec cannot lock out the next. */
export function forget() {
  seen.clear()
}
