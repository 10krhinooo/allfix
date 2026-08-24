"use client"

import { useSyncExternalStore } from "react"

/**
 * The basket.
 *
 * It holds SKUs and quantities and nothing else, which is the same shape
 * `OrderRequests.Place` accepts on the backend and is deliberate on both sides:
 * a basket that carried prices is a basket somebody eventually posts a price
 * from. What a line costs is resolved server side from the catalogue and the
 * caller's tier, and the figures shown here come from the local catalogue for
 * display only. If the two ever disagree the server is right, which is why
 * checkout shows the total the server returned rather than the one added up in
 * the browser.
 *
 * Kept in localStorage, so a basket survives a reload and clearing site data
 * clears it. This is the one piece of state that genuinely belongs in the
 * browser: a basket is not worth an account, and asking somebody to sign in
 * before they can put a bracket in one loses the sale.
 */

const KEY = "allfix-cart-v1"

export interface CartLine {
  sku: string
  quantity: number
}

export interface Cart {
  lines: CartLine[]
}

const EMPTY: Cart = { lines: [] }

/** A basket bigger than this is a mistake or a script. The counter takes real bulk by phone. */
export const MAX_LINES = 60
export const MAX_QUANTITY = 999

let cache: Cart = EMPTY
let raw: string | null = null
const listeners = new Set<() => void>()

function read(): Cart {
  if (typeof window === "undefined") return EMPTY
  let stored: string | null = null
  try {
    stored = window.localStorage.getItem(KEY)
  } catch {
    return cache
  }
  // Parsed once per distinct string. `useSyncExternalStore` calls this on every
  // render and a fresh object each time is an infinite loop.
  if (stored === raw) return cache
  raw = stored
  try {
    const parsed = stored ? (JSON.parse(stored) as Cart) : EMPTY
    cache = { lines: Array.isArray(parsed.lines) ? parsed.lines : [] }
  } catch {
    cache = EMPTY
  }
  return cache
}

function write(next: Cart) {
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

export function useCart(): Cart {
  return useSyncExternalStore(subscribe, read, () => EMPTY)
}

/** How many parts are in the basket, for the badge in the header. */
export function useCartCount(): number {
  return useCart().lines.length
}

function clean(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1
  return Math.min(Math.max(Math.round(quantity), 1), MAX_QUANTITY)
}

/**
 * Adding the same part twice adds to the line rather than making a second one.
 * Two lines of the same SKU is not something the counter can pick.
 */
export function addToCart(sku: string, quantity = 1) {
  const cart = read()
  const existing = cart.lines.find((line) => line.sku === sku)
  if (existing) {
    write({
      lines: cart.lines.map((line) =>
        line.sku === sku ? { ...line, quantity: clean(line.quantity + quantity) } : line,
      ),
    })
    return
  }
  if (cart.lines.length >= MAX_LINES) return
  write({ lines: [...cart.lines, { sku, quantity: clean(quantity) }] })
}

export function setQuantity(sku: string, quantity: number) {
  const cart = read()
  write({
    lines: cart.lines.map((line) =>
      line.sku === sku ? { ...line, quantity: clean(quantity) } : line,
    ),
  })
}

export function removeFromCart(sku: string) {
  write({ lines: read().lines.filter((line) => line.sku !== sku) })
}

export function clearCart() {
  write(EMPTY)
}
