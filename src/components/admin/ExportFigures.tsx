"use client"

import { useState } from "react"
import type { Summary } from "@/lib/admin/reports-service"

/**
 * The dashboard's figures, as a file somebody can open in a spreadsheet.
 *
 * Built in the browser from the figures already on the page rather than asked
 * for from the service, and that is the decision rather than the shortcut. The
 * screen has the numbers: fetching them again would be a second read of the
 * same afternoon, which can disagree with what the reader is looking at, and it
 * would mean this button does nothing until the service is hosted. Exporting
 * what is on the screen is also the only honest thing a button on that screen
 * can claim to do.
 *
 * CSV rather than a spreadsheet format, because the destination is an
 * accountant's inbox and every spreadsheet opens one. Sections rather than a
 * single flat grid, for the same reason the screen has cards: the day by day
 * takings and the channel split are different tables and stacking them with a
 * blank line between is what a person would do by hand.
 */

/**
 * One CSV field.
 *
 * The quoting is not decoration. A part called `Curtain Buckles, gold` has a
 * comma in it, and this shop's catalogue is full of them, so a naive join puts
 * the shelf figure in the wrong column for exactly the rows somebody is most
 * likely to look at.
 */
function field(value: string | number | null): string {
  if (value === null) return ""
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function rows(lines: (string | number | null)[][]): string {
  return lines.map((line) => line.map(field).join(",")).join("\n")
}

function csvFor(summary: Summary, taken: Date): string {
  const { money, trade, shelf } = summary

  return [
    rows([
      ["AllFix By Kipekee, the counter's figures"],
      ["Taken", taken.toISOString()],
      [],
      ["What the shop took"],
      ["Today", money.takenToday],
      ["This week", money.takenThisWeek],
      ["This month", money.takenThisMonth],
      ["Last month", money.takenPreviousMonth],
      // Named at length, because the gap between the two is the thing somebody
      // reading this in a spreadsheet will otherwise try to reconcile.
      ["Settled electronically this month", money.settledThisMonth],
      ["Orders this month", money.ordersThisMonth],
      ["Average order", money.averageOrderKes],
      [],
      ["Trade"],
      ["Trade orders this month", trade.tradeOrdersThisMonth],
      ["Taken on trade accounts", trade.tradeTakenThisMonth],
      ["Trade accounts", trade.tradeAccounts],
      [],
      ["The shelf"],
      ["Counted", shelf.counted],
      // The distinction the whole stock model rests on, carried into the file
      // so a reader cannot add the other three and think they have the
      // catalogue.
      ["Never counted", shelf.uncounted],
      ["Running low", shelf.low],
      ["None left", shelf.outOfStock],
      [],
      ["Day by day"],
      ["Day", "Taken (KES)", "Orders"],
    ]),
    rows(summary.series.map((day) => [day.day, day.takenKes, day.orders])),
    "",
    rows([["What moves"], ["Code", "Part", "Taken (KES)", "Quantity"]]),
    rows(summary.topParts.map((part) => [part.sku, part.name, part.takenKes, part.quantity])),
    "",
    rows([["How they arrived, this month"], ["Channel", "Orders", "Taken (KES)"]]),
    rows(summary.channels.map((each) => [each.channel, each.orders, each.takenKes])),
    "",
    rows([["Orders by state, all time"], ["State", "Orders"]]),
    rows(summary.statuses.map((each) => [each.status, each.orders])),
    "",
  ].join("\n")
}

export function ExportFigures({ summary }: { summary: Summary }) {
  const [done, setDone] = useState(false)

  function save() {
    const taken = new Date()
    // A BOM, so a spreadsheet opening this in Nairobi reads the part names as
    // UTF-8 rather than as mojibake. Excel guesses the encoding otherwise, and
    // guesses wrong on a file that is mostly ASCII with a few accented names.
    const blob = new Blob(["﻿" + csvFor(summary, taken)], {
      type: "text/csv;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `allfix-figures-${taken.toISOString().slice(0, 10)}.csv`
    link.click()
    // Released on the next tick rather than immediately: revoking before the
    // browser has started the download cancels it in Safari.
    setTimeout(() => URL.revokeObjectURL(url), 1_000)

    setDone(true)
    setTimeout(() => setDone(false), 4_000)
  }

  return (
    <span className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={save}
        className="rounded-sm border border-ink px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
      >
        Export these figures
      </button>
      {/* Announced rather than only drawn: the file arrives in the browser's
          own downloads and nothing else on the page changes. */}
      <span role="status" className="callout">
        {done ? "Saved as a CSV" : ""}
      </span>
    </span>
  )
}
