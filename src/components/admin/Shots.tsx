"use client"

import { useState } from "react"
import type { DeskRow } from "@/lib/admin/rows"
import { PageHead, Figures, Figure } from "@/components/admin/parts"

/**
 * The parts still waiting to be photographed.
 *
 * Only what came off the old WooCommerce site was ever shot. Everything the
 * client's workbook added, the whole rod line among it, carries the filename it
 * is waiting for and nothing else, and the storefront draws a placeholder
 * rather than pointing at an image that would 404.
 *
 * So this screen is a brief, not a gallery. It is grouped by rail system and
 * rod finish because that is how the shots would actually be taken: the parts
 * for one system come out of one drawer and go under the lights together, and a
 * list ordered by SKU would send somebody back to the same drawer nine times.
 */
export function Shots({ rows }: { rows: DeskRow[] }) {
  const [copied, setCopied] = useState(false)

  const waiting = rows.filter((row) => !row.photographed)
  const groups = [...new Set(waiting.map((row) => row.group))].sort()

  async function copy() {
    const list = groups
      .map((group) => {
        const parts = waiting.filter((row) => row.group === group)
        return [
          `${group} (${parts.length})`,
          ...parts.map((row) => `  ${row.ref}  ${row.name}  ->  ${row.imageName ?? "no filename"}`),
        ].join("\n")
      })
      .join("\n\n")

    try {
      await navigator.clipboard.writeText(list)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be refused, and there is nothing useful to say
      // about it: the list is on the screen either way.
    }
  }

  return (
    <>
      <PageHead
        title="Shot list"
        lead="Every part with no photograph, grouped the way the shots would be taken. The filename beside each one is what the site is already looking for, so a file named to match drops straight in."
      >
        <button
          onClick={copy}
          className="rounded-sm border border-ink px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          {copied ? "Copied" : "Copy the list"}
        </button>
      </PageHead>

      <Figures>
        <Figure value={waiting.length} label="parts to photograph" tone={waiting.length ? "warn" : "ink"} />
        <Figure value={rows.length - waiting.length} label="already shot" tone="quiet" />
        <Figure value={groups.length} label="systems to set up" tone="quiet" />
      </Figures>

      {groups.map((group) => {
        const parts = waiting.filter((row) => row.group === group)
        return (
          <section key={group} className="border-b border-rule">
            <div className="flex items-baseline justify-between gap-4 bg-panel px-5 py-3 sm:px-8">
              <h2 className="font-display text-base font-semibold tracking-tight">{group}</h2>
              <span className="callout">{parts.length} parts</span>
            </div>
            <ul className="bg-paper">
              {parts.map((row) => (
                <li
                  key={row.slug}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-rule px-5 py-2.5 sm:px-8"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-ink">{row.name}</span>
                    <span className="mt-0.5 flex flex-wrap items-baseline gap-x-3">
                      <span className="font-mono text-[11px] text-mute">{row.ref}</span>
                      <span className="text-xs text-slate">{row.componentLabel}</span>
                    </span>
                  </span>
                  <span className="font-mono text-[11px] text-brass">{row.imageName ?? "no filename set"}</span>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </>
  )
}
