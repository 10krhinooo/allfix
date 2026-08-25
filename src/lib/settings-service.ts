import {
  DEFAULT_EMAIL,
  socialLink,
  SOCIAL_ENV,
  SOCIAL_KINDS,
  type EmailSettings,
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
 */
export async function readSettings(): Promise<ShopSettings> {
  if (!API) return fromEnvironment()

  try {
    const response = await fetch(`${API}/api/admin/settings`, {
      next: { revalidate: 300, tags: ["settings"] },
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
      headers: { "Content-Type": "application/json" },
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
