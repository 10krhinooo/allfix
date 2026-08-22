import { useSyncExternalStore } from "react"
import type { PriceBasis } from "@/lib/catalogue"
import type { EnquiryDraft } from "@/lib/enquiry"

/**
 * The console's working state.
 *
 * Held in localStorage, so an edit survives a reload and clearing site data
 * clears it. Every screen goes through the actions below rather than touching
 * this state directly, which is what keeps the storage decision to this file:
 * pointing an action at an endpoint instead changes nothing above it.
 *
 * What this store deliberately does not hold is who is using it. Identity lives
 * in a signed HttpOnly cookie (`src/lib/admin/session.ts`), because anything
 * kept here is editable from devtools, and a price log is only worth reading if
 * its attribution cannot be typed in by hand. That is why `setPrice` is given
 * the name rather than looking it up.
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
  /**
   * Whether localStorage has been read yet.
   *
   * The server snapshot and the first client paint are both the empty state, so
   * without this a screen cannot tell "nothing has been filed" from "the browser
   * has not been asked yet" and confidently renders a zero that is about to
   * change. It is not persisted: it is only ever true in a browser that has run
   * `hydrate`.
   */
  ready: boolean
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
const EMPTY: AdminState = { ready: false, prices: {}, log: [], enquiries: {}, inbox: [] }

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
    // which is all this needs.
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
    const stored = raw ? (JSON.parse(raw) as Partial<AdminState>) : {}
    state = {
      ready: true,
      prices: stored.prices ?? {},
      log: stored.log ?? [],
      enquiries: stored.enquiries ?? {},
      inbox: stored.inbox ?? [],
    }
  } catch {
    // A stored shape from an older build is not worth crashing the console
    // over. Starting clean is the right failure.
    state = { ...EMPTY, ready: true }
  }
  // Every path marks the read as done, including the empty one. A browser with
  // nothing stored has still been asked, and a screen waiting on `ready` would
  // otherwise wait for ever on exactly the case it exists to describe.
  emit()
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
  by: string,
) {
  const entry: PriceLog = {
    at: Date.now(),
    slug: row.slug,
    name: row.name,
    ref: row.ref,
    by,
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

/** Throws the working edits away and returns to the catalogue as migrated. */
export function reset() {
  set(EMPTY)
}
