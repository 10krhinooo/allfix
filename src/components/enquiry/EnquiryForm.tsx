"use client"

import { useState, type ReactNode } from "react"
import { WhatsAppIcon } from "@/components/ui"
import { sendEnquiry, enquiryMessage } from "@/lib/enquiry"
import type { EnquiryDraft, EnquiryKind } from "@/lib/enquiry"

/**
 * One enquiry form, wherever the shop takes an enquiry.
 *
 * Booking a visit and asking about a service are the same transaction from the
 * counter's side: somebody's name, a number to ring them on, roughly where they
 * are, and a sentence about what they want. Only the middle of the form differs,
 * so only the middle is passed in. The two used to be one form and one page,
 * and the second copy would have drifted from the first the day either was
 * changed.
 *
 * WhatsApp is not the fallback here and does not read as one. It is how this
 * business already works, it gets a real button, and for a lot of customers it
 * genuinely is the better path. What it cannot do is leave a record: an enquiry
 * that exists in a chat thread exists on one phone, whoever is at the counter
 * cannot pick it up, and nothing counts it. So both paths compose the same
 * enquiry from the same fields, and the customer picks.
 */

const FIELD = "w-full border border-rule bg-paper px-3 py-2.5 text-ink focus:outline-none"

export interface EnquiryFormCopy {
  /** The badge on the panel that replaces the form once it is sent. */
  badge: string
  /** The line under it, in the same verb as the button that produced it. */
  sent: string
  /** What happens next, given the number they left. */
  next: (phone: string) => string
  /** The button that sends it through the site. */
  submit: string
  /** The label over the free text box, and its placeholder. */
  notes: string
  notesPlaceholder: string
}

export function EnquiryForm({
  kind,
  summary,
  detail,
  system = null,
  copy,
  areaLabel = "Area or town",
  areaPlaceholder,
  children,
}: {
  kind: EnquiryKind
  /** The one line the counter reads first, composed by the page. */
  summary: string
  /** Everything the page knows that is not on this form, as prose. */
  detail: string
  system?: string | null
  copy: EnquiryFormCopy
  areaLabel?: string
  areaPlaceholder?: string
  /** The fields this particular enquiry adds, between the area and the notes. */
  children?: ReactNode
}) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [area, setArea] = useState("")
  const [notes, setNotes] = useState("")

  const [sending, setSending] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)

  const draft: EnquiryDraft = {
    kind,
    name,
    phone,
    email,
    area,
    summary,
    detail: [detail, notes.trim()].filter(Boolean).join(" "),
    system,
  }

  async function send() {
    setProblem(null)
    setSending(true)
    const result = await sendEnquiry(draft)
    setSending(false)
    if (!result.ok) {
      // Nothing typed is cleared on a failure. Somebody has just been up a
      // ladder with a tape measure, and losing that to a bad connection is the
      // one outcome worth engineering against.
      setProblem(result.message)
      return
    }
    setReference(result.reference)
  }

  if (reference) {
    return (
      <div className="max-w-xl border border-rule">
        <div className="drafting border-b border-rule px-6 py-5">
          <p className="callout">{copy.badge}</p>
          <p className="mt-2 font-display text-2xl font-bold tracking-tight">{copy.sent}</p>
        </div>
        <div className="px-6 py-6">
          <p className="callout">Your reference</p>
          <p className="mt-1 font-mono text-3xl text-ink">{reference}</p>
          <p className="mt-4 leading-relaxed text-slate">{copy.next(phone.trim())}</p>
          {email.trim() && (
            <p className="mt-3 leading-relaxed text-slate">
              We have sent that reference to {email.trim()}, so you do not have to keep it in your
              head.
            </p>
          )}
          <a
            href={enquiryMessage(draft)}
            className="mt-6 inline-flex items-center gap-2 rounded-sm bg-[#1d8649] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#15703c]"
          >
            <WhatsAppIcon /> Send it on WhatsApp too
          </a>
        </div>
      </div>
    )
  }

  return (
    <form className="max-w-xl space-y-5" onSubmit={(event) => event.preventDefault()}>
      <label className="block">
        <span className="callout">Your name</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          className={`mt-2 ${FIELD}`}
        />
      </label>

      <label className="block">
        <span className="callout">Phone number</span>
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          autoComplete="tel"
          placeholder="07xx xxx xxx"
          className={`mt-2 ${FIELD}`}
        />
        <span className="mt-1.5 block text-xs text-slate">
          Needed to send this through the site, so we can call you back. Sending on WhatsApp
          instead carries your number with the message.
        </span>
      </label>

      <label className="block">
        <span className="callout">Email, if you use one</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          placeholder="Optional"
          className={`mt-2 ${FIELD}`}
        />
        <span className="mt-1.5 block text-xs text-slate">
          Leave it and we send your reference in writing. Leave it out and we will call instead.
        </span>
      </label>

      <label className="block">
        <span className="callout">{areaLabel}</span>
        <input
          type="text"
          value={area}
          onChange={(event) => setArea(event.target.value)}
          placeholder={areaPlaceholder}
          className={`mt-2 ${FIELD}`}
        />
      </label>

      {children}

      <label className="block">
        <span className="callout">{copy.notes}</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          placeholder={copy.notesPlaceholder}
          className={`mt-2 ${FIELD}`}
        />
      </label>

      {problem && (
        <p
          role="alert"
          className="border-l-2 border-oxblood bg-oxblood/5 px-4 py-3 text-sm text-oxblood"
        >
          {problem}
        </p>
      )}

      <div className="flex flex-wrap gap-3 pt-1">
        <button
          type="button"
          onClick={send}
          disabled={sending}
          className="inline-flex items-center gap-2 rounded-sm bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep disabled:cursor-not-allowed disabled:opacity-55"
        >
          {sending ? "Sending" : copy.submit}
        </button>
        <a
          href={enquiryMessage(draft)}
          className="inline-flex items-center gap-2 rounded-sm bg-[#1d8649] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#15703c]"
        >
          <WhatsAppIcon /> Send on WhatsApp
        </a>
      </div>
      <p className="callout">
        Either reaches the same people. WhatsApp opens a chat with your details written out.
      </p>
    </form>
  )
}

/** The field styling, so the fields a page adds match the ones it did not. */
export const ENQUIRY_FIELD = FIELD
