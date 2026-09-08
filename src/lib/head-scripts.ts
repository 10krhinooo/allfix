import { HINT } from "@/lib/admin/hint"
import { heroGateScript } from "@/lib/motion"

/**
 * The decisions that have to be taken before the browser paints anything.
 *
 * All of it is a raw inline script in the head rather than `next/script`.
 * `beforeInteractive` reads as though it means before the page is drawn. It
 * does not: in the App Router it compiles to a push onto `self.__next_s`, which
 * Next drains once the client bundle has arrived, before hydration but long
 * after the first paint. Every line here exists to stop a flash, so queueing
 * them behind the bundle defeats all of them, and the header once shipped
 * showing "Sign in" to people who were already signed in.
 *
 * One tag, and one `try` per concern rather than one around the lot. That
 * separation is the whole reason this is worth having in one place: a throw
 * while reading the door cookie must not skip the hero gate, and a `try` around
 * everything would make each new decision able to break the ones before it.
 */
export function preflight(): string {
  return [DESK, heroGateScript()].join("")
}

/**
 * Which of the header's two controls to show. The cookie carries a boolean and
 * nothing else, and every page that matters is guarded on the server anyway, so
 * the worst a forged one can do is show somebody the wrong label.
 */
const DESK =
  `try{if(/(^|;\\s*)${HINT}=1/.test(document.cookie))` +
  `document.documentElement.dataset.desk='1'}catch(e){}`
