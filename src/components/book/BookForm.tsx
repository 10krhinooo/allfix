"use client"

import { useState } from "react"
import { WhatsAppIcon } from "@/components/ui"
import { sendEnquiry, enquiryMessage } from "@/lib/enquiry"
import type { EnquiryDraft } from "@/lib/enquiry"

/**
 * Booking a visit, either way the customer prefers.
 *
 * WhatsApp is how this shop already works and stays on the form. But an enquiry
 * that only exists in a chat thread exists on one phone: whoever is at the
 * counter cannot pick it up, and nothing counts it. So the same fields also
 * send through the site, and that one lands in the queue with a reference the
 * customer can quote on the phone.
 *
 * Neither path is the fallback. WhatsApp gets a real button, not a link in
 * small print, because for a lot of customers it genuinely is the better one.
 */
const VISITS = [
  "Measure-up",
  "Site survey for motorised",
  "Installation",
  "Consultation",
  "Curtain fitting",
]

const TIMES = ["Morning", "Afternoon", "Either"]

const FIELD = "w-full border border-rule bg-paper px-3 py-2.5 text-ink focus:outline-none"

export function BookForm() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [area, setArea] = useState("")
  const [visit, setVisit] = useState(VISITS[0])
  const [date, setDate] = useState("")
  const [time, setTime] = useState(TIMES[0])
  const [notes, setNotes] = useState("")

  const [sending, setSending] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)

  const draft: EnquiryDraft = {
    kind: "survey",
    name,
    phone,
    area,
    summary: `I would like to book a ${visit.toLowerCase()}.`,
    detail: [
      date ? `Preferred date: ${date} (${time.toLowerCase()}).` : `Preferred time: ${time.toLowerCase()}.`,
      notes.trim(),
    ]
      .filter(Boolean)
      .join(" "),
    system: null,
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
          <p className="callout">Booked</p>
          <p className="mt-2 font-display text-2xl font-bold tracking-tight">
            We have your request.
          </p>
        </div>
        <div className="px-6 py-6">
          <p className="callout">Your reference</p>
          <p className="mt-1 font-mono text-3xl text-ink">{reference}</p>
          <p className="mt-4 leading-relaxed text-slate">
            Somebody from the shop will call {phone.trim()} to confirm the time. Quote that
            reference and whoever picks up can find it.
          </p>
          <a
            href={enquiryMessage(draft)}
            className="mt-6 inline-flex items-center gap-2 rounded-sm bg-[#1f8f4e] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#187a41]"
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
          Needed to book through the site, so we can call you back. Sending on WhatsApp instead
          carries your number with the message.
        </span>
      </label>

      <label className="block">
        <span className="callout">Area or town</span>
        <input
          type="text"
          value={area}
          onChange={(event) => setArea(event.target.value)}
          placeholder="Where we would be visiting"
          className={`mt-2 ${FIELD}`}
        />
      </label>

      <label className="block">
        <span className="callout">What for</span>
        <select value={visit} onChange={(event) => setVisit(event.target.value)} className={`mt-2 ${FIELD}`}>
          {VISITS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="callout">Preferred date</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={`mt-2 ${FIELD}`}
          />
        </label>
        <label className="block">
          <span className="callout">Time of day</span>
          <select value={time} onChange={(event) => setTime(event.target.value)} className={`mt-2 ${FIELD}`}>
            {TIMES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="callout">Anything else</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          placeholder="The window, the fabric, how many rooms"
          className={`mt-2 ${FIELD}`}
        />
      </label>

      {problem && (
        <p role="alert" className="border-l-2 border-oxblood bg-oxblood/5 px-4 py-3 text-sm text-oxblood">
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
          {sending ? "Sending" : "Book through the site"}
        </button>
        <a
          href={enquiryMessage(draft)}
          className="inline-flex items-center gap-2 rounded-sm bg-[#1f8f4e] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#187a41]"
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
