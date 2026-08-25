"use client"

import { useEffect } from "react"
import { markPainted } from "@/lib/motion"

/**
 * The one thing this document knows that no page in it can: whether anything
 * has been painted yet.
 *
 * The page curtain must never cover server rendered markup on a fresh document,
 * and it used to answer "is this a fresh document" by asking whether its own
 * template had mounted before. Inside the shop that is the same question. Coming
 * from the console it is not: the shop template mounts for the first time on
 * arrival, so a navigation out of a desk looked exactly like a page load and the
 * wipe suppressed itself precisely where it was most wanted.
 *
 * Mounted in the root layout, which survives every navigation including the ones
 * between route groups, so the flag means what it says. It renders nothing, and
 * setting the flag in an effect is what keeps it honest: an effect runs after
 * the first paint, so during the hydration render of a fresh document it is
 * still false.
 */
export function Painted() {
  useEffect(() => {
    markPainted()
  }, [])
  return null
}
