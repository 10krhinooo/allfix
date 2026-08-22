"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { SeededLogin } from "@/lib/admin/accounts"
import { markDesk } from "@/lib/admin/hint"

/**
 * The door.
 *
 * Drawn as a sheet rather than as a card: ruled lines to write on, mono
 * callouts for the labels, and a title block top and bottom. That is the same
 * language the rest of the shop is set in, the engineering drawing, and it is
 * the reason this screen does not look like every other login. A field with a
 * line under it is a field you fill in. A field in a rounded box is furniture.
 *
 * One door for everybody. Nothing here asks whether somebody is staff: the
 * answer comes back carrying a role and the redirect follows it, which is what
 * lets there be one screen rather than a counter one and a trade one that
 * slowly drift apart.
 *
 * The account list is a development affordance and is compiled out of a
 * production build. The list is passed in from the server component rather than
 * imported here, so the credential module never reaches the browser bundle even
 * in development.
 */

/** A ruled line to write on, which is what a field is on a drawing. */
function Field({
  label,
  note,
  children,
}: {
  label: string
  note?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className="callout">{label}</span>
        {note && <span className="font-mono text-[11px] text-mute">{note}</span>}
      </span>
      {children}
    </label>
  )
}

const RULE =
  "mt-1 w-full border-0 border-b border-rule bg-transparent px-0 py-2 text-sm text-ink " +
  "outline-none transition-colors placeholder:text-mute focus:border-ink disabled:opacity-55"

export function SignInForm({
  logins,
  next,
  secured,
}: {
  logins: SeededLogin[]
  next: string | null
  /**
   * Whether a password is configured at all. When none is, the field stays on
   * the sheet but stops being compulsory: asking for something that is not
   * checked trains people to type anything, which is worse than not asking.
   */
  secured: boolean
}) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showing, setShowing] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setProblem(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const body = (await response.json()) as { message?: string; to?: string }

      if (!response.ok) {
        setProblem(body.message ?? "That did not work. Try again.")
        setBusy(false)
        return
      }

      // The cookie is set, but no document is parsed on the way out of here, so
      // the pre-paint script never runs and the storefront header would keep
      // offering the door to somebody who has just walked through it.
      markDesk(true)

      router.replace(next ?? body.to ?? "/admin")
      // The client cache can be holding an RSC payload for the console fetched
      // before the cookie existed, which lands the browser back on the redirect.
      router.refresh()
    } catch {
      setProblem("The console could not be reached. Check your connection and try again.")
      setBusy(false)
    }
  }

  return (
    <>
      <form onSubmit={submit} className="mt-7 space-y-5">
        <Field label="Email">
          <input
            type="email"
            required
            autoFocus
            autoComplete="username"
            disabled={busy}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@allfix.co.ke"
            className={RULE}
          />
        </Field>

        <Field label="Password" note={secured ? undefined : "not set on this build"}>
          <span className="relative block">
            <input
              type={showing && !busy ? "text" : "password"}
              required={secured}
              autoComplete="current-password"
              disabled={busy}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={secured ? "" : "leave it blank"}
              className={`${RULE} pr-14`}
            />
            <button
              type="button"
              onClick={() => setShowing((was) => !was)}
              disabled={busy}
              className="absolute bottom-2 right-0 font-mono text-[11px] uppercase tracking-[0.14em] text-mute transition-colors hover:text-ink disabled:opacity-0"
            >
              {showing && !busy ? "Hide" : "Show"}
            </button>
          </span>
        </Field>

        {problem && (
          <p
            role="alert"
            className="border-l-2 border-oxblood bg-oxblood/5 px-3 py-2 text-sm leading-relaxed text-ink"
          >
            {problem}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep disabled:cursor-not-allowed disabled:opacity-55"
        >
          {busy ? "Signing in" : "Sign in"}
        </button>
      </form>

      {process.env.NODE_ENV !== "production" && logins.length > 0 && (
        <div className="mt-8 border-t border-rule pt-5">
          <h2 className="callout">Seeded accounts, development only</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate">
            {secured
              ? "Pick one to fill the address in, then use the password this build was given."
              : "Pick one and sign in. No password is set on this build, so the field can stay empty."}
          </p>
          <ul className="mt-3 border-t border-rule">
            {logins.map((login) => (
              <li key={login.email} className="border-b border-rule">
                {/* The address only. There is no seeded password to fill in,
                    which is the point: nothing here is a credential. */}
                <button
                  type="button"
                  onClick={() => {
                    setEmail(login.email)
                    setProblem(null)
                  }}
                  className="flex w-full items-baseline justify-between gap-3 py-2.5 text-left transition-colors hover:bg-brass-soft"
                >
                  <span className="min-w-0">
                    <span className="block font-mono text-[11px] text-mute">{login.email}</span>
                    <span className="mt-0.5 block text-xs text-slate">{login.note}</span>
                  </span>
                  <span className="callout shrink-0">{login.role}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
