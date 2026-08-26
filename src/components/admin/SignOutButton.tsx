"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { markDesk } from "@/lib/admin/hint"
import { forget } from "@/lib/tier-client"

/**
 * Signing out, from wherever somebody happens to be.
 *
 * Shared rather than written twice, because the order matters and is easy to get
 * subtly wrong: clear the cookie, navigate, then refresh. Without the refresh the
 * App Router's client cache still holds payloads fetched while the session was
 * live, and the browser can navigate straight back into a screen it should no
 * longer have.
 */
export function SignOutButton({
  className,
  icon,
}: {
  className?: string
  /**
   * The rail is 240px wide and the name has to fit in it, so there the control
   * is a door rather than the words. Everywhere else there is room to say it.
   */
  icon?: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  return (
    <button
      type="button"
      disabled={busy}
      aria-label={icon ? "Sign out" : undefined}
      title={icon ? "Sign out" : undefined}
      onClick={async () => {
        setBusy(true)
        await fetch("/api/auth/logout", { method: "POST" })
        markDesk(false)
        // The same fact, told to the other listener: this document's cached
        // answer from `/api/session` is now about the wrong person.
        forget()
        router.replace("/sign-in")
        router.refresh()
      }}
      className={className}
    >
      {icon ? (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`h-[18px] w-[18px] ${busy ? "opacity-40" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
      ) : busy ? (
        "Signing out"
      ) : (
        "Sign out"
      )}
    </button>
  )
}
