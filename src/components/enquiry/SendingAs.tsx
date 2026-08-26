"use client"

import type { Contact } from "@/lib/contact-client"

/**
 * What the shop already knows, in place of asking for it again.
 *
 * Shown instead of the name, number and email fields when somebody is signed in
 * and the account carries a number to ring back on. It is not a confirmation
 * step: there is nothing to agree to, only the details the enquiry will carry,
 * so somebody can see them and correct them if this one is going somewhere else.
 *
 * The way out is a button and not an edit in place, because the common case is
 * that these are right and the screen should be quiet about them. Pressing it
 * gives back the same three fields, filled in, so changing a number is one
 * correction rather than three.
 */
export function SendingAs({ contact, onChange }: { contact: Contact; onChange: () => void }) {
  return (
    <div className="border-l-2 border-brass bg-panel px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="callout">Sending as</p>
        <button
          type="button"
          onClick={onChange}
          className="text-xs font-medium text-oxblood underline underline-offset-2 hover:no-underline"
        >
          Use different details
        </button>
      </div>
      <p className="mt-1.5 text-sm text-ink">{contact.name}</p>
      <p className="text-sm text-slate">
        {contact.phone}
        {contact.email && ` · ${contact.email}`}
      </p>
    </div>
  )
}
