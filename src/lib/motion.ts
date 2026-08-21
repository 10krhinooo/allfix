/**
 * What the two curtains agree on.
 *
 * There are two of them and they must never play at the same time: the hero's
 * motorised reveal on the home page, and the page curtain that wipes between
 * shop routes. Both need the same answers about whether motion is wanted at all
 * and whether the hero is going to run, so the answers live here rather than
 * being written twice and drifting.
 *
 * Browser only. Every function here touches `window`, so call them from an
 * effect, never during render.
 */

/** The hero has played once in this tab. Written when its timeline completes. */
export const SEEN = "allfix-curtain-seen"

/** The shared easing. Slow out of the stack, slow into it, quick across. */
export const SWEEP = "inOut(2.2)"

export function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * Whether the home page's own reveal is going to run.
 *
 * The page curtain asks before wiping into `/`, because two curtains over each
 * other is worse than either alone. In development this is always true, so the
 * hero can be looked at while it is being worked on; in production it is true
 * on a first visit and on a deliberate reload, and false once the hero has
 * played, which is when the page curtain takes over the arrival instead.
 *
 * A reload counts as a fresh visit. `sessionStorage` outlives a reload, so
 * without the navigation type the hero would never open twice in a tab, and
 * somebody who presses reload is asking to see the page again.
 */
export function heroReveals(): boolean {
  const entry = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined
  const reloaded = entry?.type === "reload"
  const seen =
    process.env.NODE_ENV === "production" &&
    !reloaded &&
    sessionStorage.getItem(SEEN) === "1"
  return !seen
}
