"use client"

import { useState, useTransition } from "react"
import { Button, WhatsAppIcon } from "@/components/ui"
import { price, SHOP, whatsapp } from "@/lib/format"
import type { Found, Placed } from "@/lib/orders-api"

/**
 * Finding an order again.
 *
 * The checkout ends by telling somebody to keep their reference, and until this
 * screen there was nowhere to use one: a customer who had not registered was
 * handed a number and left with the telephone as the whole of the answer.
 *
 * Both halves are asked for and the refusal never says which was wrong. A
 * reference is a short sequence and guessing one is easy; pairing it with the
 * number the order was placed on is what makes it somebody's own order rather
 * than anybody's, and an answer that said "wrong phone" would confirm the
 * reference exists.
 */

const RULE =
  "mt-1.5 w-full border-0 border-b border-rule bg-transparent px-0 py-2 text-base outline-none focus:border-ink"

/** What the shop can say about where an order has got to, in its own words. */
const STAGE: Record<string, string> = {
  PLACED: "We have it. Nobody has picked it off the shelf yet.",
  PACKING: "Somebody is putting it together now.",
  DISPATCHED: "It has left the shop.",
  COLLECTED: "Collected. Thank you.",
  CANCELLED: "This order was cancelled. If that is wrong, ring us.",
}

export function FindOrder() {
  const [reference, setReference] = useState("")
  const [phone, setPhone] = useState("")
  const [answer, setAnswer] = useState<Found | null>(null)
  const [busy, start] = useTransition()

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setAnswer(null)
    start(async () => {
      // Imported inside the action so the server function is not part of the
      // first load of a page most people reach without needing it.
      const { look } = await import("@/app/(shop)/orders/actions")
      setAnswer(await look(reference, phone))
    })
  }

  const asking = whatsapp(
    `Hello ${SHOP.name}, I am asking about an order.${
      reference.trim() ? ` Reference: ${reference.trim().toUpperCase()}.` : ""
    }`,
  )

  return (
    <>
      <form onSubmit={submit} className="max-w-md">
        <div>
          <label htmlFor="reference" className="callout">
            Your reference
          </label>
          <input
            id="reference"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="AF-2327"
            autoComplete="off"
            className={`${RULE} font-mono uppercase`}
          />
        </div>

        <div className="mt-6">
          <label htmlFor="phone" className="callout">
            The number it was placed on
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="07xx xxx xxx"
            autoComplete="tel"
            className={RULE}
          />
          <span className="mt-1.5 block text-xs leading-relaxed text-slate">
            Both, because a reference on its own is a short number and this is how we know the
            order is yours.
          </span>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy || !reference.trim() || !phone.trim()}>
            {busy ? "Looking" : "Find my order"}
          </Button>
          <Button href={asking} variant="whatsapp">
            <WhatsAppIcon />
            Ask on WhatsApp
          </Button>
        </div>
      </form>

      {answer && !answer.ok && (
        <p role="alert" className="callout mt-8 max-w-md border-l-2 border-oxblood pl-4">
          {answer.message}
        </p>
      )}

      {answer?.ok && <Sheet order={answer.order} />}
    </>
  )
}

function Sheet({ order }: { order: Placed }) {
  const stage = STAGE[order.status] ?? "We have it."

  return (
    <section aria-live="polite" className="mt-10 max-w-2xl border-t border-rule pt-8">
      <p className="callout">{order.reference}</p>
      <h2 className="display-lg mt-2">{stage}</h2>

      <table className="mt-8 w-full text-left text-sm">
        <thead>
          <tr>
            <th scope="col" className="border-b border-rule pb-2 pr-4 font-normal text-mute">
              Part
            </th>
            <th scope="col" className="border-b border-rule pb-2 pr-4 text-right font-normal text-mute">
              Quantity
            </th>
            <th scope="col" className="border-b border-rule pb-2 text-right font-normal text-mute">
              Each
            </th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((line) => (
            <tr key={line.sku ?? line.name}>
              <td className="border-b border-rule py-3 pr-4">
                {line.name}
                {line.sku && <span className="ml-2 font-mono text-xs text-mute">{line.sku}</span>}
              </td>
              <td className="border-b border-rule py-3 pr-4 text-right tabular-nums">
                {line.quantity}
              </td>
              <td className="border-b border-rule py-3 text-right tabular-nums">
                {price(line.unitKes, line.basis?.toLowerCase())}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-6 text-right">
        <span className="callout">Total</span>{" "}
        <span className="ml-3 text-lg tabular-nums">{price(order.totalKes)}</span>
      </p>

      {/* The shop's figure, not one worked out here. A total recomputed in the
          browser could disagree with what somebody is actually being asked for. */}
      <p className="mt-8 text-sm leading-relaxed text-slate">
        Anything not right? Ring {SHOP.phone} with your reference, or come to the counter at{" "}
        {SHOP.street}, {SHOP.area}.
      </p>
    </section>
  )
}
