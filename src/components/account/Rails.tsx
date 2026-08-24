"use client"

import Link from "next/link"
import { reopen, type SavedRail } from "@/lib/account"
import { useBook, removeRail, type Seed } from "@/lib/account-book"
import { Card, CardHeader, EmptyState, Note } from "@/components/admin/parts"

/**
 * Windows the customer has already measured.
 *
 * A saved rail is the measurement, not the parts list it produced. Reopening
 * one runs the configurator again against today's catalogue, so a rail saved
 * before a repricing comes back correct rather than quoting last year's money.
 * That is why "Open in the configurator" is the action and there is no stored
 * bill of materials to show here.
 */

const MOUNT: Record<SavedRail["mount"], string> = {
  ceiling: "Ceiling fixed",
  wall: "Wall fixed",
}

export function Rails({ seed }: { seed: Seed }) {
  const book = useBook(seed)

  if (book.rails.length === 0) {
    return (
      <>
        <EmptyState
          title="No saved rails"
          body="Measure a window in the configurator and save it, and it comes back here with the parts list."
        />
        <Link
          href="/build"
          className="mt-6 inline-block bg-oxblood px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
        >
          Build a rail
        </Link>
      </>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {book.rails.map((rail) => (
          <Card key={rail.id}>
            <CardHeader title={rail.name} hint={`${rail.widthM} m · ${MOUNT[rail.mount]}`} />
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
              {[
                ["System", rail.system],
                ["Width", `${rail.widthM} m`],
                ["Draw", rail.panels >= 2 ? "Centre opening" : "Single"],
                ["Runners", `${rail.runnersPerM}/m`],
              ].map(([term, value]) => (
                <div key={term}>
                  <dt className="callout">{term}</dt>
                  <dd className="mt-1 font-mono text-sm text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-4 border-t border-rule pt-3">
              <Link href={reopen(rail)} className="callout text-oxblood hover:text-oxblood-deep">
                Open in the configurator
              </Link>
              <button
                type="button"
                onClick={() => removeRail(seed, rail.id)}
                className="callout ml-auto hover:text-ink"
              >
                Remove
              </button>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Note>
          Opening a rail works it out again at today&rsquo;s prices, so a window saved months ago
          still quotes correctly.
        </Note>
      </div>
    </>
  )
}
