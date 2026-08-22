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

/**
 * The same rule as `heroReveals()`, written for the document head.
 *
 * `Curtain` is server rendered closed so the cloth is in place at the first
 * paint. That means the decision *not* to open it has to be made before that
 * paint as well: an effect runs after the browser has already drawn a full
 * screen of red, and hiding it then is the flash this exists to prevent.
 *
 * So the rule is written twice, once as a function for React and once as a
 * string for the head. They have to agree, so change them together. This is the
 * only thing that sets `data-hero`, and the rule in `globals.css` keeps the
 * hero's curtain out of the page until it does.
 */
export function heroGateScript(): string {
  const production = process.env.NODE_ENV === "production"
  return (
    `try{var e=performance.getEntriesByType('navigation')[0];` +
    `var r=e&&e.type==='reload';` +
    `var s=${production}&&!r&&sessionStorage.getItem('${SEEN}')==='1';` +
    `if(!s&&!matchMedia('(prefers-reduced-motion: reduce)').matches)` +
    `document.documentElement.dataset.hero='1'}catch(x){}`
  )
}
