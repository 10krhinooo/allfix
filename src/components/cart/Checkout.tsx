"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCart, clearCart } from "@/lib/cart"
import { buyable, type BasketPart } from "@/lib/basket"
import type { Address } from "@/lib/account"
import { price, SHOP, whatsapp } from "@/lib/format"
import { ratePhrase, unitFor, type Tier } from "@/lib/tiers"
import { Button, Empty, WhatsAppIcon } from "@/components/ui"

/**
 * The last screen before an order exists.
 *
 * Three ways to settle, and they are the three the shop actually trades on:
 * M-Pesa now, a proforma for a trade account paying by bank transfer, and
 * paying at the counter on collection. The last two need no payment provider at
 * all, which is why an order can be placed today whatever M-Pesa is doing.
 *
 * Nothing here says an order succeeded until the server has said so, and the
 * figures shown afterwards are the ones it returned rather than the ones added
 * up in this component. That is the rule the whole commerce model rests on: the
 * browser proposes parts and quantities, the server decides what they cost.
 */

const RULE =
  "mt-2 w-full border-0 border-b border-rule bg-transparent px-0 py-2 text-sm text-ink " +
  "outline-none transition-colors placeholder:text-mute focus:border-ink disabled:opacity-55"

type Settlement = "MPESA" | "PROFORMA" | "COUNTER"

interface Placed {
  reference: string
  totalKes: number
  subtotalKes: number
}

