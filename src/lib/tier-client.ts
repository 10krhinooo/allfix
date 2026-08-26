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
  /** The account's address, and the one a reference is sent to. */
  email?: string
  /** Off the default address, so a form has a number to ring back on. */
  phone?: string
  role?: string
  tier: Tier
  rate: number
  /** How long before inactivity ends this session, in ms. Zero when signed out. */
  idleInMs: number
  /** The whole inactivity window, in ms. Zero when signed out. */
  idleWindowMs: number
}

const SIGNED_OUT: Session = { signedIn: false, tier: "retail", rate: 0, idleInMs: 0, idleWindowMs: 0 }

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

/**
 * Forget what this document was told, so the next asker goes and finds out.
 *
 * The cache above is per document and was never invalidated, which was fine
 * only for as long as signing in and out meant loading one. It does not: both
 * finish with `router.replace`, so no document is parsed, and this module goes
 * on answering with whatever it learned on the page somebody arrived at. Signing
 * in therefore left `known` saying signed out for the rest of the visit, which
 * showed a trade account retail prices until they happened to reload, and would
 * have stopped the inactivity watcher ever arming at all.
 *
 * The sibling of `forget()` in `src/lib/rate-limit.ts`, and unlike that one it
 * is not only for tests. Call it wherever `markDesk()` is called; the two are
 * the same fact told to two different listeners.
 */
export function forget() {
  known = null
  pending = null
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
