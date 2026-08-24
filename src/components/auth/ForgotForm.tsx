"use client"

import { useState } from "react"
import Link from "next/link"
import { RULE, Field, Problem } from "@/components/auth/Sheet"

/**
 * Asking for a reset link.
 *
 * The confirmation is shown for any address at all, registered or not. That is
 * the point rather than an oversight: a form that says "no account here" is a
 * form that will be used to find out who shops here.
 */
export function ForgotForm() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setProblem(null)

    try {
      const response = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const body = (await response.json()) as { message?: string }
      if (!response.ok) {
        setProblem(body.message ?? "That did not work. Try again.")
        setBusy(false)
        return
      }
      setSent(body.message ?? "If that address has an account, a reset link is on its way.")
    } catch {
      setProblem("The shop could not be reached. Check your connection and try again.")
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div className="mt-7">
        <p className="text-sm leading-relaxed text-ink">{sent}</p>
        <p className="mt-4 text-sm leading-relaxed text-slate">
          The link is good for a short while. If it has expired by the time you open it, ask for
          another.
        </p>
        <Link
          href="/sign-in"
          className="mt-6 inline-block border border-rule px-6 py-2.5 text-sm text-ink transition-colors hover:border-brass hover:text-brass"
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-5">
      <Field label="Email">
        <input
          type="email"
          required
          autoFocus
          autoComplete="username"
          maxLength={320}
          disabled={busy}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className={RULE}
        />
      </Field>

      {problem && <Problem>{problem}</Problem>}

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep disabled:cursor-not-allowed disabled:opacity-55"
      >
        {busy ? "Sending" : "Send me a reset link"}
      </button>

      <p className="text-sm text-slate">
        Remembered it?{" "}
        <Link href="/sign-in" className="text-oxblood underline-offset-4 hover:underline">
          Sign in
        </Link>
        .
      </p>
    </form>
  )
}
