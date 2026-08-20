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

    const drawings = Array.from(node.querySelectorAll<SVGElement>("[data-trace]"))
    if (drawings.length === 0) return

    /*
     * Each drawing is watched on its own rather than the group as a whole.
     *
     * The systems index holds nine profiles and the home page picker holds
     * nine more. Watching the container meant one drawing scrolling into view
     * started every stroke on the page at once, and stroke dashing is painted
     * on the CPU, so a hundred-odd of them in the same frames is what made
     * those pages stutter. Now a profile draws when it is actually reached,
     * which spreads the work across the scroll and never animates a drawing
     * the visitor has not looked at.
     */
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          observer.unobserve(entry.target)

          const strokes = Array.from(
            entry.target.querySelectorAll<SVGElement>(":is(path, circle, line)"),
          )
          if (strokes.length === 0) continue

          animate(svg.createDrawable(strokes as never), {
            draw: ["0 0", "0 1"],
            ease: "inOutQuad",
            duration,
            delay: stagger(step),
          })
        }
      },
      { threshold: 0.2 },
    )

    for (const drawing of drawings) observer.observe(drawing)
    return () => observer.disconnect()
  }, [step, duration])

  return <div ref={host}>{children}</div>
}
