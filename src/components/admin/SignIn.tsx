"use client"

import { useState } from "react"
import { PEOPLE } from "@/lib/admin/desk"
import { signIn } from "@/lib/admin/store"

/**
 * The door, as a prototype.
 *
 * This is not authentication and must not be mistaken for it. Real accounts,
 * BCrypt passwords, opaque revocable sessions and role checks are built and
 * tested in the backend repository; they are not deployed yet, so there is
 * nothing here for a password to be checked against.
 *
 * Rather than draw a password box that accepts anything, which would look like
 * security and be worse than none, this asks the only question it can actually
 * answer: who is at the counter. The screen says so out loud, because a
 * demonstration that quietly implies a login exists is how a prototype ends up
 * in front of customers.
 *
 * The list is staff only. Trade and retail accounts exist in the same table and
 * are deliberately absent here: a role is what decides who is let in, and
 * showing that difference is half the point of the screen.
 */
export function SignIn() {
  const staff = PEOPLE.filter((person) => person.active && (person.role === "STAFF" || person.role === "ADMIN"))
  const [chosen, setChosen] = useState(staff[0]?.name ?? "")

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="stage flex flex-col justify-between p-8 sm:p-12">
        <span className="font-display text-lg font-bold tracking-tight">AllFix By Kipekee</span>
        <div>
          <p className="callout">Counter console</p>
          <p className="display-lg mt-3 max-w-[14ch] font-display font-bold tracking-tight">
            The back of the shop.
          </p>
          <p className="mt-4 max-w-sm leading-relaxed text-stage-mute">
            Prices, the parts still waiting on a photograph, and whoever has called in
            today. Everything a customer never sees.
          </p>
        </div>
        <p className="font-mono text-xs text-stage-mute">Njugu Lane, Nairobi CBD</p>
      </div>

      <div className="flex items-center justify-center bg-paper p-8 sm:p-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-bold tracking-tight">Who is at the counter?</h1>

          <div className="mt-3 border-l-2 border-brass bg-brass-soft px-4 py-3 text-sm leading-relaxed text-ink">
            <span className="font-medium">This is a prototype.</span> There is no password yet,
            because there is no server to check one against. Pick a name and the console will
            attribute your edits to it.
          </div>

          <ul className="mt-8 border-t border-rule">
            {staff.map((person) => {
              const active = chosen === person.name
              return (
                <li key={person.email} className="border-b border-rule">
                  <label className="flex cursor-pointer items-center gap-3 py-3.5">
                    <input
                      type="radio"
                      name="who"
                      className="sr-only"
                      checked={active}
                      onChange={() => setChosen(person.name)}
                    />
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        active ? "border-oxblood bg-oxblood" : "border-rule"
                      }`}
                    >
                      {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="flex-1">
                      <span className={`block text-sm ${active ? "text-ink" : "text-slate"}`}>
                        {person.name}
                      </span>
                      <span className="mt-0.5 block font-mono text-[11px] text-mute">
                        {person.post}
                      </span>
                    </span>
                    <span className="callout">{person.role}</span>
                  </label>
                </li>
              )
            })}
          </ul>

          <button
            onClick={() => chosen && signIn(chosen)}
            className="mt-8 w-full bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
          >
            Open the console
          </button>
        </div>
      </div>
    </div>
  )
}
