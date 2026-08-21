"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { DemoLogin } from "@/lib/admin/accounts"

/**
 * Email, password, and the demo credentials printed underneath.
 *
 * The honesty note is the part worth keeping from the old name picker. What has
 * changed is that there is now a password and a role check behind it, so the
 * note says what is real (the refusals, the roles, the HttpOnly cookie) and what
 * is not (a revocable session, which needs the backend's token table), rather
 * than apologising for having no password at all.
 *
 * The demo list is passed in from the server component so the credential module
 * never enters the browser bundle. That is a seam with no value today, since the
 * passwords are printed on this very screen, and all the value later.
 */
export function SignInForm({ logins, next }: { logins: DemoLogin[]; next: string | null }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
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
    <div className="w-full max-w-sm">
      <h1 className="font-display text-2xl font-bold tracking-tight">Sign in</h1>

      <form onSubmit={submit} className="mt-6">
        <label className="block">
          <span className="callout">Email</span>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1.5 w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </label>

        <label className="mt-4 block">
          <span className="callout">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1.5 w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </label>

        {problem && (
          <p role="alert" className="mt-4 border-l-2 border-oxblood bg-oxblood/5 px-3 py-2 text-sm leading-relaxed text-ink">
            {problem}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-sm bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep disabled:cursor-not-allowed disabled:opacity-55"
        >
          {busy ? "Signing in" : "Sign in"}
        </button>
      </form>

      <div className="mt-8 border-l-2 border-brass bg-brass-soft px-4 py-3 text-sm leading-relaxed text-ink">
        <span className="font-medium">This is a prototype.</span> The roles and the refusals
        below are real, and the session is an HttpOnly cookie. What is missing is the part
        that needs a database: a session here cannot be revoked before it expires.
      </div>

      <h2 className="callout mt-8">Demo accounts, password {"allfix"}</h2>
      <ul className="mt-3 border-t border-rule">
        {logins.map((login) => (
          <li key={login.email} className="border-b border-rule">
            <button
              type="button"
              onClick={() => {
                setEmail(login.email)
                setPassword("allfix")
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
  )
}
