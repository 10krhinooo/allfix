"use client"

import { assess, MIN_LENGTH, type Strength } from "@/lib/password"

/**
 * How strong the password is, said out loud as it is typed.
 *
 * A courtesy and not a control: the server applies the same rules again on
 * arrival and that is the one that decides. So this never blocks anything. It
 * lists every fault at once rather than one at a time, because a meter that
 * reveals the next objection only after the last one is fixed is a guessing
 * game, and people respond to it by giving up and using something worse.
 */

const TONE: Record<Strength, { bars: number; label: string; className: string }> = {
  empty: { bars: 0, label: "", className: "" },
  weak: { bars: 1, label: "Too easy to guess", className: "bg-oxblood" },
  fair: { bars: 2, label: "Good enough", className: "bg-brass" },
  strong: { bars: 3, label: "Strong", className: "bg-green-700" },
}

export function PasswordMeter({
  password,
  email = "",
  name = "",
}: {
  password: string
  email?: string
  name?: string
}) {
  const verdict = assess(password, email, name)
  const tone = TONE[verdict.strength]

  if (verdict.strength === "empty") {
    return (
      <p className="mt-2 text-xs leading-relaxed text-mute">
        At least {MIN_LENGTH} characters. A short phrase you will remember beats a short word with
        a symbol on the end.
      </p>
    )
  }

  return (
    <div className="mt-2">
      <div className="flex items-center gap-3">
        <ol className="flex flex-1 gap-1" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <li
              key={index}
              className={`h-1 flex-1 ${index < tone.bars ? tone.className : "bg-rule"}`}
            />
          ))}
        </ol>
        <span className="font-mono text-[11px] text-slate">{tone.label}</span>
      </div>

      {/* Announced politely: this updates on every keystroke, and an assertive
          region would interrupt a screen reader mid-word on every one of them. */}
      <ul aria-live="polite" className="mt-2 space-y-1">
        {verdict.problems.map((problem) => (
          <li key={problem} className="text-xs leading-relaxed text-slate">
            {problem}
          </li>
        ))}
      </ul>
    </div>
  )
}
