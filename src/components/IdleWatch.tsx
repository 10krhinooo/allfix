"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { HINT, markDesk } from "@/lib/admin/hint"
import { forget } from "@/lib/tier-client"
import { reducedMotion } from "@/lib/motion"

/**
 * Signs an account out once it has done nothing for long enough, and says so
 * first.
 *
 * The server decides. `open()` in `src/lib/admin/session.ts` refuses a session
 * whose last use is outside the window, and it would do that whether or not this
 * component existed. What this adds is that the page notices: without it a
 * console left open all afternoon goes on looking signed in, with a rail full of
 * links and a worksheet full of prices, until somebody clicks and is bounced to
 * the door. That gap is the thing an inactivity timeout is usually bought to
 * close, so the timeout is not really finished until the screen agrees with the
 * server.
 *
 * It is also, in this codebase, the only thing that keeps a working session
 * alive. There is one `"use server"` file in the whole frontend and everything
 * the console edits goes to `localStorage` through `src/lib/admin/store.ts`, so
 * a member of staff pricing forty parts makes no server requests at all. Twenty
 * minutes of real work and nothing for the gate to see. The touch below is what
 * tells the server that work is happening.
 *
 * With scripting off there is no warning and the session simply lapses at the
 * window. That is the safe direction for a control and it is a decision rather
 * than an oversight.
 */

/**
 * How much notice the panel gives.
 *
 * A minute, unless the whole window is short enough that a minute would be most
 * of it. Capping at a quarter keeps the warning a warning rather than the
 * majority of the session, which matters for the short windows the end to end
 * suite runs on and for anybody who sets the floor.
 */
function leadFor(windowMs: number) {
  return Math.min(60_000, Math.round(windowMs / 4))
}

/**
 * How often the clock is compared against the deadline.
 *
 * Never longer than half the notice period, or the whole warning band can fall
 * between two ticks and somebody is signed out without ever being asked. That
 * cannot happen at the windows the settings screen allows, where the lead is a
 * full minute, but it happens immediately at the short windows the end to end
 * suite runs on, and a rule that only holds for the values we happen to test
 * with is not a rule.
 */
function tickFor(windowMs: number) {
  return Math.min(15_000, Math.max(1_000, Math.round(leadFor(windowMs) / 2)))
}

/**
 * How often activity is reported, at most.
 *
 * A tenth of the window, floored and capped. The tempting version is a fixed
 * fraction, and it is wrong in a way that is easy to miss: at a quarter of the
 * window, somebody who works until four minutes and fifty nine seconds past
 * their last report and then leaves is signed out fifteen minutes later rather
 * than twenty, because the server's idea of "last seen" is up to a whole
 * throttle interval behind the truth. The owner sets twenty and the shop
 * delivers somewhere between fifteen and twenty. A tenth keeps that error under
 * ten per cent, and the floor and cap keep it sane at both ends of the range.
 */
function touchEvery(windowMs: number) {
  return Math.min(Math.max(Math.round(windowMs / 10), 30_000), 120_000)
}

/**
 * Whether this document is holding a session, as cheaply as it can be asked.
 *
 * The hint cookie, which the pre-paint script in the root layout already reads,
 * rather than `useSession()`. Gating on the hook would put a `/api/session`
 * fetch on all 188 prerendered product pages for the benefit of visitors who are
 * not signed in and never will be during that visit. Forging the hint only
 * arms a timer against a session the forger does not have.
 */
function holdsSession() {
  if (typeof document === "undefined") return false
  if (document.documentElement.dataset.desk === "1") return true
  return document.cookie.split("; ").some((pair) => pair.startsWith(`${HINT}=1`))
}

