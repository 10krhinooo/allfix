/**
 * Rail profiles, drawn as extrusion cross-sections.
 *
 * This is how the trade actually identifies a track: you look down the cut end
 * and read the shape. A curtain rail is an aluminium channel -- a box with the
 * bottom folded inward, leaving a slot for the runner stems to hang through --
 * and the systems differ in how wide, how deep, and what sits in the slot.
 *
 * Generating the outline from those measurements rather than hand-drawing nine
 * paths keeps the family consistent, and means the drawings stay honest: a #28
 * is drawn wider than a #20 because it *is* wider. They are representative
 * rather than dimensioned, which is why the picker tells you to bring an offcut
 * if you are unsure.
 */

export interface ProfileSpec {
  /** Outside width and height of the channel, in the drawing's own units. */
  width: number
  height: number
  /** Wall thickness. */
  wall: number
  /** The gap in the underside the runner stem passes through. */
  slot: number
  /** Corner radius. Bendable tracks are drawn soft, rigid ones square. */
  radius?: number
  /** A rubber insert seated on the bottom returns. */
  rubber?: boolean
  /** Two channels sharing a centre wall. */
  twin?: boolean
  /** A belt cavity in the upper chamber, for driven tracks. */
  belt?: boolean
  /** Cord holes through the top plate, for a roman blind track. */
  cords?: boolean
  /**
   * A roller tube rather than a channel, given as its diameter.
   *
   * A roller and a zebra blind are not extrusions and have no slot for a runner
   * stem, so nothing above applies to them. What you look at on the end of one
   * is a round tube with the fabric coming off it, and `layers` says how many
   * come off: one on a roller, two on a zebra, which is the whole difference
   * between them.
   */
  tube?: number
  layers?: 1 | 2
}

export const PROFILES: Record<string, ProfileSpec> = {
  "20":          { width: 42, height: 34, wall: 4, slot: 13 },
  "20-rubber":   { width: 42, height: 34, wall: 4, slot: 13, rubber: true },
  "28":          { width: 56, height: 44, wall: 5, slot: 17 },
  // Renumbered from #15 by the client in the August sheet. The section is the
  // same track, so the dimensions carry over with the key.
  "10-bendable": { width: 30, height: 27, wall: 3, slot: 10, radius: 7 },
  "17-rubber":   { width: 34, height: 30, wall: 3, slot: 11, radius: 9, rubber: true },
  ks:            { width: 50, height: 22, wall: 3, slot: 14 },
  "double-rail": { width: 74, height: 34, wall: 4, slot: 13, twin: true },
  motorised:     { width: 62, height: 42, wall: 4, slot: 15, belt: true },
  "roman-blind": { width: 38, height: 26, wall: 3, slot: 11, cords: true },
  // Added by the August sheet as systems of their own. Both roll rather than
  // run, so they are drawn as tubes and the channel measurements do not apply.
  "roller-blind": { width: 34, height: 34, wall: 2, slot: 0, tube: 34, layers: 1 },
  "zebra-blind": { width: 34, height: 34, wall: 2, slot: 0, tube: 34, layers: 2 },
}

/**
 * One channel outline: around the outside, in through the slot, and back around
 * the inside void, so the metal reads as a solid section with a hollow middle.
 */
function channel(cx: number, top: number, spec: ProfileSpec) {
  const { width: w, height: h, wall: t, slot: s } = spec
  const l = cx - w / 2
  const r = cx + w / 2
  const b = top + h
  const radius = spec.radius ?? 2

  return [
    `M ${l} ${top + radius}`,
    `Q ${l} ${top} ${l + radius} ${top}`,
    `L ${r - radius} ${top}`,
    `Q ${r} ${top} ${r} ${top + radius}`,
    `L ${r} ${b}`,
    `L ${cx + s / 2} ${b}`,
    `L ${cx + s / 2} ${b - t}`,
    `L ${r - t} ${b - t}`,
    `L ${r - t} ${top + t}`,
    `L ${l + t} ${top + t}`,
    `L ${l + t} ${b - t}`,
    `L ${cx - s / 2} ${b - t}`,
    `L ${cx - s / 2} ${b}`,
    `L ${l} ${b}`,
    "Z",
  ].join(" ")
}

interface Props {
  system: string
  /** Drawn size in px. */
  size?: number
  /** Draw the section in, once, on mount. */
  animate?: boolean
  /** Show the width tick and label beneath the section. */
  dimensioned?: boolean
  className?: string
}

