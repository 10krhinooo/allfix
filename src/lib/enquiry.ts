import { whatsapp } from "@/lib/format"
import { fileEnquiry } from "@/lib/admin/store"

/**
 * An enquiry, and the two ways one can reach the shop.
 *
 * WhatsApp is how this business already works, and nothing here takes that
 * away: the deep link stays on every form and every call to action. But an
 * enquiry that only exists in a WhatsApp thread only exists on one phone. It
 * cannot be counted, it cannot be picked up by whoever is actually at the
 * counter, and nobody can tell on Friday what came in on Tuesday.
 *
 * So both paths compose the same enquiry from the same fields. One opens a chat
 * with it written out; the other files it, and it appears in the console queue.
 * The customer picks, and the shop gets a record either way it is sent through
 * the site.
 */

export type EnquiryKind = "quote" | "survey" | "trade" | "parts"

export interface EnquiryDraft {
  kind: EnquiryKind
  name: string
  phone: string
  /**
   * Where the confirmation goes, when there is somewhere to send it.
   *
   * Optional, and staying optional. The phone number is what the counter works
   * an enquiry from, and insisting on an address as well would cost the shop
   * the enquiries from people who do not use one. What it buys is the reference
   * in writing: the number is read out once on a confirmation screen, and
   * somebody who wrote it on the back of something has lost it by the time they
   * ring.
   */
  email: string
  area: string
  /** The one line the counter reads first. */
  summary: string
  /** Everything else, already written as prose rather than as a field dump. */
  detail: string
  /** The rail system this is about, where the customer knew it. */
  system?: string | null
}

export type SendResult =
  | { ok: true; reference: string }
  | { ok: false; message: string }

/**
 * Where the backend is, when there is one.
 *
 * Undefined today, which is not a failure state: the API that will own this is
 * written but not deployed, so the enquiry is filed into the console's own
 * store instead and the whole loop can be shown working. This constant is the
 * only line that has to change.
 */
const API = process.env.NEXT_PUBLIC_API_URL

/**
 * A number the customer can quote on the phone.
 *
 * Sequential rather than random, because it is read aloud. "AF-1043" survives
 * a bad line in a way a hash does not.
 */
function reference(count: number) {
  return `AF-${1040 + count}`
}

export async function sendEnquiry(draft: EnquiryDraft): Promise<SendResult> {
  const problem = problemWith(draft)
  if (problem) return { ok: false, message: problem }

  if (API) {
    try {
      const response = await fetch(`${API}/api/enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...draft, email: draft.email.trim() || null }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        return {
          ok: false,
          message:
            body?.message ??
            "Something went wrong at our end. Try again, or send it on WhatsApp instead.",
        }
      }
      const body = await response.json().catch(() => null)
      return { ok: true, reference: body?.reference ?? "sent" }
    } catch {
      // Never throws at a form. Whoever is filling this in has just measured a
      // window, and losing what they typed to a dropped connection is the one
      // outcome worth engineering against.
      return {
        ok: false,
        message: "Could not reach us. Check your connection, or send it on WhatsApp instead.",
      }
    }
  }

  return { ok: true, reference: fileEnquiry(draft, reference) }
}

/**
 * A phone number is the only thing this insists on, and only on this path.
 *
 * Sending on WhatsApp carries the number with the message, so the shop can
 * always reply. Filing it through the site does not, and an enquiry the counter
 * cannot ring back is not an enquiry.
 */
function problemWith(draft: EnquiryDraft): string | null {
  if (!draft.name.trim()) return "We need a name to put on it."
  const digits = draft.phone.replace(/\D/g, "")
  if (digits.length < 9) return "We need a phone number we can call you back on."
  // Checked only when one was given, and checked loosely. The server has the
  // real rule; this is here so an obvious slip is caught beside the field
  // rather than coming back as a refusal from somewhere else.
  const email = draft.email.trim()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "That email address does not look right. Check it, or leave it blank and we will call you instead."
  }
  return null
}

/** The same enquiry, written out for a chat window. */
export function enquiryMessage(draft: EnquiryDraft) {
  return whatsapp(
    [
      `Hello AllFix, ${draft.summary}`,
      draft.name.trim() && `Name: ${draft.name.trim()}.`,
      draft.area.trim() && `Area: ${draft.area.trim()}.`,
      draft.detail.trim(),
    ]
      .filter(Boolean)
      .join(" "),
  )
}
