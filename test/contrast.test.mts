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

const LIGHT = palette(":root")
const DARK = palette(":root", ':root[data-theme="dark"]')

/** Small text, and the smallest text, against every ground it is drawn on. */
const TEXT: [string, string, string][] = [
  ["--ink", "--paper", "body text on the page"],
  ["--ink", "--panel", "body text on a panel"],
  ["--slate", "--paper", "secondary text"],
  // `.callout` is eleven pixels, the smallest type on the site and the least
  // forgiving, and it is drawn on both grounds.
  ["--mute", "--paper", "the callout on the page"],
  ["--mute", "--panel", "the callout on a panel"],
  // Brass is used as text, not only as illustration: a part number on the
  // worksheet, the step numbers on the trade page, the flagship line.
  ["--brass", "--paper", "brass read as text"],
  // The console's Pill: eleven pixels of brass on the soft tint.
  ["--brass-deep", "--brass-soft", "the console pill"],
  ["--oxblood", "--paper", "a refusal, and the actions"],
  // The stage is fixed dark in both themes, so its own pairs are asserted once.
  ["--stage-ink", "--stage", "text on the stage"],
  ["--stage-mute", "--stage", "the callout on the stage"],
  ["--stage-brass", "--stage", "brass on the stage"],
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
  ["--focus-on-paper", "--paper", "the focus ring on the page"],
  ["--stage-focus", "--stage", "the focus ring on the stage"],
]

function value(from: Map<string, string>, token: string): string {
  // The ring on the page is oxblood, named here so the pair reads as what it
  // is rather than as a colour that happens to be shared with the actions.
  const name = token === "--focus-on-paper" ? "--oxblood" : token
  const found = from.get(name)
  assert.ok(found, `${name} is not declared in globals.css`)
  return found
}

for (const [name, colours] of [
  ["the palette", LIGHT],
  ["the palette a visitor who chose dark sees", DARK],
] as const) {
  describe(name, () => {
    for (const [ink, ground, why] of TEXT) {
      test(`${why} clears AA`, () => {
        const measured = ratio(value(colours, ink), value(colours, ground))
        assert.ok(
          measured >= 4.5,
          `${ink} on ${ground} is ${measured}:1, and small text wants 4.5:1`,
        )
      })
    }

    for (const [mark, ground, why] of CONTROLS) {
      test(`${why} clears AA for a non text control`, () => {
        const measured = ratio(value(colours, mark), value(colours, ground))
        assert.ok(
          measured >= 3,
          `${mark} on ${ground} is ${measured}:1, and an indicator wants 3:1`,
        )
      })
    }
  })
}

describe("the two grounds that are not interchangeable", () => {
  /**
   * `--shot` is sampled from the photographs' own field and `--stage` is set to
   * meet it, near but not equal. 56 of the 62 shots are white hardware on that
   * field, and the match is what lets a full bleed photograph sit on the page
   * with no rectangle around it. Anybody tidying the palette will see two
   * near identical near blacks and want to collapse them, which would put a
   * visible edge around every product tile in the catalogue.
   */
  test("the shot's field is its own token", () => {
    assert.notEqual(
      value(LIGHT, "--shot"),
      value(LIGHT, "--stage"),
      "the photographs' field and the stage are separately tuned, on purpose",
    )
  })

  test("and the two are close enough that no edge shows", () => {
    const measured = ratio(value(LIGHT, "--shot"), value(LIGHT, "--stage"))
    assert.ok(measured < 1.1, `they have drifted apart to ${measured}:1`)
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

  test("the stage sets one", () => {
    assert.match(
      css,
      /\.stage\s*{[^}]*--focus:\s*var\(--stage-focus\)/,
      "the stage does not redirect the ring, so it falls back to the page's",
    )
  })
})

describe("the band carries white text", () => {
  // Fixed in both themes for exactly this reason, so it is asserted once.
  test("white on the band clears AA", () => {
    const measured = ratio("#ffffff", value(LIGHT, "--band"))
    assert.ok(measured >= 4.5, `white on the band is ${measured}:1`)
  })
})
