"use client"

import { useState } from "react"
import { WhatsAppIcon } from "@/components/ui"
import { sendEnquiry } from "@/lib/enquiry"
import type { EnquiryDraft } from "@/lib/enquiry"

/**
 * The two ways a parts list leaves the configurator.
 *
 * WhatsApp first, because it is one tap and this list is already written out in
 * the message. Sending through the site asks for a name and a number, so it
 * stays folded away until somebody chooses it: a configurator that opens with
 * two empty contact fields under it reads as a signup form, and the point of
 * the screen is the parts list above.
 */
export function SendList({
  summary,
  detail,
  system,
  whatsappText,
}: {
  summary: string
  detail: string
  system: string | null
  whatsappText: string
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)

  const draft: EnquiryDraft = { kind: "parts", name, phone, email, area: "", summary, detail, system }

  async function send() {
    setProblem(null)
    setSending(true)
    const result = await sendEnquiry(draft)
    setSending(false)
    if (!result.ok) {
      setProblem(result.message)
      return
    }
    setReference(result.reference)
  }

  if (reference) {
    return (
      <div className="border border-rule bg-panel px-5 py-4">
        <p className="callout">Sent, reference {reference}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          The counter has your list. Somebody will call {phone.trim()} to confirm the price, the
          cut lengths and what is in stock.
          {email.trim() && ` We have sent the reference to ${email.trim()} as well.`}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <a
          href={whatsappText}
          className="inline-flex items-center gap-2 rounded-sm bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
        >
          <WhatsAppIcon /> Send this list on WhatsApp
        </a>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="inline-flex items-center gap-2 rounded-sm border border-ink px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          Send it through the site
        </button>
      </div>

      {open && (
        <div className="border border-rule bg-panel px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="callout">Your name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                className="mt-1.5 w-full border border-rule bg-paper px-3 py-2 text-sm text-ink focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="callout">Phone number</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                type="tel"
                autoComplete="tel"
                placeholder="07xx xxx xxx"
                className="mt-1.5 w-full border border-rule bg-paper px-3 py-2 text-sm text-ink focus:outline-none"
              />
            </label>
          </div>

          <label className="mt-3 block">
            <span className="callout">Email, if you use one</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              placeholder="Optional, and we send the reference to it"
              className="mt-1.5 w-full border border-rule bg-paper px-3 py-2 text-sm text-ink focus:outline-none"
            />
          </label>

          {problem && (
            <p role="alert" className="mt-3 text-sm text-oxblood">
              {problem}
            </p>
          )}

          <button
            type="button"
            onClick={send}
            disabled={sending}
            className="mt-4 rounded-sm bg-oxblood px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep disabled:cursor-not-allowed disabled:opacity-55"
          >
            {sending ? "Sending" : "Send the list"}
          </button>
          <p className="mt-2 text-xs leading-relaxed text-slate">
            We call you back to confirm the price and stock. Nothing is charged from this screen.
          </p>
        </div>
      )}
    </div>
  )
}
