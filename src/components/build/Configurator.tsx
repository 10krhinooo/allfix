"use client"

import { useMemo, useState } from "react"
import { whatsapp } from "@/lib/format"
import { SendList } from "@/components/build/SendList"
import {
  billOfMaterials,
  bomMessage,
  bomSummary,
  defaultInput,
  WIDTH_MAX,
  WIDTH_MIN,
  RUNNERS_MIN,
  RUNNERS_MAX,
  BRACKETS_MIN,
  BRACKETS_MAX,
  DEFAULT_RUNNERS_PER_M,
  DEFAULT_BRACKETS_PER_M,
  type BuildSystem,
  type Mount,
} from "@/lib/configurator"

/**
 * The rail configurator, driven entirely in the browser.
 *
 * State is local: pick a system, drag the width, choose the draw and the mount,
 * and the bill of materials recomputes on the spot. There is no server round
 * trip because the maths is quantities, not price, and the compact system
 * projection is all it needs. The primary action is the WhatsApp quote, carrying
 * the finished list, because the priced version of this belongs on the backend
 * that does not exist yet.
 */
export function Configurator({
  systems,
  initialSlug,
}: {
  systems: BuildSystem[]
  /** The system named by `?system=`, already resolved on the server. */
  initialSlug: string
}) {
  const [slug, setSlug] = useState(initialSlug || systems[0]?.slug || "")
  const [input, setInput] = useState(defaultInput)

  const system = useMemo(
    () => systems.find((candidate) => candidate.slug === slug) ?? systems[0],
    [systems, slug],
  )
  const bom = useMemo(() => billOfMaterials(system, input), [system, input])

  const draws: { value: number; label: string }[] = [
    { value: 1, label: "Single draw" },
    { value: 2, label: "Centre opening" },
  ]
  const mounts: { value: Mount; label: string }[] = [
    { value: "ceiling", label: "Ceiling" },
    { value: "wall", label: "Wall" },
  ]

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start">
      {/* ---------------------------------------------------------- controls */}
      <form className="border border-rule" onSubmit={(event) => event.preventDefault()}>
        <fieldset className="border-b border-rule p-6">
          <legend className="callout">The rail</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {systems.map((option) => {
              const active = option.slug === system.slug
              return (
                <button
                  key={option.slug}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSlug(option.slug)}
                  className={`rounded-sm border px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "border-ink bg-ink text-paper"
                      : "border-rule text-slate hover:border-ink hover:text-ink"
                  }`}
                >
                  {option.name}
                </button>
              )
            })}
          </div>
        </fieldset>

        <fieldset className="border-b border-rule p-6">
          <legend className="callout">Window width</legend>
          <div className="mt-3 flex items-baseline gap-2">
            <input
              type="number"
              inputMode="decimal"
              min={WIDTH_MIN}
              max={WIDTH_MAX}
              step={0.1}
              value={input.widthM}
              onChange={(event) =>
                setInput((prev) => ({ ...prev, widthM: Number(event.target.value) || 0 }))
              }
              aria-label="Window width in metres"
              className="w-24 border border-rule bg-paper px-3 py-2 font-mono text-lg text-ink focus:outline-none"
            />
            <span className="font-mono text-slate">metres</span>
          </div>
          <input
            type="range"
            min={WIDTH_MIN}
            max={WIDTH_MAX}
            step={0.1}
            value={Math.min(WIDTH_MAX, Math.max(WIDTH_MIN, input.widthM))}
            onChange={(event) =>
              setInput((prev) => ({ ...prev, widthM: Number(event.target.value) }))
            }
            aria-label="Window width slider"
            className="mt-4 w-full accent-oxblood"
          />
          <p className="mt-2 callout">
            {WIDTH_MIN} m to {WIDTH_MAX} m. Measure the finished track run, not the glass
          </p>
        </fieldset>

        <fieldset className="border-b border-rule p-6">
          <legend className="callout">Curtains</legend>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {draws.map((option) => {
              const active = input.panels === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setInput((prev) => ({ ...prev, panels: option.value }))}
                  className={`rounded-sm border px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "border-ink bg-ink text-paper"
                      : "border-rule text-slate hover:border-ink hover:text-ink"
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </fieldset>

        {/*
          The rates are the counter's rule of thumb, not a law. A curtain maker
          working to a heading knows the number better than the site does, so
          the form opens on the catalogue's figure and lets them say otherwise.
        */}
        <fieldset className="border-b border-rule p-6">
          <legend className="callout">Fittings per metre</legend>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm text-slate">Runners</span>
              <input
                type="number"
                inputMode="numeric"
                min={RUNNERS_MIN}
                max={RUNNERS_MAX}
                step={1}
                value={input.runnersPerM}
                onChange={(event) =>
                  setInput((prev) => ({
                    ...prev,
                    runnersPerM: Number(event.target.value) || DEFAULT_RUNNERS_PER_M,
                  }))
                }
                className="mt-1.5 w-full border border-rule bg-paper px-3 py-2 font-mono text-ink focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate">Brackets</span>
              <input
                type="number"
                inputMode="numeric"
                min={BRACKETS_MIN}
                max={BRACKETS_MAX}
                step={1}
                value={input.bracketsPerM}
                onChange={(event) =>
                  setInput((prev) => ({
                    ...prev,
                    bracketsPerM: Number(event.target.value) || DEFAULT_BRACKETS_PER_M,
                  }))
                }
                className="mt-1.5 w-full border border-rule bg-paper px-3 py-2 font-mono text-ink focus:outline-none"
              />
            </label>
          </div>
          <p className="mt-2 callout">
            Counter default is {DEFAULT_RUNNERS_PER_M} runners and {DEFAULT_BRACKETS_PER_M} bracket
            to the metre
          </p>
        </fieldset>

        <fieldset className="p-6">
          <legend className="callout">Mount</legend>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {mounts.map((option) => {
              const active = input.mount === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setInput((prev) => ({ ...prev, mount: option.value }))}
                  className={`rounded-sm border px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "border-ink bg-ink text-paper"
                      : "border-rule text-slate hover:border-ink hover:text-ink"
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </fieldset>
      </form>

      {/* ---------------------------------------------------------- the bill */}
      <div className="border border-rule">
        <div className="drafting border-b border-rule px-6 py-5">
          <p className="callout">Parts list</p>
          <p className="mt-1 font-display text-lg font-semibold tracking-tight">
            {system.name} rail, {bom.lines[0]?.qty} m
          </p>
        </div>

        <ul>
          {bom.lines.map((item) => (
            <li
              key={item.role}
              className="flex items-start justify-between gap-4 border-b border-rule px-6 py-4"
            >
              <div>
                <p className="font-medium text-ink">{item.label}</p>
                <p className="mt-0.5 text-sm text-slate">{item.note}</p>
                {item.sku && <p className="mt-0.5 font-mono text-[11px] text-mute">{item.sku}</p>}
              </div>
              <p className="shrink-0 font-mono text-lg text-ink">
                {item.qty}
                {item.unit && <span className="text-sm text-slate"> {item.unit}</span>}
              </p>
            </li>
          ))}
        </ul>

        <div className="space-y-4 px-6 py-6">
          <p className="text-sm leading-relaxed text-slate">
            A guide to what this rail takes, in guaranteed-fit parts.
            {bom.onSurvey && " A motorised run is sized on a site survey."} Send it over and we
            confirm the price, the cut lengths and stock, then pull it at the counter.
          </p>
          <SendList
            summary={`I have worked out a parts list for a ${system.shortName} rail.`}
            detail={bomSummary(system, input)}
            system={system.slug}
            whatsappText={whatsapp(bomMessage(system, input, bom))}
          />
        </div>
      </div>
    </div>
  )
}