export function Profile({ system, size = 120, animate = false, dimensioned = false, className = "" }: Props) {
  const spec = PROFILES[system]
  if (!spec) return null

  const VIEW = 100
  const cx = VIEW / 2
  const top = (VIEW - spec.height) / 2 - (dimensioned ? 6 : 0)
  const bottom = top + spec.height
  const half = spec.width / 2

  if (spec.tube) return <Tube system={system} spec={spec} size={size} animate={animate} className={className} />

  const sections = spec.twin
    ? [channel(cx - spec.width / 4, top, { ...spec, width: spec.width / 2 }),
       channel(cx + spec.width / 4, top, { ...spec, width: spec.width / 2 })]
    : [channel(cx, top, spec)]

  return (
    <svg
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`Cross-section of the ${system} rail profile`}
    >
      <g
        {...(animate ? { "data-trace": "" } : {})}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        {sections.map((d, i) => (
          <path key={i} d={d} />
        ))}

        {/* The rubber insert sits on the bottom returns, where the glide runs. */}
        {spec.rubber && (
          <>
            <line x1={cx - half + spec.wall} y1={bottom - spec.wall - 1.4} x2={cx - spec.slot / 2} y2={bottom - spec.wall - 1.4} strokeWidth={2.6} opacity={0.45} />
            <line x1={cx + spec.slot / 2} y1={bottom - spec.wall - 1.4} x2={cx + half - spec.wall} y2={bottom - spec.wall - 1.4} strokeWidth={2.6} opacity={0.45} />
          </>
        )}

        {/* A driven track carries its belt in the upper chamber. */}
        {spec.belt && (
          <>
            <circle cx={cx - half + spec.wall + 5} cy={top + spec.wall + 5} r={3.1} />
            <circle cx={cx + half - spec.wall - 5} cy={top + spec.wall + 5} r={3.1} />
            <line x1={cx - half + spec.wall + 5} y1={top + spec.wall + 1.9} x2={cx + half - spec.wall - 5} y2={top + spec.wall + 1.9} />
            <line x1={cx - half + spec.wall + 5} y1={top + spec.wall + 8.1} x2={cx + half - spec.wall - 5} y2={top + spec.wall + 8.1} />
          </>
        )}

        {/* Cords drop through the top plate on a roman blind track. */}
        {spec.cords && [-1, 0, 1].map((n) => (
          <circle key={n} cx={cx + n * 9} cy={top + spec.wall / 2} r={1.5} />
        ))}
      </g>

      {dimensioned && (
        <g stroke="currentColor" strokeWidth={0.8} opacity={0.4}>
          <line x1={cx - half} y1={bottom + 7} x2={cx + half} y2={bottom + 7} />
          <line x1={cx - half} y1={bottom + 4} x2={cx - half} y2={bottom + 10} />
          <line x1={cx + half} y1={bottom + 4} x2={cx + half} y2={bottom + 10} />
        </g>
      )}
    </svg>
  )
}

/**
 * A blind on its tube, seen from the end.
 *
 * Same job as the channel drawings and the same stroke, so a picker showing both
 * reads as one family: the tube, the fabric coming off the back of it, and on a
 * zebra the second layer that makes it a zebra. Not dimensioned, because the
 * diameter is not what anybody is choosing between here.
 */
function Tube({
  system,
  spec,
  size,
  animate,
  className,
}: {
  system: string
  spec: ProfileSpec
  size: number
  animate: boolean
  className: string
}) {
  const VIEW = 100
  const cx = VIEW / 2
  const cy = VIEW / 2 - 8
  const radius = (spec.tube ?? 34) / 2
  const drop = cy + radius + 26

  return (
    <svg
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`Cross-section of the ${system} tube, with the fabric hanging from it`}
    >
      <g
        {...(animate ? { "data-trace": "" } : {})}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        <circle cx={cx} cy={cy} r={radius} />
        {/* The spindle the tube turns on. */}
        <circle cx={cx} cy={cy} r={2.4} />
        {/* The fabric leaves the back of the tube and hangs. A zebra hangs two. */}
        {Array.from({ length: spec.layers ?? 1 }, (_, layer) => (
          <line
            key={layer}
            x1={cx + radius - layer * 4}
            y1={cy}
            x2={cx + radius - layer * 4}
            y2={drop}
          />
        ))}
      </g>
    </svg>
  )
}
