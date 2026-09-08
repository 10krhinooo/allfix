"use client"

import { useEffect, useRef } from "react"
import { animate, stagger } from "animejs"
import { reducedMotion } from "@/lib/motion"

/**
 * The two ways a page can fail, drawn as the two ways a curtain can.
 *
 * An error screen is the one page nobody designs and everybody sees, and the
 * default is a stack trace or a shrug. These say what happened in the shop's own
 * terms: a rail with a length missing for a page that is not there, and cloth
 * off its runners for a page that broke on the way out. That is not decoration.
 * Somebody who understands "it has come off its runners" understands the state
 * of the site without reading a status code.
 *
 * Both drawings are complete in the markup. anime moves the pieces that were
 * already going to be where they end up, so no script, a refused animation or
 * `prefers-reduced-motion` all leave the finished picture rather than an empty
 * frame. Nothing here fades in from nothing, for the same reason.
 *
 * Each one casts. The shadow is a second copy of the same shapes, skewed and
 * flattened onto the wall behind, drawn from `--sun-x`/`--sun-y` like every
 * other shadow on the site. It is not decoration here either: a hard shadow is
 * what tells you a thing is hanging in a room rather than floating in a
 * diagram, and this is the one page where the reader needs the site to still
 * feel like a place. It is `aria-hidden`, because a shadow of a picture is not
 * a second picture.
 */

/**
 * The wall's own light, as an SVG transform.
 *
 * `skewX` lays the copy over to the right and `scale` flattens it, which is
 * what noon does to a shadow: short, hard, and all in one direction. The sun
 * sits upper left, so the shadow falls lower right, matching `.sunlit` in
 * `globals.css` rather than being eyeballed separately.
 */
const CAST = "translate(26 10) skewX(-24) scale(1 0.94)"

function Rail({ gap }: { gap?: boolean }) {
  return (
    <>
      {/* Broken into two lengths when the point is what is missing from it. */}
      <rect x="24" y="46" width={gap ? 186 : 432} height="9" rx="2" fill="var(--mute)" />
      {gap && <rect x="270" y="46" width="186" height="9" rx="2" fill="var(--mute)" />}
      <rect x="24" y="55" width={gap ? 186 : 432} height="3" fill="var(--rule)" />
      {gap && <rect x="270" y="55" width="186" height="3" fill="var(--rule)" />}
    </>
  )
}

function Bracket({ x, missing }: { x: number; missing?: boolean }) {
  return (
    <path
      d={`M${x} 20 h26 v26 h-8 v-18 h-10 v18 h-8 z`}
      fill={missing ? "none" : "var(--brass)"}
      stroke={missing ? "var(--brass)" : "none"}
      strokeWidth="2"
      strokeDasharray={missing ? "5 4" : undefined}
    />
  )
}

/** A page that is not there: the rail is missing a length, and its bracket. */
function RailWithGap() {
  return (
    <svg
      viewBox="0 0 512 100"
      role="img"
      aria-label="A curtain rail with a length missing from the middle, its runners stopped short of the gap"
      className="h-auto w-full"
    >
      {/* Thrown on the wall behind, from the same shapes. */}
      <g transform={CAST} fill="var(--shadow)" opacity="0.13" aria-hidden="true">
        <Bracket x={62} />
        <Bracket x={392} />
        <rect x="24" y="46" width="186" height="12" rx="2" />
        <rect x="270" y="46" width="186" height="12" rx="2" />
      </g>

      <Bracket x={62} />
      <Bracket x={227} missing />
      <Bracket x={392} />
      <Rail gap />

      <g data-runner>
        {[46, 76, 106, 136].map((x, index) => (
          <g key={x} data-runner-index={index}>
            <rect x={x} y="55" width="9" height="13" rx="4" fill="var(--slate)" />
            <circle cx={x + 4.5} cy="74" r="5" fill="none" stroke="var(--slate)" strokeWidth="2" />
          </g>
        ))}
      </g>
    </svg>
  )
}

