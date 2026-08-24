"use client"

import { useState } from "react"
import Link from "next/link"
import { saveRail, type Seed } from "@/lib/account-book"
import type { Mount } from "@/lib/configurator"

/**
 * Keeping a window, so it can be come back to.
 *
 * `/account/rails` has always been able to show these and reopen them, and until
 * now nothing could create one: the screen listed a seeded example and there was
 * no way for a customer to add their own. This is the missing half.
 *
 * What is saved is the measurement, never the parts list it produced. A stored
 * bill of materials is a set of prices frozen on the day it was saved, and it
 * goes quietly wrong when the shop reprices or the catalogue gains a fitting
 * that run should be using. Reopening re-runs the configurator, which is the
 * only version still true a year later.
 *
 * A name is asked for rather than generated. "Sitting room bay" is what the
 * customer will look for; "#20, 4.2 m" is what they already know.
 */
export function SaveRail({
  seed,
  signedIn,
  system,
  widthM,
  panels,
  mount,
  runnersPerM,
  bracketsPerM,
}: {
  seed: Seed
  signedIn: boolean
  system: string
  widthM: number
  panels: number
  mount: Mount
  runnersPerM: number
  bracketsPerM: number
}) {
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState("")
  const [saved, setSaved] = useState(false)

  if (saved) {
    return (
      <p className="flex flex-wrap items-center gap-3 text-sm text-ink">
        Saved as <span className="font-medium">{name}</span>.
        <Link href="/account/rails" className="callout text-oxblood hover:text-oxblood-deep">
          Your saved rails
        </Link>
        <button
          type="button"
          onClick={() => {
            setSaved(false)
            setNaming(false)
            setName("")
          }}
          className="callout hover:text-ink"
        >
          Save another
        </button>
      </p>
    )
  }

  if (!naming) {
    return (
      <button
        type="button"
        onClick={() => setNaming(true)}
        className="border border-rule px-5 py-2.5 text-sm text-ink transition-colors hover:border-brass hover:text-brass"
      >
        Save this rail
      </button>
    )
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (!name.trim()) return
        saveRail(seed, {
          name: name.trim(),
          system,
          widthM,
          panels,
          mount,
          runnersPerM,
          bracketsPerM,
        })
        setSaved(true)
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <label className="block">
        <span className="callout">What is this window called?</span>
        <input
          autoFocus
          required
          maxLength={120}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Sitting room bay"
          className="mt-1 w-56 border-0 border-b border-rule bg-transparent px-0 py-2 text-sm text-ink outline-none placeholder:text-mute focus:border-ink"
        />
      </label>
      <button
        type="submit"
        className="bg-oxblood px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
      >
        Save
      </button>
      <button type="button" onClick={() => setNaming(false)} className="callout hover:text-ink">
        Cancel
      </button>

      {!signedIn && (
        <p className="w-full text-xs leading-relaxed text-mute">
          Kept in this browser.{" "}
          <Link href="/sign-in?next=%2Fbuild" className="text-oxblood underline-offset-4 hover:underline">
            Sign in
          </Link>{" "}
          and it goes on your account instead.
        </p>
      )}
    </form>
  )
}
