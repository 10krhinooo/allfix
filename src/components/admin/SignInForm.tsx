"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { markDesk } from "@/lib/admin/hint"
import { RULE, Field } from "@/components/auth/Sheet"

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
 * lets there be one screen rather than a counter one, a trade one and a shopper
 * one that slowly drift apart.
 *
 * The sheet used to print the seeded addresses underneath in development, back
 * when there was no password to go with them and the only way in was to know one
 * already. There is a password now, so the list was a set of half credentials on
 * screen for no reason. The addresses live in `.env.local` next to the password
 * they open, which is the one place somebody looking for them should have to go.
 */

export function SignInForm({
  next,
  secured,
}: {
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

      // The fallback is the least privileged desk, not the console: this is
      // one door for four roles now, and guessing high would bounce.
      router.replace(next ?? body.to ?? "/account")
      // The client cache can be holding an RSC payload for the console fetched
      // before the cookie existed, which lands the browser back on the redirect.
      router.refresh()
    } catch {
      setProblem("The shop could not be reached. Check your connection and try again.")
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

        <Field
          label="Password"
          trailing={
            <button
              type="button"
              onClick={() => setShowing((was) => !was)}
              disabled={busy}
              className="absolute bottom-2 right-0 font-mono text-[11px] uppercase tracking-[0.14em] text-mute transition-colors hover:text-ink disabled:opacity-0"
            >
              {showing && !busy ? "Hide" : "Show"}
            </button>
          }
          // Gated the way the seeded list below is. A note about how this
          // deployment is configured is a development affordance, and a
          // launched storefront should not be explaining its own setup to a
          // customer. `secured` still decides whether the field is required.
          note={!secured && process.env.NODE_ENV !== "production" ? "not checked on this build" : undefined}
        >
          <input
              type={showing && !busy ? "text" : "password"}
              required={secured}
              autoComplete="current-password"
              disabled={busy}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder=""
              className={`${RULE} pr-14`}
            />
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

    </>
  )
}
