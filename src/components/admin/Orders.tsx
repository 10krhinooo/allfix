"use client"

import { useMemo, useState, useTransition } from "react"
import { OrderCard } from "@/components/orders/OrderCard"
import {
  Blank,
  Card,
  Choices,
  EmptyState,
  Note,
  PageHead,
  Pill,
  Stat,
  Stats,
  Toolbar,
} from "@/components/admin/parts"
import { price } from "@/lib/format"
import { ORDER_FLOW, ORDER_STAGE, type OrderStage } from "@/lib/orders"
import { CHANNEL_LABEL, type Channel, type DeskOrder } from "@/lib/admin/orders-service"

/**
 * Every order the shop has, on one screen.
 *
 * It could not be one screen before, because most of the shop's orders were not
 * in the system at all: the only way one got recorded was the storefront's own
 * checkout, so the counter, the WhatsApp threads and the phone all went into a
 * paper book. "Where is that order" was a question with two places to look and
 * one of them was a book.
 *
 * So the channel is on the card and it filters, because that is the first thing
 * somebody at the counter needs to narrow by: a customer on the phone asking
 * about the order they placed on WhatsApp is not asking about the website.
 */

type Show = "open" | "all" | "packing" | "dispatched" | "done"

const SHOWS: { value: Show; label: string }[] = [
  { value: "open", label: "To do" },
  { value: "packing", label: "Packing" },
  { value: "dispatched", label: "On the way" },
  { value: "done", label: "Finished" },
  { value: "all", label: "All" },
]

/** Finished means nobody has to do anything: it is collected, or it is cancelled. */
function finished(order: DeskOrder) {
  return order.stage === "collected" || order.stage === "cancelled"
}

export function Orders({
  orders,
  onMove,
}: {
  orders: DeskOrder[] | null
  onMove: (reference: string, stage: OrderStage) => Promise<{ ok: boolean; message?: string }>
}) {
  const [show, setShow] = useState<Show>("open")
  const [channel, setChannel] = useState<Channel | "any">("any")
  const [busy, start] = useTransition()
  const [problem, setProblem] = useState<string | null>(null)

  // Its own memo, because `orders ?? []` builds a new array on every render and
  // the filter below depends on it, so the filter would never be reused.
  const all = useMemo(() => orders ?? [], [orders])

  const visible = useMemo(
    () =>
      all.filter((order) => {
        if (channel !== "any" && order.channel !== channel) return false
        if (show === "all") return true
        if (show === "done") return finished(order)
        if (show === "open") return !finished(order)
        return order.stage === show
      }),
    [all, show, channel],
  )

  const open = all.filter((order) => !finished(order))
  const online = all.filter((order) => order.channel === "online").length

  if (!orders) {
    return (
      <>
        <PageHead title="Orders" lead="Every order the shop has, however it arrived." />
        <EmptyState
          title="No order service is reachable"
          body="Orders are kept by the shop's own records rather than in this browser, so there is nothing to show until it answers. Anything taken meanwhile goes in the book."
        />
      </>
    )
  }

  function move(reference: string, stage: OrderStage) {
    setProblem(null)
    start(async () => {
      const answer = await onMove(reference, stage)
      if (!answer.ok) setProblem(answer.message ?? "That order could not be moved.")
    })
  }

  return (
    <>
      <PageHead title="Orders" lead="Every order the shop has, however it arrived.">
        <Note>
          {all.length - online} of these were taken by somebody here rather than placed on the
          site. Before there was a way to key one in they were only in the book.
        </Note>
      </PageHead>

      <Stats>
        <Stat label="Still to do" value={open.length} accent={open.length > 0} />
        <Stat
          label="Being packed"
          value={all.filter((order) => order.stage === "packing").length}
          hint="Pulled and going in a bag."
        />
        <Stat
          label="On the way"
          value={all.filter((order) => order.stage === "dispatched").length}
          hint="Out for delivery, not yet with the customer."
        />
        <Stat label="Through the site" value={online} hint="The rest came in by hand." />
      </Stats>

      <Toolbar>
        <Choices label="Show" options={SHOWS} value={show} onChange={setShow} />
        <div className="sm:ml-auto">
          <label className="flex items-center gap-2">
            <span className="callout">Came in by</span>
            <select
              value={channel}
              onChange={(event) => setChannel(event.target.value as Channel | "any")}
              className="rounded-sm border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
            >
              <option value="any">Any way</option>
              {(Object.keys(CHANNEL_LABEL) as Channel[]).map((id) => (
                <option key={id} value={id}>
                  {CHANNEL_LABEL[id]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p aria-live="polite" className="text-xs text-slate">
          {visible.length} of {all.length} orders
        </p>
      </Toolbar>

      {problem && (
        <div className="mb-4">
          <Card>
            <p role="alert" className="text-sm text-oxblood">
              {problem}
            </p>
          </Card>
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState
          title="Nothing matches"
          body="Widen the filters above, or take an order that came in another way."
        />
      ) : (
        <ul className="space-y-4">
          {visible.map((order) => (
            <li key={order.reference}>
              <OrderCard
                order={order}
                meta={
                  <div className="space-y-3 border-t border-rule pt-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      <Pill tone={order.channel === "online" ? "quiet" : "waiting"}>
                        {CHANNEL_LABEL[order.channel]}
                      </Pill>
                      <span className="text-ink">{order.customer ?? "Not named"}</span>
                      {order.customerPhone && (
                        <a
                          href={`tel:${order.customerPhone.replace(/\s/g, "")}`}
                          className="font-mono text-xs text-oxblood hover:underline"
                        >
                          {order.customerPhone}
                        </a>
                      )}
                      <span className="ml-auto font-mono text-sm">
                        {price(order.totalKes, "each") ?? <Blank />}
                      </span>
                    </div>

                    {(order.takenBy || order.deliverTo) && (
                      <p className="text-xs leading-relaxed text-slate">
                        {order.takenBy && <>Taken by {order.takenBy}. </>}
                        {order.deliverTo ? <>Deliver to {order.deliverTo}.</> : <>For collection.</>}
                      </p>
                    )}

                    {!finished(order) && (
                      <div className="flex flex-wrap gap-2">
                        {onward(order.stage).map((next) => (
                          <button
                            key={next}
                            type="button"
                            disabled={busy}
                            onClick={() => move(order.reference, next)}
                            className="rounded-sm border border-rule px-4 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-brass-soft disabled:opacity-55"
                          >
                            {ORDER_STAGE[next]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

/**
 * Where an order may go next.
 *
 * A copy of the service's own table, and a deliberately loose one: it decides
 * which buttons to draw, and the service decides whether a move is allowed. If
 * the two disagree the service wins and says so in words, which is why a refusal
 * is shown rather than translated. Drawing a button the service will refuse is a
 * small annoyance; hiding one it would have allowed is work nobody can do.
 */
function onward(stage: OrderStage): OrderStage[] {
  switch (stage) {
    case "placed":
      return ["packing", "cancelled"]
    case "packing":
      return ["dispatched", "collected", "cancelled"]
    case "dispatched":
      return ["collected"]
    default:
      return []
  }
}

export { ORDER_FLOW }
