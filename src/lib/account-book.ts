"use client"

import { useSyncExternalStore } from "react"
import type { Address, SavedRail } from "@/lib/account"

/**
 * The delivery book and the saved rails, while the backend is not reachable.
 *
 * `allfix-backend` owns both on `feature/account-book`: the tables are
 * `customer_address` and `saved_rail`, and the endpoints sit under `/api/me`.
 * Until that service is deployed the same records are kept in this browser,
 * which is the arrangement the console already uses for its own edits.
 *
 * The shape is `AccountBookDto` field for field, deliberately, so pointing
 * these actions at the endpoints is a change to this file and to nothing above
 * it. What this cannot honestly imitate is the part that matters most: a record
 * kept here is on one device, and clearing site data clears it. The screens say
 * so rather than implying an account that follows somebody around.
 */

const KEY = "allfix-account-v1"

export interface Seed {
  addresses: Address[]
  rails: SavedRail[]
}

/** The details a customer may change about themselves. */
export interface Profile {
  name: string
  phone: string
}

export interface Book extends Seed {
  /** Set once the seeded records have been copied in, so a delete sticks. */
  seeded: boolean
  /** Absent until the customer edits their details, so the account's own stand. */
  profile?: Profile
}

const EMPTY: Book = { addresses: [], rails: [], seeded: false }

let cache: Book = EMPTY
let raw: string | null = null
const listeners = new Set<() => void>()

function read(): Book {
  if (typeof window === "undefined") return EMPTY
  let stored: string | null = null
  try {
    stored = window.localStorage.getItem(KEY)
  } catch {
    // Private mode, or site data blocked. An account that cannot be stored is
    // still an account that can be looked at.
    return cache
  }
  // Parsed once per distinct string: `useSyncExternalStore` calls this on every
  // render, and handing back a fresh object each time is an infinite loop.
  if (stored === raw) return cache
  raw = stored
  try {
    cache = stored ? { ...EMPTY, ...(JSON.parse(stored) as Book) } : EMPTY
  } catch {
    cache = EMPTY
  }
  return cache
}

function write(next: Book) {
  cache = next
  raw = JSON.stringify(next)
  try {
    window.localStorage.setItem(KEY, raw)
  } catch {
    // Losing the write is better than losing the page.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * The book as it stands, seeded records included until the first edit.
 *
 * The server rendered the seeded ones, so showing an empty book before the
 * store has been touched would flash them away and put them back.
 */
export function useBook(seed: Seed): Book {
  const book = useSyncExternalStore(subscribe, read, () => EMPTY)
  return book.seeded ? book : { ...seed, seeded: false }
}

function current(seed: Seed): Book {
  const book = read()
  return book.seeded ? book : { ...seed, seeded: true }
}

function newId(prefix: string): string {
  // Good enough for a record that never leaves this browser. The backend
  // assigns a real UUID, which is why nothing reads meaning out of this.
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * One default, kept the way the database keeps it.
 *
 * `customer_address` has a partial unique index allowing a single default per
 * account, so two rows both claiming it is a constraint violation there and
 * would be a wrong delivery address here. Something must also hold it, so an
 * unclaimed book adopts its first entry.
 */
function settle(addresses: Address[], preferred?: string): Address[] {
  const chosen = preferred ?? addresses.find((one) => one.isDefault)?.id ?? addresses[0]?.id
  return addresses.map((one) => ({ ...one, isDefault: one.id === chosen }))
}

export function saveAddress(seed: Seed, draft: Omit<Address, "id">, existing?: string) {
  const book = current(seed)
  const address: Address = { ...draft, id: existing ?? newId("address") }
  const addresses = existing
    ? book.addresses.map((one) => (one.id === existing ? address : one))
    : [...book.addresses, address]
  write({
    ...book,
    seeded: true,
    addresses: settle(addresses, address.isDefault ? address.id : undefined),
  })
}

export function removeAddress(seed: Seed, target: string) {
  const book = current(seed)
  write({
    ...book,
    seeded: true,
    addresses: settle(book.addresses.filter((one) => one.id !== target)),
  })
}

export function makeDefault(seed: Seed, target: string) {
  const book = current(seed)
  write({ ...book, seeded: true, addresses: settle(book.addresses, target) })
}

export function saveRail(seed: Seed, rail: Omit<SavedRail, "id">) {
  const book = current(seed)
  write({ ...book, seeded: true, rails: [{ ...rail, id: newId("rail") }, ...book.rails] })
}

export function removeRail(seed: Seed, target: string) {
  const book = current(seed)
  write({ ...book, seeded: true, rails: book.rails.filter((one) => one.id !== target) })
}

/**
 * The customer's own name and phone.
 *
 * Mirrors `PUT /api/me`, which takes these two and nothing else: an email is
 * the account's identity and where a reset link goes, so changing one is a
 * verification flow rather than an edit, and a role is granted at the counter
 * and never claimed.
 */
export function saveProfile(seed: Seed, profile: Profile) {
  const book = current(seed)
  write({ ...book, seeded: true, profile })
}

export function useProfile(seed: Seed, fallback: Profile): Profile {
  return useBook(seed).profile ?? fallback
}

/**
 * The same, for a page that holds no seed.
 *
 * `useProfile` takes one because the account's own screens render the seeded
 * records before the store is touched, and must not flash them away. A form on
 * the storefront has no seed to fall back to and does not need one: either the
 * customer has edited their details, in which case this is what they last said,
 * or they have not and the session's own answer stands.
 */
export function useSavedProfile(): Profile | null {
  return useSyncExternalStore(subscribe, read, () => EMPTY).profile ?? null
}