export function IdleWatch() {
  const router = useRouter()
  const pathname = usePathname()
  /** The deadline the panel is counting down to, or null while there is no panel. */
  const [warning, setWarning] = useState<number | null>(null)

  /*
   * Refs rather than state for everything the heartbeat reads. These change on
   * every pointer move and every tick, and a re-render per mousemove would be a
   * worse performance bug than the one this component exists to fix. Only the
   * warning is state, because only the warning draws anything.
   */
  const deadline = useRef(0)
  const windowMs = useRef(0)
  const lastTouch = useRef(0)
  const dirty = useRef(false)
  const leaving = useRef(false)
  /** Set by the effect so the panel's button can reach the real touch. */
  const stayHere = useRef<() => void>(() => {})

  const leave = useCallback(async () => {
    if (leaving.current) return
    leaving.current = true

    // The order is the one `SignOutButton` establishes and it is load-bearing:
    // the cookie goes first, then the two client side caches that would
    // otherwise keep insisting somebody is signed in, then the navigation, and
    // the refresh last because the router is still holding RSC payloads fetched
    // while the session was live.
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
    markDesk(false)
    forget()

    const here = window.location.pathname + window.location.search
    router.replace(`/sign-in?idle=1&next=${encodeURIComponent(here)}`)
    router.refresh()
  }, [router])

  useEffect(() => {
    if (!holdsSession()) return

    let live = true
    const channel =
      typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("allfix-session")

    const schedule = (idleInMs: number, wholeWindowMs?: number) => {
      deadline.current = Date.now() + idleInMs
      if (wholeWindowMs) windowMs.current = wholeWindowMs
      if (idleInMs > leadFor(windowMs.current)) setWarning(null)
    }

    const touch = async () => {
      lastTouch.current = Date.now()
      dirty.current = false
      try {
        const response = await fetch("/api/session/touch", { method: "POST" })
        if (!live) return
        if (response.status === 401) {
          // Already lapsed, and the route has cleared the cookies. Nothing to
          // warn about: go, rather than counting down to a session that has
          // stopped existing.
          void leave()
          return
        }
        if (!response.ok) {
          // Something else, and 429 is the one that matters: being told to slow
          // down is not being told the session is over, and treating it as one
          // would sign somebody out for the sin of having several tabs open.
          // Leave the deadline where it is and try again on the next tick.
          return
        }
        const body = (await response.json()) as { idleInMs: number; idleWindowMs: number }
        schedule(body.idleInMs, body.idleWindowMs)
        // The other tabs are counting down to a deadline that has just moved.
        channel?.postMessage({
          kind: "alive",
          idleInMs: body.idleInMs,
          idleWindowMs: body.idleWindowMs,
        })
      } catch {
        // A blip. The deadline is deliberately not advanced, so the next tick
        // tries again and a genuinely dead connection still ends the session.
      }
    }

    const tick = () => {
      if (!live || leaving.current) return
      /*
       * Nothing is known yet, so nothing is claimed. Without this the first tick
       * after mount reads a deadline of zero as "long past" and signs the person
       * out before the answer to the very first question has come back, which is
       * a bug that only ever shows up on a slow connection.
       */
      if (deadline.current === 0) return
      const now = Date.now()
      const left = deadline.current - now

      if (left <= 0) {
        void leave()
        return
      }

      if (left <= leadFor(windowMs.current)) {
        // Somebody is still here and simply had not been reported yet. Touch at
        // once, ignoring the throttle, so a person who is typing never sees a
        // panel telling them they are about to be signed out.
        if (dirty.current) {
          void touch()
          return
        }
        setWarning(deadline.current)
        return
      }

      if (dirty.current && now - lastTouch.current >= touchEvery(windowMs.current)) {
        void touch()
      }
    }

    const stir = () => {
      dirty.current = true
    }

    const woken = () => {
      if (document.hidden) return
      // A backgrounded tab has its timers throttled and a sleeping laptop has
      // them stopped, so coming back is the moment to settle against the wall
      // clock rather than to trust the interval.
      tick()
    }

    for (const event of ["pointerdown", "keydown", "scroll"] as const) {
      document.addEventListener(event, stir, { passive: true })
    }
    document.addEventListener("visibilitychange", woken)

    if (channel) {
      channel.onmessage = (message: MessageEvent) => {
        const note = message.data as { kind: string; idleInMs?: number; idleWindowMs?: number }
        if (note.kind === "alive" && note.idleInMs) schedule(note.idleInMs, note.idleWindowMs)
        if (note.kind === "gone") void leave()
      }
    }

    // Find out where we actually stand before counting anything down. Until the
    // answer arrives the deadline is zero, and `tick` is not running yet.
    void (async () => {
      try {
        const response = await fetch("/api/session", { cache: "no-store" })
        const body = (await response.json()) as {
          signedIn: boolean
          idleInMs: number
          idleWindowMs: number
        }
        if (!live) return
        if (!body.signedIn) return
        schedule(body.idleInMs, body.idleWindowMs)
        // Not "just touched": the session may be nineteen minutes old already,
        // and claiming otherwise would suppress the first real touch.
        lastTouch.current = Date.now() - (body.idleWindowMs - body.idleInMs)
        /*
         * Mounting is itself activity. This component renders when a document
         * does, which means a person navigated or reloaded, and a prefetch does
         * not mount anything. Without this, somebody reading their way through
         * the catalogue for half an hour without clicking is idle by this
         * file's reckoning, which is plainly wrong.
         *
         * Unless the server already thinks the session is fresh, in which case
         * there is nothing to tell it and the request would be pure noise. This
         * is the common case by a distance: almost every page load in a visit
         * follows the one before it by seconds.
         */
        dirty.current = body.idleInMs < body.idleWindowMs * 0.9
      } catch {
        // Nothing known, so nothing claimed. The watcher stays asleep rather
        // than inventing a deadline and signing somebody out on a bad guess.
      }
    })()

    stayHere.current = () => {
      dirty.current = true
      void touch()
    }

    /*
     * Paced off the shortest window this document might be running under, since
     * the real one is not known until the first answer comes back. Re-pacing
     * afterwards would mean tearing the interval down and building it again on
     * every touch, for a difference of a few seconds a minute.
     */
    const heartbeat = setInterval(tick, tickFor(windowMs.current || 60_000))

    return () => {
      live = false
      clearInterval(heartbeat)
      for (const event of ["pointerdown", "keydown", "scroll"] as const) {
        document.removeEventListener(event, stir)
      }
      document.removeEventListener("visibilitychange", woken)
      channel?.close()
    }
    /*
     * Re-run on every navigation, and that is what makes this work at all.
     *
     * The first version armed once per document and never looked again, which
     * meant it never armed: signing in is a client navigation, so this component
     * had already mounted on `/sign-in`, seen no session, and gone to sleep for
     * the rest of the visit. The same shape of bug as the module-scope cache in
     * `tier-client.ts`, and worth naming twice because this codebase signs
     * people in without parsing a document.
     *
     * The re-run is also correct rather than merely convenient: arriving at a
     * page is a person doing something, so it re-reads the true remaining time
     * from the server and counts as activity. A prefetch does not mount
     * anything, so it does not get in here.
     */
  }, [leave, pathname])

  if (warning === null) return null
  return <IdlePanel deadline={warning} onStay={() => stayHere.current()} />
}

