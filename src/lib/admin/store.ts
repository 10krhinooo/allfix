import { useSyncExternalStore } from "react"
import type { PriceBasis } from "@/lib/catalogue"
import type { EnquiryDraft } from "@/lib/enquiry"

/**
 * The console's state, held in this browser and nowhere else.
 *
 * This is a prototype. The backend that will own accounts, prices and
 * enquiries is written but not deployed, so rather than pretend, every edit
 * made here is written to localStorage and read back from it. Nothing leaves
 * the machine, and clearing site data clears the lot.
 *
 * That is a deliberate stand-in, not a design: `src/lib/admin/api.ts` is the
 * one place the swap has to happen, and every screen already goes through the
 * actions below rather than touching this state directly.
 *
 * The shape follows what the backend already enforces, so the two cannot
 * disagree about what a price is. In particular a price is null or a real
 * figure, never 0: that exact value, on every product, is what stopped the old
 * WooCommerce store selling anything.
 */

const KEY = "allfix-admin-v1"

export interface PriceEdit {
  priceKes: number | null
  priceBasis: PriceBasis
  priceNote: string | null
}

/** One line of the price history, mirroring product_price_change on the server. */
export interface PriceLog {
  at: number
  slug: string
  name: string
  ref: string
  by: string
  from: PriceEdit
  to: PriceEdit
  reason: string | null
}

export type EnquiryState = "new" | "working" | "quoted" | "closed"

/** An enquiry somebody sent through the site, as opposed to the seeded ones. */
export interface FiledEnquiry extends EnquiryDraft {
  id: string
  reference: string
  at: number
}

export interface AdminState {
  /** The member of staff at the counter. A name, not a session: see the sign in page. */
  who: string | null
  /** Price edits, keyed by product slug. Absent means the catalogue's own figure stands. */
  prices: Record<string, PriceEdit>
  log: PriceLog[]
  enquiries: Record<string, EnquiryState>
  /**
   * Enquiries sent through the site rather than by WhatsApp.
   *
   * Standing in for the table the backend will own. It is what makes the whole
   * loop demonstrable: fill the form on the shop, and the enquiry is in the
   * console queue before you have finished walking to the counter.
   */
  inbox: FiledEnquiry[]
}

/**
 * Referentially stable, and returned by the server snapshot as well as by a
 * browser that has never been used. React compares snapshots by identity, so a
 * fresh object here would re-render on every check.
 */
const EMPTY: AdminState = { who: null, prices: {}, log: [], enquiries: {}, inbox: [] }

let state: AdminState = EMPTY
let hydrated = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Private browsing can refuse storage. The edits still hold for this visit,
    // which is all a demonstration needs.
  }
}

/**
 * Reads the stored state once, on the first subscription rather than at module
 * scope. Doing it at import time would run during the server render and read a
 * localStorage that is not there; doing it in the first snapshot would hand
 * React a different value before and after hydration and trip a mismatch.
 */
function hydrate() {
  if (hydrated) return
  hydrated = true
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return
    const stored = JSON.parse(raw) as Partial<AdminState>
    state = {
      who: stored.who ?? null,
      prices: stored.prices ?? {},
      log: stored.log ?? [],
      enquiries: stored.enquiries ?? {},
      inbox: stored.inbox ?? [],
    }
    emit()
  } catch {
    // A stored shape from an older build is not worth crashing the console
    // over. Starting clean is the right failure.
  }
}

function subscribe(listener: () => void) {
  hydrate()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function set(next: AdminState) {
  state = next
  persist()
  emit()
}

export function useAdmin() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY,
  )
}

// ------------------------------------------------------------------- actions

export function signIn(who: string) {
  set({ ...state, who })
}

export function signOut() {
  set({ ...state, who: null })
}

/**
 * Records a price change and what it replaced.
 *
 * The previous value is copied into the log rather than left to be worked out
 * from the entry before it, because a mistake is usually noticed several edits
 * later and by then the only reliable answer to "what was it?" is the one
 * written down at the time.
 */
export function setPrice(
  row: { slug: string; name: string; ref: string },
  from: PriceEdit,
  to: PriceEdit,
  reason: string | null,
) {
  const entry: PriceLog = {
    at: Date.now(),
    slug: row.slug,
    name: row.name,
    ref: row.ref,
    by: state.who ?? "Unknown",
    from,
    to,
    reason,
  }
  set({
    ...state,
    prices: { ...state.prices, [row.slug]: to },
    // Newest first, which is the order the counter reads it in.
    log: [entry, ...state.log],
  })
}

/**
 * Files an enquiry and hands back its reference.
 *
 * Called from the storefront rather than the console, which is the one place
 * those two touch. It is deliberate: this function is the stand-in for a POST,
 * and when the endpoint exists it is the only thing that changes.
 */
export function fileEnquiry(draft: EnquiryDraft, reference: (count: number) => string): string {
  const count = state.inbox.length + 1
  const filed: FiledEnquiry = {
    ...draft,
    id: `filed-${count}-${Date.now()}`,
    reference: reference(count),
    at: Date.now(),
  }
  // Newest first, matching the order the queue reads in.
  set({ ...state, inbox: [filed, ...state.inbox] })
  return filed.reference
}

export function setEnquiry(id: string, next: EnquiryState) {
  set({ ...state, enquiries: { ...state.enquiries, [id]: next } })
}

/** Throws the prototype's edits away and returns to the catalogue as migrated. */
export function reset() {
  set({ ...EMPTY, who: state.who })
}
