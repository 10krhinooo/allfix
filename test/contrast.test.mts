import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
// Plain JavaScript, deliberately: it is read by this test and by nothing Next
// builds, so it stays out of the bundle and out of the type graph.
import { palette, ratio } from "../tools/contrast.mjs"

/**
 * The palette's promises, asserted rather than annotated.
 *
 * Every token in `globals.css` was tuned against a ratio worked out by hand and
 * written into a comment beside it. That worked exactly once. A value moves and
 * the comment stays, and the next person reads a number that is no longer true:
 * the `--mute` and `--brass-deep` comments both exist because a ratio was wrong
 * and nobody could see it from the file.
 *
 * So the numbers live here, where a wrong one fails, and the comments in the
 * stylesheet keep the reason, which is the part that does not go stale.
 *
 * Two things this deliberately does not do. It does not read opacity modified
 * utilities such as `text-stage-ink/60`, which are written in components rather
 * than in the palette: those stay `e2e/accessibility.spec.ts`'s job, which is
 * why both nets exist. And it does not assert a floor on the hairline tokens,
 * because a rule drawn between two rows is decoration and WCAG 1.4.11 exempts
 * it; asserting 3:1 there would mean drawing the grid in a colour nobody wants.
 */

const HERE = dirname(fileURLToPath(import.meta.url))

/** One theme, so one palette. */
const COLOURS = palette(":root")

/** Small text, and the smallest text, against every ground it is drawn on. */
const TEXT: [string, string, string][] = [
  ["--ink", "--paper", "body text on the wall"],
  ["--ink", "--panel", "body text on a panel"],
  ["--slate", "--paper", "secondary text"],
  ["--slate", "--panel", "secondary text on a panel"],
  // `.callout` is eleven pixels, the smallest type on the site and the least
  // forgiving, and it is drawn on both grounds.
  ["--mute", "--paper", "the callout on the wall"],
  ["--mute", "--panel", "the callout on a panel"],
  // Brass is read as text, not only drawn as metal: a part number on the
  // worksheet, the step numbers on the trade page, the flagship line. Plaster
  // is darker than paper, so the metal in a sentence is not the metal in a
  // drawing, and this pair is what keeps the two apart honestly.
  ["--brass", "--paper", "brass read as text"],
  ["--brass", "--panel", "brass read as text on a panel"],
  // The console's Pill: eleven pixels of brass on the soft tint.
  ["--brass-deep", "--brass-soft", "the console pill"],
  // Terracotta is one value doing two jobs, a fill under white and a line of
  // text on the wall. Both directions are asserted, here and in FILLS below,
  // because a value tuned for one drifts out of the other silently.
  ["--terra", "--paper", "an action written as text"],
  ["--terra-deep", "--paper", "an action being hovered"],
  ["--oxblood", "--paper", "a refusal"],
  ["--oxblood", "--panel", "a refusal on a panel"],
  // The deep regions are fixed dark, so they carry their own pairs.
  ["--deep-ink", "--deep", "text on a deep ground"],
  ["--deep-mute", "--deep", "the callout on a deep ground"],
  ["--deep-brass", "--deep", "brass on a deep ground"],
  // The document, which is printed and so is fixed light whatever else is.
  ["--sheet-ink", "--sheet", "a printed document"],
  ["--sheet-mute", "--sheet", "the small print on one"],
]

/** Fills, judged by the white text they carry rather than by the fill itself. */
const FILLS: [string, string][] = [
  ["--terra", "a primary action"],
  ["--terra-deep", "one being hovered"],
  ["--oxblood", "a destructive action"],
  ["--oxblood-deep", "one being hovered"],
  ["--band", "the band on the trade page"],
  ["--deep", "a deep region"],
]

/**
 * Controls and indicators, which want 3:1 rather than 4.5:1.
 *
 * The focus ring is the one nothing else looks at. axe does not measure an
 * outline, and a ring is invisible to a test that reads text contrast, so it
 * was 1.92:1 on the console rail in the default theme for as long as the rail
 * has existed.
 */
