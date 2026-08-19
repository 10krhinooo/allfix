"use client"

import { useState } from "react"
import { WhatsAppIcon } from "@/components/ui"
import { whatsapp } from "@/lib/format"

/**
 * The booking form, which composes a WhatsApp message rather than posting
 * anywhere. There is no booking backend yet, and a form that pretended to save a
 * date would be worse than one that hands the shop a filled-in enquiry it can
 * confirm. Nothing here is required: a name and an area is enough to start, and
 * the rest sharpens the quote. When the backend lands this becomes a real
 * submit and the fields stay the same.
 */
const VISITS = [
  "Measure-up",
  "Site survey for motorised",
  "Installation",
  "Consultation",
  "Curtain fitting",
]

const TIMES = ["Morning", "Afternoon", "Either"]

export function BookForm() {
  const [name, setName] = useState("")
  const [area, setArea] = useState("")
  const [visit, setVisit] = useState(VISITS[0])
  const [date, setDate] = useState("")
  const [time, setTime] = useState(TIMES[0])
  const [notes, setNotes] = useState("")

  const message = [
    `Hello AllFix, I would like to book a ${visit.toLowerCase()}.`,
    name && `Name: ${name}.`,
    area && `Area: ${area}.`,
    date && `Preferred date: ${date} (${time.toLowerCase()}).`,
    !date && `Preferred time: ${time.toLowerCase()}.`,
    notes && `Notes: ${notes}`,
  ]
    .filter(Boolean)
    .join(" ")

  const field = "w-full border border-rule bg-paper px-3 py-2.5 text-ink focus:outline-none"
  const labelClass = "block"

  return (
    <form className="max-w-xl space-y-5" onSubmit={(event) => event.preventDefault()}>
      <label className={labelClass}>
        <span className="callout">Your name</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          placeholder="Optional"
          className={`mt-2 ${field}`}
        />
      </label>

      <label className={labelClass}>
        <span className="callout">Area or town</span>
        <input
          type="text"
          value={area}
          onChange={(event) => setArea(event.target.value)}
          placeholder="Where we would be visiting"
          className={`mt-2 ${field}`}
        />
      </label>

      <label className={labelClass}>
        <span className="callout">What for</span>
        <select value={visit} onChange={(event) => setVisit(event.target.value)} className={`mt-2 ${field}`}>
          {VISITS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>
          <span className="callout">Preferred date</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={`mt-2 ${field}`}
          />
        </label>
        <label className={labelClass}>
          <span className="callout">Time of day</span>
          <select value={time} onChange={(event) => setTime(event.target.value)} className={`mt-2 ${field}`}>
            {TIMES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={labelClass}>
        <span className="callout">Anything else</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          placeholder="The window, the fabric, how many rooms"
          className={`mt-2 ${field}`}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <a
          href={whatsapp(message)}
          className="inline-flex items-center gap-2 rounded-sm bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
        >
          <WhatsAppIcon /> Send booking request
        </a>
        <p className="callout">Opens WhatsApp with your details filled in</p>
      </div>
    </form>
  )
}
