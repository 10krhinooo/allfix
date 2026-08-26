import { NextResponse } from "next/server"
import { readDesk } from "@/lib/admin/guard"
import { addressesFor } from "@/lib/account"
import { tierFor, rateFor } from "@/lib/tiers"

/**
 * Who this browser is signed in as, for the pages that are prerendered.
 *
 * A product page is built once for everybody and served from the edge, which is
 * the right shape for a catalogue and the wrong shape for "show this customer
 * their own rate". Reading the cookie in the page would make all 154 of them
 * dynamic to change one line of type. So the page stays static and the rate is
 * fetched, once per browser, by the components that show money.
 *
 * It answers with the identity the session cookie already carries, plus the
 * address and number the shop already holds for that account. The cookie is
 * HttpOnly and signed, so this is the only way a script on the page can know
 * there is a trade account behind it, and knowing changes what is displayed and
 * never what is charged: the order endpoint reads the same cookie for itself.
 *
 * The number is here because every form that takes an enquiry needs one to ring
 * back on, and asking somebody who signed in twenty seconds ago to type the
 * number the shop already has is the sort of small insult that sends them to
 * WhatsApp instead. It goes only to the browser holding the session it belongs
 * to, and the response is never cached.
 */
export async function GET() {
  const desk = await readDesk()

  if (!desk) {
    return NextResponse.json(
      { signedIn: false, tier: "retail", rate: 0, idleInMs: 0, idleWindowMs: 0 },
      { headers: { "Cache-Control": "no-store" } },
    )
  }

  const tier = tierFor(desk.role)
  return NextResponse.json(
    {
      signedIn: true,
      name: desk.name,
      email: desk.email,
      // Off the default address, which is where the account's own screen reads
      // it from too. An account with no address yet simply has no number to
      // offer, and the form asks for one as it always did.
      phone: addressesFor(desk.email).find((one) => one.isDefault)?.phone ?? "",
      role: desk.role,
      tier,
      rate: rateFor(tier),
      /*
       * How long this session has left, for the watcher that has to warn before
       * it ends. Milliseconds remaining rather than a deadline, because a
       * browser whose clock is wrong would read an absolute time as already
       * past. A signed out visitor is told nothing and needs nothing: the
       * watcher never arms for them.
       */
      idleInMs: desk.idleInMs,
      idleWindowMs: desk.idleWindowMs,
    },
    // Private and never cached. A shared cache holding this would hand one
    // visitor's account to the next.
    { headers: { "Cache-Control": "no-store" } },
  )
}
