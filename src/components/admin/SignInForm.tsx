"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { SeededLogin } from "@/lib/admin/accounts"
import { markDesk } from "@/lib/admin/hint"
import { AuthCard, AuthField, AuthFooter, AuthSubmit, Notice, PasswordField } from "@/components/admin/AuthUI"
import { SHOP } from "@/lib/format"

/**
 * The sign in form.
 *
 * One door for everybody. Nothing here asks whether somebody is staff: the
 * answer comes back with a role and the redirect follows it, which is what lets
 * there be one screen rather than a counter one and a trade one that slowly
 * drift apart.
 *
 * The account list below it is a development affordance and is compiled out of
 * a production build. Seeded accounts are how this is worked on and shown; a
 * deployed shop hands them out through the People screen instead, and a sign in
 * page that lists them would be a hole.
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
    <AuthCard
      title="Sign in"
      intro="The counter console, and trade accounts. Everything a customer never sees."
    >
      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <AuthField
          label="Email"
          type="email"
          required
          autoFocus
          autoComplete="username"
          disabled={busy}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@allfix.co.ke"
        />

        <PasswordField
          label="Password"
          required
          autoComplete="current-password"
          disabled={busy}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {problem && <Notice>{problem}</Notice>}

        <AuthSubmit busy={busy} busyLabel="Signing in">
          Sign in
        </AuthSubmit>
      </form>

      {process.env.NODE_ENV !== "production" && logins.length > 0 && (
        <div data-field className="mt-8 border-t border-rule pt-6">
          <h2 className="callout">Seeded accounts, development only</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate">
            Pick one to fill the address in. There is no shared password: any password opens a
            seeded account unless <code className="font-mono">ALLFIX_SEED_PASSWORD</code> is set.
          </p>
          <ul className="mt-3">
            {logins.map((login) => (
              <li key={login.email} className="border-b border-rule last:border-b-0">
                {/* The address only. There is no seeded password to fill in,
                    which is the point: nothing here is a credential. */}
                <button
                  type="button"
                  onClick={() => {
                    setEmail(login.email)
                    setProblem(null)
                  }}
                  className="flex w-full items-baseline justify-between gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-brass-soft"
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

      <AuthFooter>
        Accounts are granted at the counter, never claimed here. If you should have one and do
        not, call the shop on{" "}
        <a href={`tel:${SHOP.phoneIntl}`} className="font-mono text-ink hover:underline">
          {SHOP.phone}
        </a>
        .
      </AuthFooter>
    </AuthCard>
  )
}