export function Checkout({
  catalogue,
  addresses,
  trade,
  signedIn,
}: {
  catalogue: Record<string, BasketPart>
  addresses: Address[]
  /** A trade account may ask for a proforma. A shopper pays now or at the counter. */
  trade: boolean
  /**
   * Whether there is an account behind this. A guest types their own details
   * and gets the reference to keep; somebody signed in picks a saved address
   * and finds the order on their account afterwards.
   */
  signedIn: boolean
}) {
  const router = useRouter()
  const cart = useCart()
  const [settlement, setSettlement] = useState<Settlement>("MPESA")
  const [addressId, setAddressId] = useState(
    addresses.find((one) => one.isDefault)?.id ?? addresses[0]?.id ?? "collect",
  )
  const [phone, setPhone] = useState("")
  const [note, setNote] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [street, setStreet] = useState("")
  const [area, setArea] = useState("")
  const [problems, setProblems] = useState<string[]>([])
  /**
   * Whether the shop could not be reached, as opposed to refusing the basket.
   *
   * Only this one offers the way out below. A basket the shop refused is a
   * basket somebody can correct; a basket the shop never saw is one that is
   * about to be lost, and a customer who has just typed out a delivery address
   * will not type it again tomorrow.
   */
  const [down, setDown] = useState(false)
  const [busy, setBusy] = useState(false)
  const [placed, setPlaced] = useState<Placed | null>(null)

  // Read from the session on the server rather than fetched, because this page
  // is already dynamic: it had to read the cookie to know whether to offer a
  // proforma at all.
  const tier: Tier = trade ? "trade" : "retail"
  const unit = (sku: string) => unitFor({ priceKes: catalogue[sku]?.priceKes ?? null }, tier) ?? 0

  const sellableLines = cart.lines.filter((line) => buyable(catalogue[line.sku]))
  const subtotal = sellableLines.reduce((sum, line) => sum + unit(line.sku) * line.quantity, 0)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy || sellableLines.length === 0) return
    setBusy(true)
    setProblems([])
    setDown(false)

    const chosen = addresses.find((one) => one.id === addressId)
    const collecting = addressId === "collect"
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Parts and quantities. No prices: the server works those out.
          lines: sellableLines,
          settlement,
          deliverTo: chosen
            ? `${chosen.recipient}, ${chosen.line}, ${chosen.area}, ${chosen.town}` +
              (chosen.directions ? ` (${chosen.directions})` : "")
            : collecting || !street
              ? null
              : `${name}, ${street}, ${area}`,
          deliverPhone: chosen?.phone ?? phone,
          note,
          // Ignored by the server when there is a session, which is why it is
          // safe to send either way.
          guest: signedIn ? null : { name, phone, email },
        }),
      })
      const body = (await response.json().catch(() => ({}))) as Placed & {
        message?: string
        problems?: string[]
      }

      if (!response.ok) {
        setProblems(body.problems?.length ? body.problems : [body.message ?? "That did not work."])
        /*
         * A refusal and an outage are different things and the difference is
         * what the customer should do next. A 400 is the shop saying something
         * about this basket is wrong, and it is fixable here. A 5xx is the shop
         * being unable to answer at all, and no amount of correcting the form
         * will help: that is when the basket is worth carrying somewhere else.
         */
        setDown(response.status >= 500)
        setBusy(false)
        return
      }

      // Only now, and only with the server's own figures.
      clearCart()
      setPlaced(body)
      router.refresh()
    } catch {
      // Never reached the shop at all, which is the case this exists for.
      setProblems(["We could not reach the shop just then."])
      setDown(true)
      setBusy(false)
    }
  }

  /*
   * The basket, written out for a chat window.
   *
   * Deliberately carries no total. The figures on this screen are display only
   * and the order route re-prices from the cookie, so a total pasted into a chat
   * is a number the shop never agreed to and would have to argue with later.
   * Quantities and codes are what the counter needs; the price is theirs to say.
   */
  const handover = whatsapp(
    `Hello ${SHOP.name}, the website could not take this order just now. Please could you price ` +
      `and confirm it:\n` +
      sellableLines
        .map((line) => `- ${line.quantity} x ${catalogue[line.sku]?.name ?? line.sku} (${line.sku})`)
        .join("\n") +
      (name.trim() ? `\nName: ${name.trim()}` : "") +
      (phone.trim() ? `\nPhone: ${phone.trim()}` : "") +
      (addressId === "collect"
        ? "\nCollecting at the counter."
        : street.trim() || area.trim()
          ? `\nDeliver to: ${[street.trim(), area.trim()].filter(Boolean).join(", ")}`
          : ""),
  )

  if (placed) {
    return (
      <div className="border border-rule p-8">
        <p className="callout">Order {placed.reference}</p>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">
          That is with the counter.
        </h2>
        <p className="mt-3 max-w-lg leading-relaxed text-slate">
          {settlement === "MPESA"
            ? "We will confirm the delivery charge and send an M-Pesa request for the total."
            : settlement === "PROFORMA"
              ? "We will send a proforma invoice with the delivery charge on it, for bank transfer."
              : `Collect at ${SHOP.street}, ${SHOP.area}, and pay at the counter.`}
        </p>
        <p className="mt-5 font-mono text-lg text-ink">{price(placed.totalKes)}</p>
        <p className="mt-1 text-sm text-slate">Before delivery, which we confirm.</p>

        {!signedIn && (
          <p className="mt-5 border-l-2 border-brass bg-brass-soft px-3 py-2 text-sm leading-relaxed text-ink">
            Keep that reference. It and your phone number are how we find this order: look it up
            any time at <Link href="/orders" className="underline underline-offset-2">Find your
            order</Link>, or quote it if you call. Opening an account keeps it for you.
          </p>
        )}

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={signedIn ? "/account/orders" : "/auth/register"}
            className="bg-terra px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terra-deep"
          >
            {signedIn ? "See it on your account" : "Open an account"}
          </Link>
          <Link
            href="/shop"
            className="border border-rule px-6 py-2.5 text-sm text-ink transition-colors hover:border-brass hover:text-brass"
          >
            Keep shopping
          </Link>
        </div>
      </div>
    )
  }

  if (cart.lines.length === 0) {
    return (
      <Empty title="Nothing to check out">
        <p>Your basket is empty.</p>
        <Link
          href="/shop"
          className="mt-5 inline-block bg-terra px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terra-deep"
        >
          Shop the range
        </Link>
      </Empty>
    )
  }

  const ways: { value: Settlement; label: string; hint: string }[] = [
    { value: "MPESA", label: "M-Pesa", hint: "We send a request for the confirmed total" },
    ...(trade
      ? [
          {
            value: "PROFORMA" as Settlement,
            label: "Proforma invoice",
            hint: "For bank transfer against your account",
          },
        ]
      : []),
    { value: "COUNTER", label: "Pay on collection", hint: `At ${SHOP.street}, ${SHOP.area}` },
  ]

  return (
    <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div>
        <fieldset>
          <legend className="callout">How you would like to pay</legend>
          <div className="mt-3 space-y-2">
            {ways.map((way) => (
              <label
                key={way.value}
                className={`flex cursor-pointer items-baseline gap-3 border p-4 transition-colors ${
                  settlement === way.value ? "border-ink" : "border-rule hover:border-brass"
                }`}
              >
                <input
                  type="radio"
                  name="settlement"
                  value={way.value}
                  checked={settlement === way.value}
                  onChange={() => setSettlement(way.value)}
                  className="mt-1 accent-oxblood"
                />
                <span>
                  <span className="block font-medium text-ink">{way.label}</span>
                  <span className="mt-0.5 block text-sm text-slate">{way.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-8">
          <legend className="callout">Where it is going</legend>
          <div className="mt-3 space-y-2">
            {addresses.map((address) => (
              <label
                key={address.id}
                className={`flex cursor-pointer items-baseline gap-3 border p-4 transition-colors ${
                  addressId === address.id ? "border-ink" : "border-rule hover:border-brass"
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={addressId === address.id}
                  onChange={() => setAddressId(address.id)}
                  className="mt-1 accent-oxblood"
                />
                <span className="min-w-0">
                  <span className="block font-medium text-ink">{address.label}</span>
                  <span className="mt-0.5 block text-sm text-slate">
                    {address.recipient}, {address.line}, {address.area}
                  </span>
                </span>
              </label>
            ))}
            <label
              className={`flex cursor-pointer items-baseline gap-3 border p-4 transition-colors ${
                addressId === "collect" ? "border-ink" : "border-rule hover:border-brass"
              }`}
            >
              <input
                type="radio"
                name="address"
                checked={addressId === "collect"}
                onChange={() => setAddressId("collect")}
                className="mt-1 accent-oxblood"
              />
              <span>
                <span className="block font-medium text-ink">Collect at the counter</span>
                <span className="mt-0.5 block text-sm text-slate">
                  {SHOP.street}, {SHOP.area}
                </span>
              </span>
            </label>
          </div>
          {signedIn && (
            <p className="mt-3 text-sm text-slate">
              <Link
                href="/account/addresses"
                className="text-oxblood underline underline-offset-4"
              >
                Manage your addresses
              </Link>
            </p>
          )}
        </fieldset>

        {/* A guest types the details a signed in customer picks from a saved
            book. Only the two the shop cannot do without are required: a name
            to hand it to and a number to call. */}
        {!signedIn && (
          <fieldset className="mt-8">
            <legend className="callout">Who we are delivering to</legend>
            <div className="mt-3 grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="callout">Your name</span>
                <input
                  required
                  maxLength={160}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={RULE}
                  disabled={busy}
                />
              </label>
              <label className="block">
                <span className="callout">Email</span>
                <input
                  type="email"
                  maxLength={320}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="For the receipt. Optional."
                  className={RULE}
                  disabled={busy}
                />
              </label>
              {addressId !== "collect" && (
                <>
                  <label className="block">
                    <span className="callout">Street or building</span>
                    <input
                      maxLength={200}
                      value={street}
                      onChange={(event) => setStreet(event.target.value)}
                      className={RULE}
                      disabled={busy}
                    />
                  </label>
                  <label className="block">
                    <span className="callout">Estate or area</span>
                    <input
                      maxLength={120}
                      value={area}
                      onChange={(event) => setArea(event.target.value)}
                      className={RULE}
                      disabled={busy}
                    />
                  </label>
                </>
              )}
            </div>
          </fieldset>
        )}

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="callout">Phone for this order</span>
            <input
              type="tel"
              // The one thing the counter cannot confirm an order without, so a
              // guest has to give it. A signed in customer already has one on
              // the address they picked.
              required={!signedIn}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="07xx xxx xxx"
              className={RULE}
              disabled={busy}
            />
          </label>
          <label className="block">
            <span className="callout">Anything we should know</span>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Cut the track to 3.4 m"
              className={RULE}
              disabled={busy}
            />
          </label>
        </div>
      </div>

      <aside className="border border-rule p-6 lg:sticky lg:top-6">
        <h2 className="callout">Your order</h2>
        <ul className="mt-4 border-t border-rule">
          {sellableLines.map((line) => {
            const part = catalogue[line.sku]
            return (
              <li key={line.sku} className="flex justify-between gap-3 border-b border-rule py-2.5">
                <span className="min-w-0 text-sm text-ink">
                  {part?.name}
                  <span className="ml-2 font-mono text-xs text-mute">x{line.quantity}</span>
                </span>
                <span className="shrink-0 font-mono text-xs text-slate">
                  {price(unit(line.sku) * line.quantity)}
                </span>
              </li>
            )
          })}
        </ul>

        <div className="mt-4 flex items-baseline justify-between">
          <span className="callout">Subtotal</span>
          <span className="font-mono text-lg text-ink">{price(subtotal)}</span>
        </div>
        {trade && (
          <p className="mt-1 text-xs text-slate">Priced at {ratePhrase(tier)}, on your account.</p>
        )}
        <p className="mt-2 text-xs leading-relaxed text-slate">
          Delivery is quoted by county and confirmed with your order. We confirm the final
          figure before anything is charged.
        </p>

        {down && (
          <div className="mt-4 border-l-2 border-brass bg-brass-soft px-3 py-3">
            <p className="text-sm leading-relaxed text-ink">
              Nothing was ordered and nothing was charged. Send it to us on WhatsApp instead and
              we will price it and confirm: the message already has your basket in it, so there is
              nothing to type again.
            </p>
            <Button href={handover} variant="whatsapp" className="mt-3">
              <WhatsAppIcon />
              Send this order on WhatsApp
            </Button>
          </div>
        )}

        {problems.length > 0 && (
          <ul role="alert" className="mt-4 space-y-2">
            {problems.map((problem) => (
              <li
                key={problem}
                className="border-l-2 border-oxblood bg-oxblood/5 px-3 py-2 text-sm leading-relaxed text-ink"
              >
                {problem}
              </li>
            ))}
          </ul>
        )}

        <button
          type="submit"
          disabled={busy || sellableLines.length === 0}
          className="mt-6 w-full bg-terra px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-terra-deep disabled:cursor-not-allowed disabled:opacity-55"
        >
          {busy ? "Placing your order" : "Place the order"}
        </button>
        <p className="mt-3 text-xs leading-relaxed text-mute">
          Nothing is charged until we confirm the total with you.
        </p>
      </aside>
    </form>
  )
}