/**
 * The panel.
 *
 * `alertdialog` because it interrupts and expects an answer, with a name and a
 * description, because a dialog axe cannot name is a serious violation and a
 * dialog a screen reader cannot name is a worse one.
 *
 * The remaining seconds are deliberately **not** in a live region. A countdown
 * that announces itself reads "fifty nine, fifty eight, fifty seven" for a
 * minute and drowns out everything else on the page, which is why the digits are
 * `aria-live="off"` and the description says the useful part once.
 */
function IdlePanel({ deadline, onStay }: { deadline: number; onStay: () => void }) {
  const stay = useRef<HTMLButtonElement>(null)
  const [seconds, setSeconds] = useState(() => Math.max(0, Math.ceil((deadline - Date.now()) / 1000)))

  useEffect(() => {
    // Focus moves to the way out, not to the warning, so the answer is one key
    // away and focus returns to the page when the panel goes.
    stay.current?.focus()
  }, [])

  useEffect(() => {
    // Recomputed from the clock rather than decremented, so a throttled tab
    // that comes back does not show a number thirty seconds out of date.
    const timer = setInterval(() => {
      setSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)))
    }, 1000)
    return () => clearInterval(timer)
  }, [deadline])

  return (
    <div
      role="alertdialog"
      aria-labelledby="idle-title"
      aria-describedby="idle-body"
      className={`fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-sm border border-rule bg-paper p-5 shadow-lg sm:inset-x-auto sm:right-6 ${
        reducedMotion() ? "" : "transition-opacity"
      }`}
    >
      <h2 id="idle-title" className="text-sm font-medium text-ink">
        Still there?
      </h2>
      <p id="idle-body" className="mt-1.5 text-sm leading-relaxed text-slate">
        You have been idle for a while, so we are about to sign you out.
      </p>
      <p className="mt-1 text-sm text-slate" aria-live="off">
        <span className="font-mono text-ink">{seconds}</span> seconds left.
      </p>
      <button
        ref={stay}
        type="button"
        onClick={onStay}
        className="mt-4 rounded-sm bg-oxblood px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
      >
        Stay signed in
      </button>
    </div>
  )
}
