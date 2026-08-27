"use client"

import { useMemo, useState, useTransition } from "react"
import { Card, CardHeader, Choices, Note } from "@/components/admin/parts"
import { price } from "@/lib/format"
import { CHANNELS, type Channel, type TakeOrder } from "@/lib/admin/orders-service"
import type { OrderablePart } from "@/lib/admin/rows"

/**
 * Writing down an order that did not come through the website.
 *
 * Most of this shop's orders. Somebody rings up, or messages, or walks in, and
 * until now the only place that went was a book: the counter screen could not
 * record it, so the system's idea of "every order" was the minority placed
 * online and the two never met.
 *
 * The shape follows the trade desk's quote builder rather than inventing
 * another: search a part, add it, adjust the quantity, and adding the same part
 * twice moves the quantity rather than making a second line, because somebody
 * reading a list down a phone will say a part twice.
 *
 * No total is sent. The figure below is what the shop will charge, worked out
 * from the same list prices the shop quotes, but the service prices the order
 * itself from the parts and the quantities and resolves the tier from whichever
 * account the address belongs to. A counter can no more type in a number it
 * likes than a browser can, which is the whole reason there is no price field.
 */

const FIELD =
  "mt-1.5 w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ink"

interface Line {
  sku: string
  name: string
  quantity: number
  priceKes: number
  basis: OrderablePart["basis"]
}

export function TakeOrderForm({
  parts,
  onTake,
}: {
  parts: OrderablePart[]
  onTake: (order: TakeOrder) => Promise<{ ok: boolean; message?: string; problems?: string[] }>
}) {
  const [open, setOpen] = useState(false)
  const [channel, setChannel] = useState<Channel>("whatsapp")
  const [lines, setLines] = useState<Line[]>([])
  const [search, setSearch] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [deliverTo, setDeliverTo] = useState("")
  const [note, setNote] = useState("")
  const [busy, start] = useTransition()
  const [answer, setAnswer] = useState<{ ok: boolean; message: string } | null>(null)

  const found = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (needle.length < 2) return []
    return parts
      .filter(
        (part) =>
          part.name.toLowerCase().includes(needle) || part.sku.toLowerCase().includes(needle),
      )
      .slice(0, 6)
  }, [parts, search])

  const total = lines.reduce((sum, line) => sum + line.priceKes * line.quantity, 0)

  function add(part: OrderablePart) {
    setLines((current) => {
      const already = current.find((line) => line.sku === part.sku)
      // Somebody reading a list down a phone says a part twice. That is one more
      // of it, not a second line saying the same thing.
      if (already) {
        return current.map((line) =>
          line.sku === part.sku ? { ...line, quantity: line.quantity + 1 } : line,
        )
      }
      return [
        ...current,
        { sku: part.sku, name: part.name, quantity: 1, priceKes: part.priceKes, basis: part.basis },
      ]
    })
    setSearch("")
  }

  function submit() {
    setAnswer(null)
    start(async () => {
      const result = await onTake({
        lines: lines.map((line) => ({ sku: line.sku, quantity: line.quantity })),
        settlement: "COUNTER",
        channel,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        deliverTo: deliverTo.trim() || null,
        note: note.trim() || null,
      })

      if (result.ok) {
        setAnswer({ ok: true, message: "Written down. It is in the list above." })
        setLines([])
        setName("")
        setPhone("")
        setEmail("")
        setDeliverTo("")
        setNote("")
        return
      }
      setAnswer({
        ok: false,
        message: [result.message, ...(result.problems ?? [])].filter(Boolean).join(" "),
      })
    })
  }

  const ready = lines.length > 0 && name.trim().length > 0 && phone.trim().length > 0

  if (!open) {
    return (
      <Card>
        <CardHeader
          title="Take an order"
          hint="For one that came in over the counter, on WhatsApp or by phone."
          action={
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-sm bg-oxblood px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-oxblood-deep"
            >
              Write one down
            </button>
          }
        />
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title="Take an order"
        hint="The shop prices it. Nothing here sets a figure."
        action={
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs font-medium text-slate hover:text-ink"
          >
            Close
          </button>
        }
      />

      <div className="space-y-6">
        <Choices
          label="Came in by"
          options={CHANNELS.map((entry) => ({ value: entry.id, label: entry.label }))}
          value={channel}
          onChange={setChannel}
        />

        <div>
          <label className="block">
            <span className="callout">Add a part</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name or SKU"
              className={FIELD}
            />
          </label>
          {found.length > 0 && (
            <ul className="mt-2 space-y-1">
              {found.map((part) => (
                <li key={part.sku}>
                  <button
                    type="button"
                    onClick={() => add(part)}
                    className="flex w-full items-center justify-between gap-4 rounded-sm border border-rule px-3 py-2 text-left text-sm transition-colors hover:bg-brass-soft"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-ink">{part.name}</span>
                      <span className="font-mono text-xs text-mute">
                        {part.sku} &middot; {part.group}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-xs">
                      {price(part.priceKes, part.basis)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <ul className="space-y-2">
            {lines.map((line) => (
              <li key={line.sku} className="flex items-center gap-3 border-b border-rule pb-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink">{line.name}</span>
                  <span className="font-mono text-xs text-mute">{line.sku}</span>
                </span>
                <label className="flex items-center gap-2">
                  <span className="sr-only">How many {line.name}</span>
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(event) =>
                      setLines((current) =>
                        current.map((entry) =>
                          entry.sku === line.sku
                            ? { ...entry, quantity: Math.max(1, Number(event.target.value) || 1) }
                            : entry,
                        ),
                      )
                    }
                    className="h-9 w-16 rounded-sm border border-rule bg-paper text-center font-mono text-sm outline-none focus:border-ink"
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setLines((current) => current.filter((entry) => entry.sku !== line.sku))
                  }
                  className="text-xs text-slate hover:text-oxblood"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <label className="block">
            <span className="callout">Who it is for</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={FIELD} />
          </label>
          <label className="block">
            <span className="callout">Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={FIELD} />
            <span className="mt-1.5 block text-xs leading-relaxed text-slate">
              What the counter rings back on. Required, the same as on the site.
            </span>
          </label>
          <label className="block">
            <span className="callout">Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className={FIELD} />
            <span className="mt-1.5 block text-xs leading-relaxed text-slate">
              Optional. An address that matches an account puts the order on it, so they see it
              when they sign in and pay their own rate.
            </span>
          </label>
          <label className="block">
            <span className="callout">Deliver to</span>
            <input
              value={deliverTo}
              onChange={(e) => setDeliverTo(e.target.value)}
              className={FIELD}
            />
            <span className="mt-1.5 block text-xs leading-relaxed text-slate">
              Leave empty for collection.
            </span>
          </label>
        </div>

        <label className="block">
          <span className="callout">Note</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className={FIELD}
          />
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            disabled={!ready || busy}
            onClick={submit}
            className="rounded-sm bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep disabled:cursor-not-allowed disabled:opacity-55"
          >
            {busy ? "Writing it down" : "Write it down"}
          </button>
          {lines.length > 0 && (
            <p className="text-sm text-slate">
              About <span className="font-mono text-ink">{price(total, "each")}</span> at list. The
              shop settles the figure.
            </p>
          )}
        </div>

        {answer && (
          <Note tone={answer.ok ? undefined : "warn"}>
            <span role={answer.ok ? "status" : "alert"}>{answer.message}</span>
          </Note>
        )}
      </div>
    </Card>
  )
}
