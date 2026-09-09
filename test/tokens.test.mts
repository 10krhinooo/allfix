import { test } from "node:test"
import assert from "node:assert/strict"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { colourNames } from "../tools/contrast.mjs"

/**
 * Every colour utility used in the app names a token that exists.
 *
 * This is the one class of styling mistake nothing else here can see. A class
 * like `text-niche-mute`, written while the family was called that and left
 * behind when it was renamed to `deep`, is not a TypeScript error, not an ESLint
 * error and not a build failure: Tailwind finds no such token, emits no rule,
 * and the element quietly inherits whatever it was going to. On a tile with a
 * near-black ground that is unreadable text, and the only way to find out is to
 * look at that exact screen.
 *
 * The axe sweep would catch it, but only on a page it visits and only if the
 * element is on screen when it runs. This is cheaper and complete.
 *
 * The check is deliberately narrow: it judges only names that could be ours.
 * Tailwind's own scales (`border-b`, `text-neutral-500`, `shadow-sm`) are its
 * business, and a check that argued with them would be turned off within a week.
 */

/** Utilities that take a colour. `border-b` also matches, and is excluded below. */
const PREFIXES = ["bg", "text", "border", "ring", "fill", "stroke", "divide", "outline", "accent"]

/** Tailwind's built-in palettes. Ours never collide because ours are unprefixed. */
const BUILT_IN_PALETTE =
  /^(slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}$/

/** Structural utilities sharing these prefixes: sides, widths, styles, sizes. */
const STRUCTURAL =
  /^([btlrxyse](-\d+)?|\d+|reverse|solid|dashed|dotted|double|none|hidden|auto|current|transparent|inherit|white|black|xs|sm|md|lg|xl|base|full|inner|box|collapse|separate|color|offset(-\d+)?|balance|pretty|wrap|nowrap|clip|ellipsis|left|right|center|justify|start|end|top|bottom|middle)$/

/**
 * A colour can carry a side: `border-l-brass` is the brass token on one edge.
 * Stripped before the lookup rather than skipped, or the one place this project
 * puts a token on a single border would be the one place it is never checked.
 */
function withoutSide(name: string): string {
  return name.replace(/^[btlrxyse]-/, "")
}

function sources(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) sources(path, found)
    else if (/\.tsx?$/.test(entry)) found.push(path)
  }
  return found
}

test("every colour utility names a token the stylesheet declares", () => {
  const declared = colourNames()
  const wrong = new Set<string>()

  for (const file of sources("src")) {
    const text = readFileSync(file, "utf8")
    for (const [, name] of text.matchAll(
      new RegExp(`\\b(?:${PREFIXES.join("|")})-([a-z][a-z0-9-]*)\\b`, "g"),
    )) {
      if (STRUCTURAL.test(name)) continue
      const colour = withoutSide(name)
      if (STRUCTURAL.test(colour)) continue
      if (BUILT_IN_PALETTE.test(colour)) continue
      // `text-deep-ink/60` matches without its modifier, so it is already covered.
      if (declared.has(colour)) continue
      wrong.add(`${file}: ${name}`)
    }
  }

  // Listed in full rather than counted: the useful part of this failing is which
  // class in which file, and a count only sends somebody hunting for it.
  assert.deepEqual(
    [...wrong].sort(),
    [],
    "these name a colour token globals.css does not declare, so Tailwind emits nothing for them",
  )
})
