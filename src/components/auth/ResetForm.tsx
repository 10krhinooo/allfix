"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { RULE, Field, Problem } from "@/components/auth/Sheet"
import { PasswordMeter } from "@/components/auth/PasswordMeter"

/**
 * Setting a new password from an emailed link.
 *
 * The token comes off the query string and is never shown. Resetting signs out
 * every other session on the account, which is what a reset is for: somebody
 * who has lost control of a password has to be able to take it back.
 */
export function ResetForm({ token }: { token: string }) {
  const router = useRouter()
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
      const response = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const body = (await response.json()) as { message?: string }
      if (!response.ok) {
        setProblem(body.message ?? "That did not work. Try again.")
        setBusy(false)
        return
      }
      router.replace("/sign-in?reset=1")
    } catch {
      setProblem("The shop could not be reached. Check your connection and try again.")
      setBusy(false)
    }
  }

  if (!token) {
    return (
      <div className="mt-7">
        <p className="text-sm leading-relaxed text-ink">
          That reset link is incomplete. Open it straight from the email rather than copying part
          of it, or ask for another.
        </p>
        <Link
          href="/auth/forgot"
          className="mt-6 inline-block border border-rule px-6 py-2.5 text-sm text-ink transition-colors hover:border-brass hover:text-brass"
        >
          Ask for a new link
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-5">
      <Field
        label="New password"
        trailing={
          <button
            type="button"
            onClick={() => setShowing((was) => !was)}
            disabled={busy}
            className="absolute top-8 right-0 font-mono text-[11px] uppercase tracking-[0.14em] text-mute transition-colors hover:text-ink disabled:opacity-0"
          >
            {showing && !busy ? "Hide" : "Show"}
          </button>
        }
      >
        <input
          type={showing && !busy ? "text" : "password"}
          required
          autoFocus
          autoComplete="new-password"
          maxLength={200}
          disabled={busy}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={`${RULE} pr-14`}
          aria-describedby="password-meter"
        />
      </Field>

      {/* Outside the field for the same reason the register sheet's is. */}
      <div id="password-meter">
        <PasswordMeter password={password} />
      </div>

      {problem && <Problem>{problem}</Problem>}

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep disabled:cursor-not-allowed disabled:opacity-55"
      >
        {busy ? "Setting it" : "Set my new password"}
      </button>

      <p className="text-xs leading-relaxed text-mute">
        Setting a new password signs you out everywhere else, which is the point of resetting one.
      </p>
    </form>
  )
}
