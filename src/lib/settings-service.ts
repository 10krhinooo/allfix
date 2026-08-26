import {
  DEFAULT_EMAIL,
  DEFAULT_SESSION,
  idleMinutes,
  SESSION_ENV,
  socialLink,
  SOCIAL_ENV,
  SOCIAL_KINDS,
  type EmailSettings,
  type SessionSettings,
  type ShopSettings,
  type SocialKind,
} from "@/lib/settings"

/**
 * Reading and saving what the shop says about itself.
 *
 * The sibling of `accounts.ts`, `registration.ts` and `orders-api.ts`, and the
 * same seam: with `ALLFIX_API_URL` set it reads the console API server to
 * server, and without it it reads the environment, which is a real way to
 * publish a social link today rather than a placeholder.
 *
 * Server only, by what it touches rather than by a marker: it reads
 * `process.env` and posts to the service, and neither has any business in a
 * browser bundle. Every caller is a server component or a server action.
 */

const API = process.env.ALLFIX_API_URL ?? ""

/**
 * How this server proves it is this server.
 *
 * The console's settings are admin's, and rightly `@RolesAllowed("ADMIN")` on the
 * other side. But the caller here is a Next server rendering a page, not a
 * person: it holds no account, and the session cookie it does hold is one it
 * minted and signed itself, so there is nothing it could forward that Quarkus
 * has ever issued. Every read and every save was therefore anonymous, came back
 * 401, and was swallowed by the fallbacks below. That is why a social link saved
 * on the console never reached the footer, and it went unnoticed because the
 * fallback looks exactly like a shop that has not set one.
 *
 * So the trusted caller carries a name. Server only, never `NEXT_PUBLIC_`, and
 * never sent from a browser: if this ever appears in a bundle it has stopped
 * being a secret and has to be rotated.
 */
const SERVICE_TOKEN = process.env.ALLFIX_SERVICE_TOKEN ?? ""

const asService = (): Record<string, string> =>
  SERVICE_TOKEN ? { "X-Allfix-Service": SERVICE_TOKEN } : {}

function fromEnvironment(): ShopSettings {
  const social: Partial<Record<SocialKind, string>> = {}
  for (const kind of SOCIAL_KINDS) {
    const found = socialLink(process.env[SOCIAL_ENV[kind]])
    if (found) social[kind] = found
  }

  return {
    social,
    email: {
      ...DEFAULT_EMAIL,
      fromName: process.env.ALLFIX_MAIL_FROM_NAME || DEFAULT_EMAIL.fromName,
      fromAddress: process.env.ALLFIX_MAIL_FROM || DEFAULT_EMAIL.fromAddress,
      replyTo: process.env.ALLFIX_MAIL_REPLY_TO || DEFAULT_EMAIL.replyTo,
      copyTo: process.env.ALLFIX_MAIL_COPY_TO || null,
    },
    session: {
      idleMinutes:
        idleMinutes(process.env[SESSION_ENV.idleMinutes]) ?? DEFAULT_SESSION.idleMinutes,
    },
    source: "environment",
  }
}

/**
 * Read once per request tree at most, and cached for five minutes when it comes
 * from the service.
 *
 * The footer is on every page in the shop, and those pages are prerendered. A
 * no-store fetch here would make the whole storefront dynamic to print four
 * icons, so the settings are revalidated on a timer instead: a social link
 * appearing five minutes after it is saved is not a problem anybody has.
 *
 * Two endpoints, split by audience rather than by convenience. `/api/settings`
 * is public and carries only what a visitor would learn anyway: the accounts the
 * shop publishes, and how long it waits before signing somebody out.
 * `/api/admin/settings` additionally carries the sending and reply addresses,
 * which are internal, so it needs the service token. `everything` says which is
 * wanted: the footer does not need the email block and should not be able to
 * leak it, while the console screen edits it.
 */
export async function readSettings(everything = false): Promise<ShopSettings> {
  if (!API) return fromEnvironment()

  const path = everything ? "/api/admin/settings" : "/api/settings"

  try {
    const response = await fetch(`${API}${path}`, {
      next: { revalidate: 300, tags: ["settings"] },
      headers: everything ? asService() : {},
    })
    if (!response.ok) return fromEnvironment()

    const body = (await response.json()) as Partial<ShopSettings>
    const social: Partial<Record<SocialKind, string>> = {}
    for (const kind of SOCIAL_KINDS) {
      const found = socialLink(body.social?.[kind])
      if (found) social[kind] = found
    }
    return {
      social,
      email: { ...DEFAULT_EMAIL, ...body.email, sends: { ...DEFAULT_EMAIL.sends, ...body.email?.sends } },
      // Through the normaliser rather than spread straight in: a service that
      // answers with nothing, or with a number outside the bounds, must not be
      // able to leave the shop with no idle window.
      session: {
        idleMinutes: idleMinutes(body.session?.idleMinutes) ?? DEFAULT_SESSION.idleMinutes,
      },
      source: "service",
    }
  } catch {
    // A settings service that is down is not a reason for the shop to be down.
    return fromEnvironment()
  }
}

export type SaveResult = { ok: true } | { ok: false; message: string }

/**
 * Saving, and saying so when there is nowhere to save to.
 *
 * The refusal is the same one `registration.ts` makes, and for the same reason:
 * a console that accepts a change, shows a tick and drops it is worse than one
 * that says plainly it cannot keep it. The message names what to set instead,
 * because the environment is a real way to publish these today.
 */
export async function saveSettings(next: {
  social: Partial<Record<SocialKind, string>>
  email: EmailSettings
  session: SessionSettings
}): Promise<SaveResult> {
  if (!API) {
    return {
      ok: false,
      message:
        "No settings service is configured, so nothing was saved. These are read from the " +
        "environment today: set them where the site is deployed, or point ALLFIX_API_URL at " +
        "the console API and this screen will keep them.",
    }
  }

  try {
    const response = await fetch(`${API}/api/admin/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...asService() },
      body: JSON.stringify(next),
      cache: "no-store",
    })
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { message?: string }
      return { ok: false, message: body.message ?? "That did not save. Try again in a moment." }
    }
    return { ok: true }
  } catch {
    return {
      ok: false,
      message: "We could not reach the settings service just then. Nothing was saved.",
    }
  }
}
