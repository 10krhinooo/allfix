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

/**
 * How long a signed in account may do nothing before it is signed out.
 *
 * Neither social nor email, so it is a group of its own rather than a field
 * bent into one of theirs. It is the whole shop's in the same way the sending
 * address is: it decides what happens to every account, not to one part.
 *
 * One number today, and the shape is picked so it can become two. A shopper
 * left on a product page and a member of staff left on the counter's console
 * are not obviously the same risk, and if twenty minutes reads as hostile to
 * customers the answer is a second field here rather than a different design.
 */
export interface SessionSettings {
  idleMinutes: number
}

export const DEFAULT_SESSION: SessionSettings = { idleMinutes: 20 }

/** Named rather than derived, so the console can print the line to add. */
export const SESSION_ENV = { idleMinutes: "ALLFIX_SESSION_IDLE_MINUTES" } as const

/**
 * The floor and the ceiling, and why they are where they are.
 *
 * Below five minutes the window starts to expire people mid-task: reading a
 * long order, typing an address, taking a phone call at the counter. Above
 * eight hours it is not an inactivity timeout, it is the fourteen day cap
 * spelled differently, and somebody has misunderstood the field.
 */
export const IDLE_MIN = 5
export const IDLE_MAX = 480

/**
 * A window is kept only if it is a whole number of minutes inside the bounds.
 *
 * The same contract as `socialLink()`: `undefined` for anything unusable rather
 * than a throw or a silent substitution, so the form, the service and the
 * action all agree on what is valid without any of them deciding alone. Out of
 * range is refused here and clamped by the caller that has somewhere to clamp
 * to, because a value quietly replaced by a different one is the thing this
 * repository keeps being careful about.
 */
export function idleMinutes(raw: string | number | undefined | null): number | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined
  const value = typeof raw === "number" ? raw : Number(raw.trim())
  if (!Number.isInteger(value)) return undefined
  return value >= IDLE_MIN && value <= IDLE_MAX ? value : undefined
}

export interface ShopSettings {
  social: Partial<Record<SocialKind, string>>
  email: EmailSettings
  session: SessionSettings
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
