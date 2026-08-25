"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { animate } from "animejs"
import { SWEEP, heroReveals, painted, reducedMotion } from "@/lib/motion"

/**
 * The curtain between pages.
 *
 * The home page opens on a motorised reveal and every other page arrived with
 * nothing, which read as two different products. This is the same cloth, cut
 * for a different job: the hero's is a demonstration of the thing being sold and
 * takes its time over a track, a motor and a pause; this one is a wipe, and its
 * only job is to be over before it is noticed.
 *
 * It lives in `(shop)/template.tsx` because a template is remounted on every
 * navigation while a layout is not, so mounting is the signal. Nothing here
 * watches the router or compares locations: being alive means a navigation just
 * happened. Filter changes on `/shop` mirror themselves into the URL with
 * `history.replaceState` rather than a navigation, which is the same reason
 * they do not re-run the server, so the wipe correctly ignores them.
 *
 * The crossing from a desk is the one arrival it does have to draw. `painted()`
 * is set from the root layout rather than from this component, because the shop
 * template mounts for the first time on the way out of the console: asking "has
 * my own template mounted before" answered "this is a page load" and suppressed
 * the wipe on the one navigation that is a genuine change of place, the back of
 * the shop to the front of it.
 *
 * Three things it deliberately does not do. It never plays on a fresh document,
 * because covering server rendered markup behind an overlay that only a script
 * can remove trades a working page for a flourish, and because a first load
 * already has an entrance of its own. It does not draw a rail or a motor: those
 * belong to the hero, where the point is the hardware.
 *
 * And it only plays on the way to the front page. It used to wipe between every
 * pair of shop routes, which put a curtain between a product and the part list
 * it belongs to. A curtain is the shop's signature and the home page is where a
 * signature belongs; a customer working through the catalogue wants the next
 * page, not a performance on the way to it. So the two curtains still share the
 * one arrival at `/`, and everywhere else navigates plainly.
 */

const RUNNERS = 14
const SWEEP_MS = 620

function Runners({ side }: { side: "left" | "right" }) {
  return (
    <div
      className="page-curtain-runners absolute inset-x-0 top-0 flex justify-between px-1"
      style={{ transformOrigin: side === "left" ? "left center" : "right center" }}
    >
      {Array.from({ length: RUNNERS }, (_, index) => (
        <span key={index} className="curtain-runner" />
      ))}
    </div>
  )
}

export function PageCurtain() {
  const pathname = usePathname()
  const wrap = useRef<HTMLDivElement>(null)
  const [done, setDone] = useState(false)

  // Decided in render rather than in an effect, because the cloth has to be in
  // the very first commit of the navigation: a leaf that appears one render
  // later appears over a page the visitor has already seen. Safe to read the
  // browser here only because this never renders on the server, which is what
  // `painted()` guarantees.
  //
  // Home only, and on home the hero has first claim: while it still has a
  // reveal to give, this stays out of the way, and once it has played the wipe
  // takes the arrival over so returning to the front page is never a jump cut.
  const skip =
    !painted() ||
    typeof window === "undefined" ||
    reducedMotion() ||
    pathname !== "/" ||
    heroReveals()

  useEffect(() => {
    const node = wrap.current
    if (!node) return

    const leaves = node.querySelectorAll<HTMLElement>(".curtain-leaf")
    const runners = node.querySelectorAll<HTMLElement>(".page-curtain-runners")

    // 101 rather than 100, so a subpixel rounding error cannot leave a hairline
    // of cloth down the edge of the window at rest.
    const playing = [
      animate(leaves[0], { x: ["0%", "-101%"], duration: SWEEP_MS, ease: SWEEP }),
      animate(leaves[1], { x: ["0%", "101%"], duration: SWEEP_MS, ease: SWEEP }),
      animate(runners, {
        scaleX: [1, 0.22],
        duration: SWEEP_MS,
        ease: SWEEP,
        // The overlay is thrown away rather than parked, so the two promoted
        // layers go with it instead of being held for the life of the page.
        onComplete: () => setDone(true),
      }),
    ]

    // Strict Mode runs an effect twice in development. Without this the second
    // run starts a second sweep over the first and the cloth visibly stutters.
    return () => {
      for (const animation of playing) animation.pause()
    }
  }, [])

  if (skip || done) return null

  return (
    <div
      ref={wrap}
      aria-hidden="true"
      className="curtain pointer-events-none fixed inset-0 z-[60] overflow-hidden"
    >
      <div className="curtain-leaf absolute inset-y-0 left-0 w-[50.5%]">
        <Runners side="left" />
        <div className="curtain-panel h-full w-full" />
      </div>
      <div className="curtain-leaf absolute inset-y-0 right-0 w-[50.5%]">
        <Runners side="right" />
        <div className="curtain-panel h-full w-full" />
      </div>
    </div>
  )
}
