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
 */

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
      viewBox="0 0 480 92"
      role="img"
      aria-label="A curtain rail with a length missing from the middle, its runners stopped short of the gap"
      className="h-auto w-full"
    >
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
      viewBox="0 0 480 196"
      role="img"
      aria-label="A curtain hanging from its rail with one corner come away from the runners"
      className="h-auto w-full"
    >
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
    <div ref={scope} className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-xl justify-center">
        {art === "gap" ? <RailWithGap /> : <ClothOffRunners />}
      </div>

      <p className="mt-9 font-mono text-xs uppercase tracking-[0.24em] text-mute">{code}</p>
      <h1 className="mt-3 max-w-xl text-center font-display text-3xl font-bold tracking-tight text-ink">
        {title}
      </h1>
      <p className="mt-4 max-w-md text-center text-sm leading-relaxed text-slate">{body}</p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>
    </div>
  )
}
