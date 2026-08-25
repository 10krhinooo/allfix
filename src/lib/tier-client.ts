"use client"

import { useEffect, useState } from "react"
import type { Tier } from "@/lib/tiers"

/**
 * The visitor's own tier, in a component that was prerendered.
 *
 * One fetch per page load however many components ask, because the promise is
 * cached at module scope rather than the answer: two cards mounting in the same
 * tick would otherwise make two requests and neither would know about the
 * other.
 *
 * It starts at retail and stays there until the answer arrives, which is the
 * safe way round. Starting at trade would show every visitor a discount for a
 * frame and take it away again, and the majority of visitors are retail. A
 * trade account sees list for the moment the request takes and then sees their
 * own rate, which is the same order the counter says it in.
 */

export interface Session {
  signedIn: boolean
  name?: string
  role?: string
  tier: Tier
  rate: number
}

const SIGNED_OUT: Session = { signedIn: false, tier: "retail", rate: 0 }

let pending: Promise<Session> | null = null
let known: Session | null = null

function load(): Promise<Session> {
  if (known) return Promise.resolve(known)
  pending ??= fetch("/api/session", { cache: "no-store" })
    .then((response) => (response.ok ? (response.json() as Promise<Session>) : SIGNED_OUT))
    .catch(() => SIGNED_OUT)
    .then((session) => {
      known = session
      return session
    })
  return pending
}

export function useSession(): { session: Session; ready: boolean } {
  const [session, setSession] = useState<Session>(known ?? SIGNED_OUT)
  const [ready, setReady] = useState(known !== null)

  useEffect(() => {
    let live = true
    load().then((answer) => {
      if (!live) return
      setSession(answer)
      setReady(true)
    })
    return () => {
      live = false
    }
  }, [])

  return { session, ready }
}

/** The common case: what tier to price at, and whether the answer is in yet. */
export function useTier(): { tier: Tier; ready: boolean } {
  const { session, ready } = useSession()
  return { tier: session.tier, ready }
}
