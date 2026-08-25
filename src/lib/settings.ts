/**
 * What the shop says about itself, in the one place that decides it.
 *
 * The shape of it, and nothing that reads or writes one. `settings-service.ts`
 * is the seam that fetches and saves, and it is server only; this half is
 * imported by the console's form as well, which runs in a browser.
 *
 * Nothing here is hardcoded into a page, which is the whole point. A social
 * account changes hands, a sender address moves to a verified alias, and
 * neither should be a deploy of a component.
 *
 * The social links are genuinely unknown: the old WooCommerce site published
 * none, and the client has not supplied any. So the default is an empty list and
 * the footer renders nothing rather than six dead icons, which is the same rule
 * the catalogue follows about a price it was never given.
 */

export const SOCIAL_KINDS = [
  "instagram",
  "facebook",
  "tiktok",
  "x",
  "linkedin",
  "youtube",
] as const

export type SocialKind = (typeof SOCIAL_KINDS)[number]

export const SOCIAL_LABEL: Record<SocialKind, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  x: "X",
  linkedin: "LinkedIn",
  youtube: "YouTube",
}

/**
 * The environment variable each link is read from when there is no settings
 * service. Named here rather than built from the key, so the console can print
 * the exact line somebody has to add to Vercel.
 */
export const SOCIAL_ENV: Record<SocialKind, string> = {
  instagram: "ALLFIX_SOCIAL_INSTAGRAM",
  facebook: "ALLFIX_SOCIAL_FACEBOOK",
  tiktok: "ALLFIX_SOCIAL_TIKTOK",
  x: "ALLFIX_SOCIAL_X",
  linkedin: "ALLFIX_SOCIAL_LINKEDIN",
  youtube: "ALLFIX_SOCIAL_YOUTUBE",
}

/** Which of the shop's messages go out, and from where. */
export const NOTICES = [
  ["orderPlaced", "Order placed", "The reference and what was ordered, as soon as it is taken."],
  ["paymentReceived", "Payment received", "Sent against the payment, not against the prompt."],
  ["paymentRefused", "Payment refused", "What happened, and what to do about it."],
  ["orderMoved", "Order moved along", "Packed is silent. Dispatched, ready and cancelled are not."],
  ["bookingConfirmed", "Booking confirmed", "The reference for a survey or an enquiry, in writing."],
] as const

export type Notice = (typeof NOTICES)[number][0]

export interface EmailSettings {
  /** The name a message appears from, beside the address. */
  fromName: string
  /**
   * The address it is sent as. Gmail rewrites this to the authenticated mailbox
   * unless it is a verified alias, so setting it is half the job and verifying
   * the domain is the other half.
   */
  fromAddress: string
  /** Where a reply goes, which is the counter rather than the sending mailbox. */
  replyTo: string
  /** The counter's own copy, so a booking is not only in one customer's inbox. */
  copyTo: string | null
  /** Which messages send at all. */
  sends: Record<Notice, boolean>
}

export interface ShopSettings {
  social: Partial<Record<SocialKind, string>>
  email: EmailSettings
  /** Where these came from, so a screen can say so rather than implying a database. */
  source: "service" | "environment"
}

export const DEFAULT_EMAIL: EmailSettings = {
  fromName: "AllFix By Kipekee",
  fromAddress: "no-reply@allfix.co.ke",
  replyTo: "sales@allfix.co.ke",
  copyTo: null,
  sends: {
    orderPlaced: true,
    paymentReceived: true,
    paymentRefused: true,
    orderMoved: true,
    bookingConfirmed: true,
  },
}

/** A link is kept only if it is a real absolute URL. A typo is worse than a gap. */
export function socialLink(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  try {
    const url = new URL(trimmed)
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined
  } catch {
    return undefined
  }
}
