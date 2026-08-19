"use client"

import { useEffect, useRef } from "react"
import { animate, svg, stagger } from "animejs"

/**
 * Draws the SVG strokes inside it, once, when it first scrolls into view.
 *
 * Progressive enhancement: the artwork is fully drawn in the markup, and this
 * only ever takes it away to put it back. If the script never runs, or the
 * visitor prefers reduced motion, the drawings are simply there.
 *
 * anime's `createDrawable` measures each path itself, which matters here because
 * the profile outlines are generated from channel geometry and every system has
 * a different perimeter. A hand-set dash length would be wrong for most of them.
 */
export function TraceOnView({
  children,
  stagger: step = 70,
  duration = 900,
}: {
  children: React.ReactNode
  stagger?: number
  duration?: number
}) {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = host.current
    if (!node) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const strokes = Array.from(node.querySelectorAll<SVGElement>("[data-trace] :is(path, circle, line)"))
    if (strokes.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        animate(svg.createDrawable(strokes as never), {
          draw: ["0 0", "0 1"],
          ease: "inOutQuad",
          duration,
          delay: stagger(step),
        })
      },
      { threshold: 0.2 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [step, duration])

  return <div ref={host}>{children}</div>
}