const CONTROLS: [string, string, string][] = [
  ["--terra", "--paper", "the focus ring on the wall"],
  ["--terra", "--panel", "the focus ring on a panel"],
  ["--deep-focus", "--deep", "the focus ring on a deep ground"],
]

function value(from: Map<string, string>, token: string): string {
  const found = from.get(token)
  assert.ok(found, `${token} is not declared in globals.css`)
  return found
}

describe("the palette", () => {
  for (const [ink, ground, why] of TEXT) {
    test(`${why} clears AA`, () => {
      const measured = ratio(value(COLOURS, ink), value(COLOURS, ground))
      assert.ok(
        measured >= 4.5,
        `${ink} on ${ground} is ${measured}:1, and small text wants 4.5:1`,
      )
    })
  }

  for (const [fill, why] of FILLS) {
    test(`${why} carries white text`, () => {
      const measured = ratio("#ffffff", value(COLOURS, fill))
      assert.ok(measured >= 4.5, `white on ${fill} is ${measured}:1`)
    })
  }

  for (const [mark, ground, why] of CONTROLS) {
    test(`${why} clears AA for a non text control`, () => {
      const measured = ratio(value(COLOURS, mark), value(COLOURS, ground))
      assert.ok(
        measured >= 3,
        `${mark} on ${ground} is ${measured}:1, and an indicator wants 3:1`,
      )
    })
  }
})

describe("the two dark grounds that are not interchangeable", () => {
  /**
   * Two near blacks with different jobs, which is exactly the shape somebody
   * tidying a palette wants to collapse.
   *
   * `--shot` is sampled from the photographs themselves: 56 of the 62 are white
   * hardware on that field, and a tile drawn in it is what lets a photograph
   * have no edge. `--deep` is the room with the light off it, and it is warm,
   * because it is the shadow colour rather than a neutral black. Setting the
   * photographs' field to the warm one puts a grey cast behind every product in
   * the catalogue; setting the rooms to the cold one loses the warmth the whole
   * direction is built on.
   */
  test("the photographs' field is its own token", () => {
    assert.notEqual(
      value(COLOURS, "--shot"),
      value(COLOURS, "--deep"),
      "a photograph's field and a deep region are separately tuned, on purpose",
    )
  })

  test("and the photographs' field is the darker of the two", () => {
    const shot = ratio(value(COLOURS, "--shot"), "#ffffff")
    const deep = ratio(value(COLOURS, "--deep"), "#ffffff")
    assert.ok(
      shot > deep,
      "the field a black shot sits on has gone lighter than the room, which shows as a halo",
    )
  })
})

describe("the ring is wired to the ground it is drawn on", () => {
  /*
   * The pairs above prove `--stage-focus` is a colour that reads on the stage.
   * They do not prove anything uses it, and a token nothing reads is exactly
   * the shape of the bug this pair was written for. So the wiring is asserted
   * from the stylesheet as well: the rule has to consult `--focus`, and the
   * stage has to set it.
   */
  const css = readFileSync(resolve(HERE, "../src/app/globals.css"), "utf8")

  test("the focus rule reads the ground's own ring", () => {
    assert.match(
      css,
      /:focus-visible\s*{[^}]*outline:[^;]*var\(--focus/,
      "the ring is hardcoded, so a dark region cannot correct it",
    )
  })

  test("a deep region sets one", () => {
    assert.match(
      css,
      /\.deep\s*{[^}]*--focus:\s*var\(--deep-focus\)/,
      "a deep region does not redirect the ring, so it falls back to the wall's",
    )
  })
})

describe("the band carries white text", () => {
  // Fixed in both themes for exactly this reason, so it is asserted once.
  test("white on the band clears AA", () => {
    const measured = ratio("#ffffff", value(COLOURS, "--band"))
    assert.ok(measured >= 4.5, `white on the band is ${measured}:1`)
  })
})