/** A page that broke: the rail held, the cloth did not. */
function ClothOffRunners() {
  return (
    <svg
      viewBox="0 0 512 204"
      role="img"
      aria-label="A curtain hanging from its rail with one corner come away from the runners"
      className="h-auto w-full"
    >
      {/* The cloth's own shadow, and the rail's, laid on the wall behind. */}
      <g transform={CAST} fill="var(--shadow)" opacity="0.13" aria-hidden="true">
        <Bracket x={62} />
        <Bracket x={392} />
        <rect x="24" y="46" width="432" height="12" rx="2" />
        <path d="M96 58 L300 58 L322 168 L104 178 Z" />
      </g>

      <Bracket x={62} />
      <Bracket x={392} />
      <Rail />

      {/* Still hanging where it should, from the runners it still has. */}
      <g data-cloth style={{ transformBox: "fill-box", transformOrigin: "top left" }}>
        <path
          d="M96 58 L300 58 L322 168 L104 178 Z"
          fill="var(--curtain)"
          stroke="var(--curtain-deep)"
          strokeWidth="2"
        />
        <path
          d="M140 60 L152 172 M184 59 L192 170 M228 58 L232 169 M272 58 L272 168"
          stroke="var(--curtain-deep)"
          strokeWidth="2"
          opacity="0.65"
        />
      </g>

      <g>
        {[100, 150, 200, 250].map((x) => (
          <rect key={x} x={x} y="55" width="9" height="13" rx="4" fill="var(--slate)" />
        ))}
      </g>

      {/* The one that let go, on the floor with the corner it was holding. */}
      <g data-loose>
        <rect x="330" y="150" width="9" height="13" rx="4" fill="var(--slate)" />
        <circle cx="334.5" cy="169" r="5" fill="none" stroke="var(--slate)" strokeWidth="2" />
      </g>
    </svg>
  )
}

export function Fault({
  code,
  title,
  body,
  art,
  children,
}: {
  code: string
  title: string
  body: string
  art: "gap" | "cloth"
  children?: React.ReactNode
}) {
  const scope = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = scope.current
    if (!element || reducedMotion()) return

    if (art === "gap") {
      // The runners travel toward the break and stop short of it, which is the
      // whole sentence: something that should carry on does not.
      animate(element.querySelectorAll("[data-runner-index]"), {
        translateX: [-64, 0],
        duration: 900,
        delay: stagger(70),
        ease: "outQuart",
      })
    } else {
      animate(element.querySelectorAll("[data-cloth]"), {
        rotate: [-1.6, 0],
        duration: 1400,
        ease: "outElastic(1, 0.6)",
      })
      animate(element.querySelectorAll("[data-loose]"), {
        translateY: [-14, 0],
        duration: 700,
        ease: "outBounce",
      })
    }
  }, [art])

  return (
    /*
     * A wall with something wrong on it, rather than a notice pinned to the
     * middle of nowhere.
     *
     * The drawing is given the room it needs and the words sit under it and to
     * the left, where they are read rather than confronted. Centring everything
     * is what an error page does when it has nothing to say; this one has the
     * shop's own answer, which is a phone number and a counter, so it reads as
     * a paragraph rather than as an alert.
     *
     * The floor line at the bottom is the only other mark. It is what makes the
     * shadow above it a shadow: without somewhere for the wall to end, a skewed
     * grey shape is just a smudge.
     */
    <div ref={scope} className="relative flex min-h-screen flex-col justify-center overflow-hidden">
      <div className="shell w-full max-w-3xl py-20">
        <div className="w-full max-w-xl">
          {art === "gap" ? <RailWithGap /> : <ClothOffRunners />}
        </div>

        <p className="callout mt-14">{code}</p>
        <h1 className="display-lg sunlit-text mt-4 max-w-[18ch] font-display text-ink">{title}</h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-slate">{body}</p>

        <div className="mt-9 flex flex-wrap items-center gap-3">{children}</div>
      </div>

      {/* Where the wall stops and the floor starts. */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-panel/60" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-16 h-px bg-rule" aria-hidden="true" />
    </div>
  )
}
