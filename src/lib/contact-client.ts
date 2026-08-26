"use client"

import { useSavedProfile } from "@/lib/account-book"
import { useSession } from "@/lib/tier-client"

/**
 * Who to send an enquiry as, when the shop already knows.
 *
 * Every form here asks for a name, a number and an email, and for a signed out
 * visitor that is the only way to find out. For somebody who signed in it is
 * three fields of retyping what the account already holds, on the screen
 * immediately after they proved who they were, and the WhatsApp button beside
 * it needs none of it. The counter's side is unchanged either way: an enquiry
 * arrives with a name and a number on it.
 *
 * Two sources, in the order they were last stated. The account is what the shop
 * has on file, and the saved profile is what the customer changed it to on
 * `/account/profile`, which lives in `localStorage` until the account book
 * service is deployed. The later answer wins, which is the same order
 * `YourDetails` reads them in, so the number a form offers is the number that
 * screen shows.
 *
 * `ready` is false for the one fetch it takes to find out. A form must not
 * decide it is talking to a stranger before then, or a signed in customer sees
 * the empty fields flash up and fill in underneath them.
 */
export interface Contact {
  name: string
  phone: string
  email: string
}

export function useContact(): { contact: Contact | null; ready: boolean } {
  const { session, ready } = useSession()
  const saved = useSavedProfile()

  if (!ready || !session.signedIn) return { contact: null, ready }

  return {
    contact: {
      name: saved?.name?.trim() || session.name?.trim() || "",
      phone: saved?.phone?.trim() || session.phone?.trim() || "",
      email: session.email?.trim() || "",
    },
    ready,
  }
}
