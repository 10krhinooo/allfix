"use client"

import { useState } from "react"
import { EnquiryForm, ENQUIRY_FIELD } from "@/components/enquiry/EnquiryForm"

/**
 * Booking a visit.
 *
 * The shared enquiry form does the contact details, both send paths and the
 * confirmation, because a booking is an enquiry the counter has to put a date
 * against. What is particular to a booking is here: what the visit is for, and
 * when the customer would like it.
 *
 * The date is a preference and the copy says so. The site cannot honour a slot
 * nobody at the counter has looked at, so what it confirms is that the request
 * arrived and that somebody will call to agree a time. A booking screen that
 * says "confirmed" and then rings to move it is worse than one that never
 * claimed it.
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
  const [visit, setVisit] = useState(VISITS[0])
  const [date, setDate] = useState("")
  const [time, setTime] = useState(TIMES[0])

  return (
    <EnquiryForm
      kind="survey"
      summary={`I would like to book a ${visit.toLowerCase()}.`}
      detail={
        date
          ? `Preferred date: ${date} (${time.toLowerCase()}).`
          : `Preferred time: ${time.toLowerCase()}.`
      }
      areaPlaceholder="Where we would be visiting"
      copy={{
        badge: "Booked",
        sent: "We have your request.",
        next: (phone) =>
          `Nothing is in the diary yet. Somebody from the shop will call ${phone} to agree a time we can keep, and your reference is how whoever picks up finds this.`,
        submit: "Book through the site",
        notes: "Anything else",
        notesPlaceholder: "The window, the fabric, how many rooms",
      }}
    >
      <label className="block">
        <span className="callout">What for</span>
        <select
          value={visit}
          onChange={(event) => setVisit(event.target.value)}
          className={`mt-2 ${ENQUIRY_FIELD}`}
        >
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
            className={`mt-2 ${ENQUIRY_FIELD}`}
          />
        </label>
        <label className="block">
          <span className="callout">Time of day</span>
          <select
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className={`mt-2 ${ENQUIRY_FIELD}`}
          >
            {TIMES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
    </EnquiryForm>
  )
}
