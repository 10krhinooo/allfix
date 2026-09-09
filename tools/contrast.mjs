/**
 * The contrast ratios the palette promises, read from the palette itself.
 *
 * Every token in `globals.css` used to carry its ratio in a comment, worked out
 * by hand and written down. That is fine until a value moves: the number in the
 * comment stays, and a comment that is confidently wrong is worse than no
 * comment, because the next person believes it.
 *
 * So the numbers move to where they can fail. This reads the stylesheet, and
 * `test/contrast.test.mts` declares the pairs and their floors. The comments
 * keep the reason, which is the part that does not go stale.
 *
 * No dependency and no CSS parser: the token block is plain custom properties,
 * one per line, and anything cleverer would be a build step to maintain.
 */

import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const STYLESHEET = resolve(ROOT, "src/app/globals.css")

/**
 * Every `--token: value` declaration inside a given selector's block.
 *
 * Brace counting rather than a regex over the whole file, because `@theme` and
 * the media queries below it declare custom properties too and picking them up
 * would mean resolving `var()` chains that point back at what we are reading.
 */
function blockFor(css, selector) {
  /*
   * Matched with its opening brace, because the file talks about its own
   * selectors in prose. The comment at the top of globals.css explains why
   * `@theme inline` is used, and a bare indexOf finds that sentence first, then
   * counts braces from inside a comment and returns whatever block it lands in.
   */
  const start = css.indexOf(`${selector} {`)
  if (start === -1) throw new Error(`no ${selector} block in globals.css`)

  let depth = 0
  let open = -1
  for (let at = start; at < css.length; at++) {
    if (css[at] === "{") {
      if (depth === 0) open = at
      depth++
    } else if (css[at] === "}") {
      depth--
      if (depth === 0) return css.slice(open + 1, at)
    }
  }
  throw new Error(`unclosed ${selector} block in globals.css`)
}

function declarations(block) {
  const found = new Map()
  for (const [, name, value] of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    found.set(name, value.trim())
  }
  return found
}

/**
 * The palette as declared, with one selector layered over another.
 *
 * A theme block overrides only some of the tokens, so reading it alone gives a
 * partial palette and a pair that looks fine because one half is missing.
 */
export function palette(...selectors) {
  const css = readFileSync(STYLESHEET, "utf8")
  const resolved = new Map()
  for (const selector of selectors) {
    for (const [name, value] of declarations(blockFor(css, selector))) {
      resolved.set(name, value)
    }
  }
  return resolved
}

/**
 * The colour utilities Tailwind will actually generate, as bare names.
 *
 * `@theme inline` turns `--color-deep-mute` into `text-deep-mute`, `bg-deep-mute`
 * and the rest. A class naming a token that was never declared is not an error
 * anywhere: Tailwind emits nothing, the element silently inherits, and the first
 * anybody knows is grey text on a near-black tile in a screenshot. Neither
 * TypeScript nor ESLint can see it, and axe only catches it if that exact screen
 * is swept. So the list is read from the stylesheet and checked against usage.
 */
export function colourNames() {
  const css = readFileSync(STYLESHEET, "utf8")
  const names = new Set()
  for (const [name] of declarations(blockFor(css, "@theme inline"))) {
    if (name.startsWith("--color-")) names.add(name.slice("--color-".length))
  }
  return names
}

/** `#rgb`, `#rrggbb`, or a bare `rgb(r g b)`. Enough for what the file holds. */
export function rgb(value) {
  const hex = value.trim()
  if (hex.startsWith("#")) {
    const digits = hex.slice(1)
    const full =
      digits.length === 3
        ? digits
            .split("")
            .map((digit) => digit + digit)
            .join("")
        : digits
    if (full.length !== 6) throw new Error(`cannot read the colour ${value}`)
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ]
  }
  const numbers = hex.match(/[\d.]+/g)
  if (!numbers || numbers.length < 3) throw new Error(`cannot read the colour ${value}`)
  return numbers.slice(0, 3).map(Number)
}

/** WCAG 2 relative luminance. */
function luminance([r, g, b]) {
  const channel = (value) => {
    const scaled = value / 255
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** The WCAG 2 contrast ratio, 1 to 21, rounded to two places. */
export function ratio(a, b) {
  const first = luminance(rgb(a))
  const second = luminance(rgb(b))
  const lighter = Math.max(first, second)
  const darker = Math.min(first, second)
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100
}
