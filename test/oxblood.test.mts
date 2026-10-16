import { test } from "node:test"
import assert from "node:assert/strict"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

/**
 * Oxblood is the alarm, so a link never wears it.
 *
 * It used to be the colour of every action and every link on the site, and when
 * terracotta took the actions the links stayed behind: sixty five of them, each
 * one the same red as "this was refused". A colour that means two things means
 * neither, and the one it stops meaning is the warning.
 *
 * So a link or an anchor whose own class names oxblood fails here. Alarms,
 * refusals and destructive buttons keep it, and none of those are links.
 */

function sources(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) sources(path, found)
    else if (/\.tsx$/.test(entry)) found.push(path)
  }
  return found
}

test("no link is drawn in the alarm's colour", () => {
  const wrong: string[] = []

  for (const file of sources("src")) {
    const text = readFileSync(file, "utf8")
    // The opening tag only, which may run over several lines of attributes.
    for (const match of text.matchAll(/<(Link|a)\s[^>]*?\btext-oxblood\b[^>]*>/g)) {
      const line = text.slice(0, match.index).split("\n").length
      wrong.push(`${file}:${line}`)
    }
  }

  assert.deepEqual(wrong, [], "these links are oxblood; a link is terracotta and oxblood is kept for what has gone wrong")
})
