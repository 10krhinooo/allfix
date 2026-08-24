"use client"

import { useMemo, useState } from "react"
import { whatsapp } from "@/lib/format"
import { SendList } from "@/components/build/SendList"
import { SaveRail } from "@/components/build/SaveRail"
import type { Seed } from "@/lib/account-book"
import {
  billOfMaterials,
  bomDetail,
  bomMessage,
  defaultInput,
  WIDTH_MAX,
  WIDTH_MIN,
  RUNNERS_MIN,
  RUNNERS_MAX,
  BRACKETS_MIN,
  BRACKETS_MAX,
  DEFAULT_RUNNERS_PER_M,
  DEFAULT_BRACKETS_PER_M,
  cleanQuantity,
  withOverrides,
  QTY_MAX,
  type BomInput,
  type BuildSystem,
  type Mount,
  type QuantityOverrides,
  type Role,
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
  initialInput,
  seed,
  signedIn,
}: {
  systems: BuildSystem[]
  /** The system named by `?system=`, already resolved on the server. */
  initialSlug: string
  /**
   * The window the URL asked for, resolved on the server the same way. A saved
   * rail reopens on its own measurement rather than on the defaults.
   */
  initialInput?: BomInput
  /** The account book this browser already holds, so a save does not replace it. */
  seed: Seed
  signedIn: boolean
}) {
  const [slug, setSlug] = useState(initialSlug || systems[0]?.slug || "")
  const [input, setInput] = useState<BomInput>(initialInput ?? defaultInput)
  const [overrides, setOverrides] = useState<QuantityOverrides>({})

  const system = useMemo(
    () => systems.find((candidate) => candidate.slug === slug) ?? systems[0],
    [systems, slug],
  )
  // Two steps on purpose. The rule runs first and keeps running, then the
  // customer's own quantities go over the top, so changing the width still
  // moves every line they have not spoken for.
  const calculated = useMemo(() => billOfMaterials(system, input), [system, input])
  const bom = useMemo(() => withOverrides(calculated, overrides), [calculated, overrides])
  const changed = bom.lines.some((line) => line.overridden)

  function setQuantity(role: Role, value: string, unit: string) {
    // An empty field is somebody midway through typing, not a zero. Clearing it
    // and having it snap to 0 is the reason number inputs feel hostile.
    if (value.trim() === "") {
      setOverrides((was) => ({ ...was, [role]: 0 }))
      return
    }
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return
    setOverrides((was) => ({ ...was, [role]: cleanQuantity(parsed, unit) }))
  }

  function resetQuantity(role: Role) {
    setOverrides((was) => {
      const next = { ...was }
      delete next[role]
      return next
    })
  }

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
              <div className="min-w-0">
                <p className="font-medium text-ink">{item.label}</p>
                <p className="mt-0.5 text-sm text-slate">{item.note}</p>
                {item.sku && <p className="mt-0.5 font-mono text-[11px] text-mute">{item.sku}</p>}
                {item.overridden && (
                  <p className="mt-1 font-mono text-[11px] text-brass">
                    Yours. We worked out {item.auto}
                    {item.unit && ` ${item.unit}`}.{" "}
                    <button
                      type="button"
                      onClick={() => resetQuantity(item.role)}
                      className="underline underline-offset-2 hover:text-ink"
                    >
                      Put it back
                    </button>
                  </p>
                )}
              </div>

              {/* The quantity is a field, not a figure. The rule is a starting
                  point and the person holding the tape measure knows things it
                  does not: a heavy lined curtain wanting an extra bracket, or a
                  box of runners already in the cupboard. */}
              <label className="flex shrink-0 items-baseline gap-2">
                <span className="sr-only">{item.label} quantity</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={QTY_MAX}
                  step={item.unit === "m" ? 0.1 : 1}
                  value={item.qty}
                  onChange={(event) => setQuantity(item.role, event.target.value, item.unit)}
                  className={`w-20 border-b bg-transparent py-1 text-right font-mono text-lg outline-none transition-colors focus:border-ink ${
                    item.overridden ? "border-brass text-brass" : "border-rule text-ink"
                  }`}
                />
                {item.unit && <span className="text-sm text-slate">{item.unit}</span>}
              </label>
            </li>
          ))}
        </ul>

        {changed && (
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule bg-brass-soft px-6 py-3">
            <p className="text-sm text-slate">
              Some quantities are yours rather than ours. We will quote what is on the list.
            </p>
            <button
              type="button"
              onClick={() => setOverrides({})}
              className="callout hover:text-ink"
            >
              Reset all
            </button>
          </div>
        )}

        <div className="space-y-4 px-6 py-6">
          <p className="text-sm leading-relaxed text-slate">
            A guide to what this rail takes, in guaranteed-fit parts.
            {bom.onSurvey && " A motorised run is sized on a site survey."} Send it over and we
            confirm the price, the cut lengths and stock, then pull it at the counter.
          </p>
          <SendList
            summary={`I have worked out a parts list for a ${system.shortName} rail.`}
            detail={bomDetail(system, input, bom)}
            system={system.slug}
            whatsappText={whatsapp(bomMessage(system, input, bom))}
          />

          {/* The other half of `/account/rails`, which could show a saved window
              and reopen it and had no way to create one. */}
          <div className="border-t border-rule pt-4">
            <SaveRail
              seed={seed}
              signedIn={signedIn}
              system={system.slug}
              widthM={input.widthM}
              panels={input.panels}
              mount={input.mount}
              runnersPerM={input.runnersPerM}
              bracketsPerM={input.bracketsPerM}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
