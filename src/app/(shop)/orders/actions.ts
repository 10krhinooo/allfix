"use server"

import { headers } from "next/headers"
import { findOrder, type Found } from "@/lib/orders-api"
import { check } from "@/lib/rate-limit"

/**
 * Looking an order up, from the server.
 *
 * A Server Function rather than a route handler because the form is the whole of
 * the screen and there is nothing else to talk to. The lookup stays on the
 * server for the same reason every other order read does: the service is not
 * reachable from a browser and would not answer one if it were.
 *
 * Rate limited here, and this is the case the Next documentation is explicit
 * about: a Server Function is not a route in the matcher chain, so the proxy
 * never sees this call. Without a limit, a reference is a short sequence and a
 * phone number is guessable in a way that is worth doing slowly and not worth
 * doing five hundred times a minute.
 */
export async function look(reference: string, phone: string): Promise<Found> {
  // `check` reads the caller off request headers, and a Server Function has the
  // headers without the request, so it is handed one carrying them.
  const asking = new Request("http://lookup.local", { headers: await headers() })
  const verdict = check(asking, "lookup")
  if (!verdict.ok) {
    return {
      ok: false,
      message: `That is a lot of tries. Wait ${verdict.retryAfter} seconds, or ring the counter and we will look it up for you.`,
    }
  }

  return findOrder(reference, phone)
}
