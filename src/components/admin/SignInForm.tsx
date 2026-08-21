"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { SeededLogin } from "@/lib/admin/accounts"

/**
 * The sign in form.
 *
 * The account list below it is a development affordance and is compiled out of a
 * production build, the same way `Curtain` gates its reveal. Seeded accounts are
 * how this is worked on and shown; a deployed shop hands them out through the
 * People screen instead, and a sign in page that lists them would be a hole.
 *
 * The list is passed in from the server component rather than imported here, so
 * the credential module never reaches the browser bundle even in development.
 */
export function SignInForm({ logins, next }: { logins: SeededLogin[]; next: string | null }) {
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

      {process.env.NODE_ENV !== "production" && logins.length > 0 && (
        <>
          <h2 className="callout mt-10">Seeded accounts, development only</h2>
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
        </>
      )}
    </div>
  )
}
