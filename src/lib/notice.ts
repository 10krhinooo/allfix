"use client"

import { useEffect } from "react"

/**
 * A confirmation that takes itself away.
 *
 * "Saved", "written down", "in your basket": these say a thing worked and are
 * read once. Left on the screen they stop being an answer to what somebody just
 * did and become part of the furniture, so the next save changes a line nobody
 * is looking at any more and the screen quietly stops confirming anything.
 *
 * Two kinds of message are deliberately not passed through this.
 *
 * **A refusal stays.** It is the only account of what went wrong and of what to
 * do about it, and it is usually longer than a confirmation, so five seconds is
 * a message somebody is still reading when it goes. Taking an error away also
 * takes it away from a screen reader mid-sentence, and from anybody who looked
 * up at the wrong moment and now has a form that silently did nothing.
 *
 * **A reference stays.** An enquiry or a quote answers with a code the customer
 * is told to keep, and a screen that removes it five seconds later is a screen
 * that lost their reference for them.
 */
export const NOTICE_MS = 5000

export function useFades(shown: boolean, clear: () => void, ms = NOTICE_MS) {
  useEffect(() => {
    if (!shown) return
    const timer = setTimeout(clear, ms)
    // Cleared on the way out, so a second save restarts the count rather than
    // inheriting whatever was left of the first.
    return () => clearTimeout(timer)
  }, [shown, clear, ms])
}
