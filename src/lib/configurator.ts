/**
 * The rail configurator's bill of materials.
 *
 * This is the storefront's hardest browse problem turned into its strongest
 * sales tool: a customer states a window and gets the exact parts a rail takes,
 * in the right quantities, guaranteed to fit because they all come off the one
 * system. It answers the compatibility question the SKUs encode.
 *
 * The quantity maths lives here as pure functions, and runs on the client for a
 * live feel. Price does not: the plan puts the priced bill of materials on the
 * backend, resolved against the caller's account tier, and until that lands the
 * configurator produces the list and hands it to WhatsApp for a quote, rather
 * than inventing a total. That is the same reason a null price never renders as
 * "KES 0" elsewhere: a figure we cannot stand behind is worse than none.
 *
 * `configuratorSystems()` reads the catalogue on the server and ships a compact
 * projection, so the 200 KB of specs never reaches the browser. Everything below
 * it is client-safe and depends only on that projection.
 */
import { getComponent, systems, partsForSystem } from "@/lib/catalogue"
import { SHOP } from "@/lib/format"

/** A physical role in a built rail, in assembly order. */
export type Role =
  | "track"
  | "bracket"
  | "runner"
  | "master-carrier"
  | "stopper"
  | "joint"
  | "drive-unit"
  | "roller-unit"
  | "motor"
  | "belt"

/** A representative part for a role, matched from the system's catalogue. */
export interface BuildPart {
  sku: string
  name: string
}

export interface BuildSystem {
  slug: string
  name: string
  shortName: string
  motorised: boolean
  /** Stock length a track is sold in, in metres. Longer runs need a joint. */
  stockLengthM: number
  parts: Partial<Record<Role, BuildPart>>
  /**
   * The bracket for each mount, which is a different part and a different SKU.
   *
   * A rail fixed to the ceiling and the same rail fixed to the wall do not take
   * the same bracket, and the shop stocks both: `#20 Single Ceiling Bracket` and
   * `#20 Single Wall Bracket`. The list used to name one bracket whatever the
   * mount was set to, changing only the sentence underneath, which is the kind
   * of wrong that is only found at the counter with the wrong box open.
   *
   * A system may have only one. `#10 bendable` and `KS` are ceiling only on the
   * shelf, so choosing wall on those falls back rather than showing nothing.
   */
  brackets: Partial<Record<Mount, BuildPart>>
}

export type Mount = "ceiling" | "wall"

export interface BomInput {
  /** Window width in metres, the finished track run. */
  widthM: number
  /** Curtain panels: one for a single draw, two for a centre-opening pair. */
  panels: number
  mount: Mount
  /**
   * Fittings a metre of run takes.
   *
   * The catalogue's rates are the counter's rule of thumb for an ordinary
   * pinch pleat, and they are only ever a starting point: a fuller heading
   * wants more runners to the metre, a wave heading fewer, and a heavy lined
   * curtain on a long span wants more brackets than the usual one. These are
   * inputs rather than constants so the fundi who knows the job can say so,
   * instead of ordering to a number the site chose and correcting it at the
   * counter.
   */
  runnersPerM: number
  bracketsPerM: number
}

export interface BomLine {
  role: Role
  /** The matched part name, or the generic role when the system has no match. */
  label: string
  qty: number
  /**
   * What the counter's rule worked out, kept even when `qty` has been changed
   * by hand. Showing the number somebody overrode is the difference between a
   * quantity they chose and a quantity they think the site chose.
   */
  auto: number
  overridden: boolean
  /** "" for a counted part, "m" for track and belt sold by the metre. */
  unit: string
  note: string
  sku?: string
  matched: boolean
}

export interface Bom {
  lines: BomLine[]
  /** Off-catalogue lines a survey confirms, so a caller can see they are coming. */
  onSurvey: boolean
}

/**
 * The counter's rules of thumb, read from the catalogue rather than restated.
 *
 * These used to be literals here, and one of them was wrong: the configurator
 * counted eight runners to the metre while the component copy printed beside it
 * on every system page said ten. The rates now live once, in the migration, and
 * both the sentence and the quantity come from that.
 *
 * The fallbacks are the same figures and exist only so a catalogue built before
 * this change still produces a bill of materials.
 */
