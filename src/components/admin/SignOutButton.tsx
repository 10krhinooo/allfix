"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

/**
 * Signing out, from wherever somebody happens to be.
 *
 * Shared rather than written twice, because the order matters and is easy to get
 * subtly wrong: clear the cookie, navigate, then refresh. Without the refresh the
 * App Router's client cache still holds payloads fetched while the session was
 * live, and the browser can navigate straight back into a screen it should no
 * longer have.
 */
export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        await fetch("/api/auth/logout", { method: "POST" })
        router.replace("/sign-in")
        router.refresh()
      }}
      className={className}
    >
      {busy ? "Signing out" : "Sign out"}
    </button>
  )
}
