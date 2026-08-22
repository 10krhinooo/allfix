"use client"

import { useEffect, useRef } from "react"
import { animate, stagger } from "animejs"
import { reducedMotion } from "@/lib/motion"

/**
 * The staging every door in the shop sits on.
 *
 * A rail across the top with the cloth gathered against both walls, and
 * daylight between them where the card sits. The curtains here are scenery
 * rather than a transition: they are already drawn back when you arrive and
 * they stay that way, because this is the one screen in the shop where you are
 * looking at the window instead of through it.
 *
 * That is also why nothing fades. The card and its fields are fully drawn in
 * the markup and only travel a few pixels, so a browser that never runs this,
 * or a visitor who asked for less motion, gets the finished screen rather than
 * a blank one waiting on a script. The same rule the rest of the shop's motion
 * follows.
 */

const RUNNERS = 5

function Cloth({ side }: { side: "left" | "right" }) {
  return (
    <div
      data-cloth={side}
      className={`absolute inset-y-0 top-3.5 w-[16%] sm:w-[13%] ${
        side === "left" ? "left-0" : "right-0"
      }`}
    >
      <div className="absolute inset-x-0 top-0 flex justify-between px-1">
        {Array.from({ length: RUNNERS }, (_, index) => (
          <span key={index} className="curtain-runner" />
        ))}
      </div>
      <div className="curtain-panel h-full w-full" />
    </div>
  )
}

export function AuthScene({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = scope.current
    if (!element || reducedMotion()) return

    // The cloth settles against its wall, each side toward its own edge.
    for (const side of ["left", "right"] as const) {
      animate(element.querySelectorAll(`[data-cloth="${side}"]`), {
        translateX: [side === "left" ? -18 : 18, 0],
        duration: 900,
        ease: "outQuart",
      })
    }

    // The card arrives a line at a time rather than as one block, which is the
    // difference between a screen that opens and a screen that appears.
    animate(element.querySelectorAll("[data-field]"), {
      translateY: [10, 0],
      duration: 420,
      delay: stagger(50, { start: 80 }),
      ease: "outCubic",
    })
  }, [])

  return (
    <div ref={scope} className="stage relative min-h-screen overflow-hidden">
      {/* Fixed rather than absolute, so the rail and the cloth stay in the
          viewport on a long form instead of scrolling away and leaving the card
          on a bare dark field. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div className="curtain-rail absolute inset-x-0 top-0 h-3.5" />
        <Cloth side="left" />
        <Cloth side="right" />
      </div>

      <div className="relative flex min-h-screen w-full items-center justify-center p-4 py-12 sm:p-8">
        <div className="w-full max-w-[27rem]">{children}</div>
      </div>
    </div>
  )
}