function rate(component: string, per: "perMetre" | "minimum", fallback: number) {
  return getComponent(component)?.[per] ?? fallback
}

const BRACKETS_PER_M = rate("bracket", "perMetre", 1)
const MIN_BRACKETS = rate("bracket", "minimum", 2)
const RUNNERS_PER_M = rate("runner", "perMetre", 10)
const STOPPERS = rate("stopper", "minimum", 2)

const ROLE_LABEL: Record<Role, string> = {
  track: "Track",
  bracket: "Bracket",
  runner: "Runner",
  "master-carrier": "Master carrier",
  stopper: "Stopper",
  joint: "Joint",
  "drive-unit": "Drive unit",
  "roller-unit": "Idle unit",
  motor: "Motor",
  belt: "Drive belt",
}

/** The systems the configurator applies to, projected small for the client. */
export function configuratorSystems(): BuildSystem[] {
  return systems
    // A roman blind is raised on a cord, not drawn on runners, so a width and
    // panel count does not describe it. It stays out of the configurator and
    // keeps its own system page.
    .filter((system) => system.slug !== "roman-blind")
    .map((system) => {
      const parts = partsForSystem(system.slug)
      const pick = (component: string): BuildPart | undefined => {
        const part = parts.find((candidate) => candidate.component === component)
        return part ? { sku: part.sku ?? part.slug, name: part.name } : undefined
      }

      /*
       * Brackets are chosen by what they are called, because that is where the
       * catalogue records the difference: the component is "bracket" on all of
       * them and the mount and the gang are in the name.
       *
       * "Single" is preferred over "Double" on everything except the double
       * rail, which is the system a double bracket is actually for. Without
       * that rule the #20 resolved to `#20 Double Ceiling Bracket`, because it
       * happens to sort first, and the configurator was quietly speccing a two
       * track bracket for a one track rail.
       */
      const brackets = parts.filter((candidate) => candidate.component === "bracket")
      const wantsDouble = system.slug === "double-rail"
      const bracketFor = (mount: Mount): BuildPart | undefined => {
        const named = brackets.filter((candidate) => {
          const name = candidate.name.toLowerCase()
          return mount === "wall" ? name.includes("wall") : name.includes("ceiling")
        })
        // A bracket naming neither mount suits either, so it stands in for both.
        const neutral = brackets.filter((candidate) => {
          const name = candidate.name.toLowerCase()
          return !name.includes("wall") && !name.includes("ceiling")
        })
        const pool = named.length > 0 ? named : neutral.length > 0 ? neutral : brackets
        const gang = pool.filter((candidate) =>
          candidate.name.toLowerCase().includes(wantsDouble ? "double" : "single"),
        )
        const chosen = (gang.length > 0 ? gang : pool)[0]
        return chosen ? { sku: chosen.sku ?? chosen.slug, name: chosen.name } : undefined
      }

      return {
        slug: system.slug,
        name: system.name,
        shortName: system.shortName,
        motorised: parts.some((part) =>
          ["motor", "drive-unit", "belt"].includes(part.component),
        ),
        stockLengthM: system.stockLengthM,
        brackets: { ceiling: bracketFor("ceiling"), wall: bracketFor("wall") },
        parts: {
          track: pick("track"),
          bracket: pick("bracket"),
          runner: pick("runner"),
          "master-carrier": pick("master-carrier"),
          stopper: pick("stopper"),
          joint: pick("joint") ?? pick("corner-joint"),
          "drive-unit": pick("drive-unit"),
          "roller-unit": pick("roller-unit"),
          motor: pick("motor"),
          belt: pick("belt"),
        },
      }
    })
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function round1(value: number) {
  return Math.round(value * 10) / 10
}

export const WIDTH_MIN = 0.3
export const WIDTH_MAX = 12
export const PANELS_MAX = 4

// The range a rate can be set to. Wide enough for a wave heading at the bottom
// and a tightly gathered one at the top, and bounded so a slip of the keyboard
// cannot quote four hundred runners.
export const RUNNERS_MIN = 4
export const RUNNERS_MAX = 20
export const BRACKETS_MIN = 1
export const BRACKETS_MAX = 4

/** The catalogue's rates, which is what the form opens on. */
export const DEFAULT_RUNNERS_PER_M = RUNNERS_PER_M
export const DEFAULT_BRACKETS_PER_M = BRACKETS_PER_M

export function defaultInput(): BomInput {
  return {
    widthM: 2,
    panels: 2,
    mount: "ceiling",
    runnersPerM: RUNNERS_PER_M,
    bracketsPerM: BRACKETS_PER_M,
  }
}

/**
 * The bill of materials for a window on a system. Quantities only: what to fit,
 * and how many, with the counter's rule of thumb shown in each note. A line
 * carries the system's real part when there is one and a generic role when
 * there is not, so the list is never empty for a rail we do not have every part
 * of on the sheet yet.
 */
export function billOfMaterials(system: BuildSystem, input: BomInput): Bom {
  const width = clamp(input.widthM, WIDTH_MIN, WIDTH_MAX)
  const panels = clamp(Math.round(input.panels), 1, PANELS_MAX)
  const runnersPerM = clamp(input.runnersPerM || RUNNERS_PER_M, RUNNERS_MIN, RUNNERS_MAX)
  const bracketsPerM = clamp(input.bracketsPerM || BRACKETS_PER_M, BRACKETS_MIN, BRACKETS_MAX)
  const centreOpen = panels >= 2
  const lines: BomLine[] = []

  const line = (role: Role, qty: number, unit: string, note: string, override?: BuildPart) => {
    const part = override ?? system.parts[role]
    lines.push({
      role,
      label: part?.name ?? ROLE_LABEL[role],
      qty,
      auto: qty,
      overridden: false,
      unit,
      note,
      sku: part?.sku,
      matched: Boolean(part),
    })
  }

  line(
    "track",
    round1(width),
    "m",
    input.mount === "ceiling" ? "Cut to length, top fixed" : "Cut to length, face fixed",
  )

  // The bracket follows the mount, so switching from ceiling to wall changes the
  // part and its SKU rather than only the sentence under it.
  const bracket = system.brackets[input.mount] ?? system.parts.bracket
  const onlyOneMount =
    !system.brackets[input.mount] ||
    system.brackets.ceiling?.sku === system.brackets.wall?.sku
  line(
    "bracket",
    Math.max(MIN_BRACKETS, Math.ceil(width * bracketsPerM)),
    "",
    onlyOneMount
      ? `${bracketsPerM} per metre, at least ${MIN_BRACKETS}. This system takes one bracket for both mounts`
      : `${bracketsPerM} per metre, at least ${MIN_BRACKETS}. ${input.mount === "ceiling" ? "Ceiling" : "Wall"} fixed`,
    bracket,
  )

  const joints = Math.max(0, Math.ceil(width / system.stockLengthM) - 1)
  if (joints > 0) {
    line("joint", joints, "", `Track joined over the ${system.stockLengthM} m stock length`)
  }

  line(
    "runner",
    Math.ceil(width * runnersPerM),
    "",
    `${runnersPerM} per metre. More for a fuller pleat, fewer for a wave`,
  )

  if (centreOpen && system.parts["master-carrier"]) {
    line("master-carrier", 1, "", "Overlap arm for a centre-opening pair")
  }

  line("stopper", STOPPERS, "", "One at each end")

  if (system.motorised) {
    line("drive-unit", 1, "", "Motor end of the run")
    line("roller-unit", 1, "", "Idle end of the run")
    line("motor", 1, "", "Sized to the length and weight on survey")
    line("belt", round1(width * 2 + 0.4), "m", "Loops the run. Confirmed on survey")
  }

  return { lines, onSurvey: system.motorised }
}

/** A one-line summary of the window the bill was built for. */
export function bomSummary(system: BuildSystem, input: BomInput) {
  const width = clamp(input.widthM, WIDTH_MIN, WIDTH_MAX)
  const panels = clamp(Math.round(input.panels), 1, PANELS_MAX)
  const draw = panels >= 2 ? "centre-opening" : "single-draw"
  return `${system.name} rail, ${round1(width)} m ${draw}, ${input.mount} mount`
}

/**
 * The window and the parts under it, as text.
 *
 * Both ways of sending a list use this, so the counter reads the same thing
 * whether it arrived over WhatsApp or through the site form. The site form used
 * to send the summary line alone, which was thin when every quantity came off
 * the rule and is wrong now that a customer can set them: the one number they
 * changed by hand was the number that did not arrive.
 *
 * A quantity the customer set is marked as theirs. The counter needs to know
 * which figures to sanity check against the run and which were asked for.
 */
export function bomDetail(system: BuildSystem, input: BomInput, bom: Bom) {
  const items = bom.lines
    .map((item) => {
      const quantity = item.unit ? `${item.qty} ${item.unit}` : `${item.qty}`
      const sku = item.sku ? ` (${item.sku})` : ""
      const theirs = item.overridden ? ` [asked for, we worked out ${item.auto}]` : ""
      return `- ${item.label}${sku}: ${quantity}${theirs}`
    })
    .join("\n")

  return `${bomSummary(system, input)}\n\n${items}`
}

/** The WhatsApp quote text: the summary, then the list, ready to send. */
export function bomMessage(system: BuildSystem, input: BomInput, bom: Bom) {
  return (
    `Hello ${SHOP.name}, please quote this rail:\n` +
    `${bomDetail(system, input, bom)}\n\n` +
    "Can you confirm the price, cut lengths and stock?"
  )
}

/**
 * A window read back off the query string.
 *
 * `/build?system=` has always selected a rail. A saved rail needs the rest of
 * the measurement too, because a saved window that reopens at the defaults is
 * not saved: the customer would have to type it again, which is the thing
 * saving it was for.
 *
 * Every value is clamped to the same bounds the configurator enforces, and
 * anything unparseable falls back to the default rather than erroring, so a
 * hand-edited or truncated link opens on a usable form instead of a stack
 * trace. That matches how `?system=` already treats a slug it does not know.
 */
export function inputFromParams(params: Record<string, string | string[] | undefined>): BomInput {
  const base = defaultInput()
  const one = (key: string): string | undefined => {
    const value = params[key]
    return Array.isArray(value) ? value[0] : value
  }
  const num = (key: string, fallback: number, low: number, high: number): number => {
    const parsed = Number(one(key))
    return Number.isFinite(parsed) ? clamp(parsed, low, high) : fallback
  }

  const mount = one("mount")
  return {
    widthM: num("width", base.widthM, WIDTH_MIN, WIDTH_MAX),
    panels: Math.round(num("panels", base.panels, 1, PANELS_MAX)),
    mount: mount === "wall" || mount === "ceiling" ? mount : base.mount,
    runnersPerM: num("runners", base.runnersPerM, RUNNERS_MIN, RUNNERS_MAX),
    bracketsPerM: num("brackets", base.bracketsPerM, BRACKETS_MIN, BRACKETS_MAX),
  }
}

/**
 * Quantities the customer set by hand, keyed by the role they belong to.
 *
 * A role rather than a SKU, because the override has to survive the thing it is
 * most likely to be used alongside: changing the window. Somebody who knows
 * this run needs six brackets rather than five means six brackets, and if the
 * key were the matched part they would lose that the moment they switched
 * system and the bracket resolved to a different SKU.
 */
export type QuantityOverrides = Partial<Record<Role, number>>

export const QTY_MAX = 999

/**
 * Rounded the way the line is sold: whole parts, or a tenth of a metre for the
 * things cut off a roll. Zero is allowed and is a real answer, not an empty
 * one: "I already have the brackets, leave them off the list".
 */
export function cleanQuantity(value: number, unit: string): number {
  if (!Number.isFinite(value)) return 0
  const bounded = clamp(value, 0, QTY_MAX)
  return unit === "m" ? round1(bounded) : Math.round(bounded)
}

/**
 * The bill with the customer's own quantities laid over it.
 *
 * The rule keeps running underneath: change the width and every line that was
 * not overridden moves with it, while the ones that were stay where they were
 * put. That is the whole point of doing this as a layer rather than by making
 * the list editable and forgetting where the numbers came from.
 */
export function withOverrides(bom: Bom, overrides: QuantityOverrides): Bom {
  return {
    ...bom,
    lines: bom.lines.map((line) => {
      const wanted = overrides[line.role]
      if (wanted === undefined) return line
      const qty = cleanQuantity(wanted, line.unit)
      return qty === line.auto ? line : { ...line, qty, overridden: true }
    }),
  }
}
