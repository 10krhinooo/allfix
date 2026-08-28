import { useSyncExternalStore } from "react"
import type { EnquiryDraft } from "@/lib/enquiry"

/**
 * The console's working state, and what is left of it.
 *
 * Prices used to live here. That was the arrangement's own argument turned
 * against it: this file existed so that pointing an action at an endpoint would
 * change nothing above it, and until the endpoint was wired a price typed at
 * the counter reached neither the shop nor the owner's laptop. It looked saved,
 * it survived a reload, and it was in one browser. On the one feature this
 * project exists because of. They go to the service now, through
 * `catalogue-api.ts`, where a zero is refused and an audit row is written.
 *
 * What is left is the enquiry inbox, which is genuinely this browser's: it
 * stands in for a table the service will own, and it is the thing that makes
 * the loop demonstrable without one.
 *
 * What this store has never held is who is using it. Identity lives in a signed
 * HttpOnly cookie (`src/lib/admin/session.ts`), because anything kept here is
 * editable from devtools, and an attribution that can be typed by hand is not
 * an attribution.
 */

const KEY = "allfix-admin-v1"

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
const EMPTY: AdminState = { ready: false, enquiries: {}, inbox: [] }

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
    // Anything else in the stored object is ignored, which is what carries a
    // browser holding the older shape across: the price map that used to live
    // here is simply not read any more.
    state = {
      ready: true,
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
