"use client"

import { useEffect, useRef, useState } from "react"
import { createTimeline, stagger } from "animejs"
import { SEEN, SWEEP, heroReveals, reducedMotion } from "@/lib/motion"

/**
 * The motorised track that opens the hero.
 *
 * The shop's flagship line is a curtain that opens on its own, so the front
 * door runs the product rather than describing it. A track installs itself
 * across the top, the motor arrives at the left end, and then it draws two
 * panels apart, with the runners bunching toward the leading edge the way a
 * real curtain stacks rather than sliding as one rigid sheet.
 *
 * The hero underneath is complete and readable on its own. All of this is
 * drawn on top of a finished page and then thrown away, so the reveal can fail
 * in any way at all, no JavaScript, reduced motion, a script that never
 * arrives, and what is left is simply the page. Nothing here is load bearing.
 */

const RUNNERS = 12

function Runners({ innerRef, side }: { innerRef: React.Ref<HTMLDivElement>; side: "left" | "right" }) {
  return (
    <div
      ref={innerRef}
      className="absolute inset-x-0 top-0 flex justify-between px-1"
      // The stack forms at the end the curtain is drawn toward, so each row
      // compresses outward, away from the middle of the window.
      style={{ transformOrigin: side === "left" ? "left center" : "right center" }}
    >
      {Array.from({ length: RUNNERS }, (_, index) => (
        <span key={index} className="curtain-runner" />
      ))}
    </div>
  )
}

export function Curtain() {
  const wrap = useRef<HTMLDivElement>(null)
  const rail = useRef<HTMLDivElement>(null)
  const motor = useRef<HTMLDivElement>(null)
  const left = useRef<HTMLDivElement>(null)
  const right = useRef<HTMLDivElement>(null)
  const leftRunners = useRef<HTMLDivElement>(null)
  const rightRunners = useRef<HTMLDivElement>(null)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const node = wrap.current
    if (!node || !rail.current || !motor.current || !left.current || !right.current) return
    if (!leftRunners.current || !rightRunners.current) return

    // The same question `PageCurtain` asks before it wipes into the home page,
    // so the two can never both decide they own the arrival.
    if (reducedMotion() || !heroReveals()) {
      node.style.display = "none"
      return
    }

    const timeline = createTimeline({
      // Built now, played below. See the visibility check under the timeline.
      autoplay: false,
      defaults: { ease: "inOutQuart" },
      onComplete: () => {
        // Marked here rather than on the way in. Strict Mode runs an effect
        // twice in development, and a flag written before the animation meant
        // the second run read it, took the panels straight down, and the
        // curtain appeared to flash and vanish instead of opening.
        sessionStorage.setItem(SEEN, "1")
        setGone(true)
      },
    })

    timeline
      // The track goes up first, so the curtain has something to hang from.
      .add(rail.current, { scaleX: [0, 1], duration: 560, ease: "inOutQuad" }, 0)
      .add(motor.current, { opacity: [0, 1], x: [-24, 0], duration: 320 }, 420)
      // A beat on the motor before anything moves: the pause between pressing
      // the button and the curtain going is the thing being demonstrated.
      .add(left.current, { x: ["0%", "-101%"], duration: 1500, ease: SWEEP }, 780)
      .add(right.current, { x: ["0%", "101%"], duration: 1500, ease: SWEEP }, 780)
      .add(
        [leftRunners.current, rightRunners.current],
        { scaleX: [1, 0.22], duration: 1500, ease: SWEEP },
        780,
      )
      .add(
        [rail.current, motor.current],
        { opacity: 0, duration: 420, delay: stagger(60) },
        2000,
      )

    /*
     * Nothing plays to an empty room.
     *
     * A hidden tab is not painted and anime's engine does not tick while the
     * document is hidden, so a reveal started now sits on its first frame for as
     * long as the visitor is elsewhere and then snaps open the moment they
     * arrive. Measured at twelve seconds in a background tab, still closed, and
     * gone by the next frame after the tab was focused. So wait for somebody to
     * be looking, which is the only condition under which this is worth playing.
     */
    const start = () => {
      if (document.hidden) return
      document.removeEventListener("visibilitychange", start)
      timeline.play()
    }

    if (document.hidden) document.addEventListener("visibilitychange", start)
    else timeline.play()

    return () => {
      document.removeEventListener("visibilitychange", start)
      timeline.pause()
    }
  }, [])

  if (gone) return null

  return (
    <div
      ref={wrap}
      aria-hidden="true"
      className="curtain hero-curtain pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      {/* The track, drawn as the white aluminium section the shop actually sells. */}
      <div
        ref={rail}
        className="curtain-rail absolute inset-x-0 top-0 z-10 h-3.5 origin-left"
        style={{ transform: "scaleX(0)" }}
      />
      <div
        ref={motor}
        className="curtain-motor absolute left-0 top-0 z-20 h-5 w-14"
        style={{ opacity: 0 }}
      />

      <div ref={left} className="curtain-leaf absolute inset-y-0 left-0 top-3.5 w-[50.5%]">
        <Runners innerRef={leftRunners} side="left" />
        <div className="curtain-panel h-full w-full" />
      </div>

      <div ref={right} className="curtain-leaf absolute inset-y-0 right-0 top-3.5 w-[50.5%]">
        <Runners innerRef={rightRunners} side="right" />
        <div className="curtain-panel h-full w-full" />
      </div>
    </div>
  )
}
