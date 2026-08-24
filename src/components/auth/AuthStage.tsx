"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { animate, svg, stagger } from "animejs"
import { Logo } from "@/components/Logo"
import { Profile, PROFILES } from "@/components/Profile"
import { reducedMotion } from "@/lib/motion"

/**
 * The dark half of a door.
 *
 * The auth screens were a form on an empty page, which is what every login on
 * the internet looks like, and this shop has a drawing language of its own that
 * was going unused at exactly the moment somebody is deciding whether it is a
 * real business. So the stage runs the thing no other storefront can: the rail
 * sections, drawn stroke by stroke the way the trade actually identifies a
 * track, looking down the cut end.
 *
 * The profiles are the same generated geometry `/systems` uses, not artwork
 * made for this page. A #28 is drawn wider than a #20 here because it is wider,
 * and if the catalogue gains a system this picks it up.
 *
 * The panel is its own screen and stays put while the sheet scrolls. Letting it
 * stretch to the form's height was wrong on the sign in page, where the seeded
 * account list runs long: the section ended up marooned halfway down a very
 * tall black column with the caption somewhere below the fold.
 *
 * The drawing and its sheet counter are decoration and are marked `aria-hidden`.
 * The panel as a whole is not, because the logo on it is a real link back to the
 * shop: a focusable control inside a hidden subtree is reachable by keyboard and
 * invisible to a screen reader, which is worse than either.
 *
 * Hidden entirely below `lg`. A phone has no width to spare for a wall, and the
 * sheet carries its own logo and its own way back.
 */

/** Ordered so the cycle opens on the flagship and the widths visibly change. */
const CYCLE = ["motorised", "20", "28", "ks", "double-rail", "15-bendable"].filter(
  (slug) => slug in PROFILES,
)

const NAMES: Record<string, string> = {
  motorised: "Motorised",
  "20": "#20",
  "28": "#28",
  ks: "KS",
  "double-rail": "Double rail",
  "15-bendable": "#15 bendable",
}

const DWELL = 4200

export function AuthStage({ line }: { line: string }) {
  const host = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    // The drawing is complete in the markup either way, so a visitor who
    // prefers stillness gets the section rather than nothing. The sheet counter
    // below hides itself in CSS for the same reason: nothing is cycling, so
    // there is no position in a cycle to report.
    if (reducedMotion()) return

    let timer: ReturnType<typeof setTimeout> | undefined

    const run = () => {
      const node = host.current
      if (!node) return

      const strokes = Array.from(node.querySelectorAll<SVGElement>("[data-live] :is(path, circle, line)"))
      if (strokes.length > 0) {
        animate(svg.createDrawable(strokes as never), {
          draw: ["0 0", "0 1"],
          ease: "inOutQuad",
          duration: 1100,
          delay: stagger(80),
        })
      }

      // Advanced from here rather than on an interval, so a tab that was in the
      // background does not come back owing six transitions at once.
      timer = setTimeout(() => setIndex((was) => (was + 1) % CYCLE.length), DWELL)
    }

    // Nothing plays to an empty room, the same rule the hero curtain follows.
    if (document.hidden) {
      const start = () => {
        if (document.hidden) return
        document.removeEventListener("visibilitychange", start)
        run()
      }
      document.addEventListener("visibilitychange", start)
      return () => {
        document.removeEventListener("visibilitychange", start)
        if (timer) clearTimeout(timer)
      }
    }

    run()
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [index])

  const slug = CYCLE[index]

  return (
    <aside
      className="stage relative hidden overflow-hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-between"
    >
      {/* The brass rule the curtain runs off, the same one the home hero leaves
          behind as its track. */}
      <div className="absolute inset-x-0 top-0 h-px bg-stage-brass/40" />

      <div className="px-12 pt-14">
        {/* The way back to the shop, and a real link: somebody who arrived on a
            bookmark and wanted the storefront should not have to find the small
            one on the sheet. Pinned to the lifted variant, because this ground
            is black in both themes and the oxblood wordmark disappears on it. */}
        <Link
          href="/"
          title="Back to the shop"
          className="inline-block transition-opacity hover:opacity-70"
        >
          <Logo height={40} on="dark" alt="AllFix By Kipekee, back to the shop" />
        </Link>
        <p className="mt-7 max-w-[22ch] font-display text-3xl font-semibold leading-tight text-stage-ink">
          {line}
        </p>
      </div>

      <div
        ref={host}
        aria-hidden="true"
        className="relative flex flex-1 items-center justify-center px-12"
      >
        <div key={slug} className="flex flex-col items-center">
          <div data-live className="text-stage-brass">
            <Profile system={slug} size={440} className="h-auto w-full max-w-[26rem]" />
          </div>
          <p className="mt-8 font-mono text-xs uppercase tracking-[0.18em] text-stage-mute">
            {NAMES[slug] ?? slug} · section
          </p>
        </div>

      </div>

      <div aria-hidden="true" className="px-12 pb-12">
        {/* The set, marked so somebody can see how many there are and which one
            is up, the way a drawing sheet is numbered. In flow with the caption
            rather than floated over the drawing, which put it on the text. */}
        <ol className="flex gap-1.5 motion-reduce:hidden">
          {CYCLE.map((each, at) => (
            <li
              key={each}
              className={`h-1 w-6 transition-colors duration-500 ${
                at === index ? "bg-stage-brass" : "bg-stage-rule"
              }`}
            />
          ))}
        </ol>
        <p className="mt-5 max-w-[34ch] text-sm leading-relaxed text-stage-ink/60">
          Nine rail systems, and the fittings that actually match them. This is how the trade tells
          them apart: look down the cut end and read the shape.
        </p>
      </div>
    </aside>
  )
}
