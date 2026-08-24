"use client"

import { useState } from "react"
import Link from "next/link"
import { RULE, Field, Problem } from "@/components/auth/Sheet"
import { PasswordMeter } from "@/components/auth/PasswordMeter"
import { assess } from "@/lib/password"

/**
 * Opening an account.
 *
 * The password field is never disabled by the meter. The meter is advice, the
 * server decides, and a submit button that goes grey without saying why is the
 * thing people file bug reports about. It submits, and the refusal comes back
 * in the shop's own words.
 */
export function RegisterForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showing, setShowing] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setProblem(null)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName: name, phone }),
      })
      const body = (await response.json()) as { message?: string }
      if (!response.ok) {
        setProblem(body.message ?? "That did not work. Try again.")
        setBusy(false)
        return
      }
      setDone(true)
    } catch {
      setProblem("The shop could not be reached. Check your connection and try again.")
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="mt-7">
        <p className="text-sm leading-relaxed text-ink">
          Check your email. We have sent a link to <strong>{email}</strong> to confirm the address
          is yours. Follow it and you can sign in.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-slate">
          Nothing arrived after a few minutes? Look in spam, then call the shop and we will sort it
          out at the counter.
        </p>
      </div>
    )
  }

  const verdict = assess(password, email, name)

  return (
    <form onSubmit={submit} className="mt-7 space-y-5">
      <Field label="Your name">
        <input
          required
          autoFocus
          autoComplete="name"
          maxLength={120}
          disabled={busy}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={RULE}
        />
      </Field>

      <Field label="Email">
        <input
          type="email"
          required
          autoComplete="username"
          maxLength={320}
          disabled={busy}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className={RULE}
        />
      </Field>

      <Field label="Phone" note="optional">
        <input
          type="tel"
          autoComplete="tel"
          maxLength={32}
          disabled={busy}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="07xx xxx xxx"
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
            className="absolute top-8 right-0 font-mono text-[11px] uppercase tracking-[0.14em] text-mute transition-colors hover:text-ink disabled:opacity-0"
          >
            {showing && !busy ? "Hide" : "Show"}
          </button>
        }
      >
        <input
          type={showing && !busy ? "text" : "password"}
          required
          autoComplete="new-password"
          maxLength={200}
          disabled={busy}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={`${RULE} pr-14`}
          aria-describedby="password-meter"
        />
        <span id="password-meter" className="block">
          <PasswordMeter password={password} email={email} name={name} />
        </span>
      </Field>

      {problem && <Problem>{problem}</Problem>}

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep disabled:cursor-not-allowed disabled:opacity-55"
      >
        {busy ? "Opening your account" : "Open an account"}
      </button>

      {!verdict.acceptable && password.length > 0 && (
        <p className="text-xs leading-relaxed text-mute">
          You can still send this. The shop checks it again and will say if it is not strong enough.
        </p>
      )}

      <p className="text-sm text-slate">
        Already have one?{" "}
        <Link href="/sign-in" className="text-oxblood underline-offset-4 hover:underline">
          Sign in
        </Link>
        .
      </p>
    </form>
  )
}
