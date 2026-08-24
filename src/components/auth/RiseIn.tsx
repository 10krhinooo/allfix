"use client"

import { useEffect, useRef } from "react"
import { animate } from "animejs"
import { reducedMotion } from "@/lib/motion"

/**
 * The sheet arriving, once.
 *
 * Deliberately the whole sheet and not its fields. Staggering the inputs in
 * looks better in a recording and is worse to use: the first field carries
 * `autoFocus`, so the caret lands in something that is still moving, and
 * anybody typing straight away is typing into a shifting target.
 *
 * Written as an effect that starts from the finished state rather than as a CSS
 * keyframe starting from the hidden one. If the script never runs the sheet is
 * simply there, which is the same bargain every other animation in this
 * codebase makes.
 */
export function RiseIn({ className, children }: { className?: string; children: React.ReactNode }) {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = host.current
    if (!node || reducedMotion()) return

    animate(node, {
      opacity: [0, 1],
      translateY: [14, 0],
      duration: 520,
      ease: "outQuart",
    })
  }, [])

  return (
    <div ref={host} className={className}>
      {children}
    </div>
  )
}
