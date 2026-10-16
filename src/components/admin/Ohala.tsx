"use client"

import { useState, useTransition } from "react"
import { Note, Pill, Section, Table, Td, Th } from "@/components/admin/parts"
import type { OhalaEvent, OhalaState } from "@/lib/admin/ohala-service"

/**
 * Whether the back office is being told anything.
 *
 * Two questions, and the panel exists to answer both: is anything being sent,
 * and is anything stuck. A green tick on its own would be green on a shop whose
 * orders had not reached the accounts for a week.
 *
 * The distinction it draws hardest is between a link that is idle and a link
 * that was never configured. Nothing waiting is good news when a gateway is
 * ready and means nothing at all when there is nowhere to send, and a panel
 * that showed a zero for both would be reassuring in exactly the wrong case.
 */

const WHAT: Record<string, string> = {
  none: "Nothing is configured, so nothing is being sent.",
  file: "Dated CSV batches, for uploading into Ohala's own importers.",
  api: "Ohala's own API, server to server.",
}

/** What an event is about, in the counter's words rather than the enum's. */
const KIND: Record<string, string> = {
  ORDER_PLACED: "Order placed",
  ORDER_MOVED: "Order moved",
  PAYMENT_RECEIVED: "Payment received",
  STOCK_COUNTED: "Shelf counted",
  CUSTOMER_REGISTERED: "Customer registered",
  PRODUCT_SAVED: "Part saved",
  PRICE_CHANGED: "Price changed",
}

function when(stamp: string | null): string {
  if (!stamp) return "never"
  return new Date(stamp).toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function Ohala({
  state,
  onRetry,
}: {
  /** Null where no console service could be asked, which is not an empty queue. */
  state: OhalaState | null
  onRetry: (id: number) => Promise<{ ok: boolean; message?: string }>
}) {
  if (!state) {
    return (
      <Section title="Ohala">
        <div className="p-4">
          <Note tone="warn">
            No console service is reachable, so there is nothing to say about the back office
            link. This is not the same as nothing being sent.
          </Note>
        </div>
      </Section>
    )
  }

  const waiting = state.counts.PENDING ?? 0
  const sent = state.counts.SENT ?? 0
  const failed = state.counts.FAILED ?? 0

  return (
    <Section title="Ohala">
      <div className="space-y-5 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Pill tone={state.ready ? "waiting" : "quiet"}>{state.gateway}</Pill>
          {/* The two only differ on a typo, and a typo here is a shop that
              believes its orders are being sent and they are not. */}
          {state.asked !== state.gateway && (
            <Pill tone="todo">set to &ldquo;{state.asked}&rdquo;</Pill>
          )}
          <span className="text-xs leading-relaxed text-slate">
            {WHAT[state.gateway] ?? "An unrecognised gateway, so nothing is being sent."}
          </span>
        </div>

        <dl className="flex flex-wrap gap-x-10 gap-y-3">
          {[
            ["Waiting", String(waiting)],
            ["Sent", String(sent)],
            ["Given up", String(failed)],
            ["Last sent", when(state.lastSent)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="callout">{label}</dt>
              <dd className="mt-1 font-mono text-lg text-ink">{value}</dd>
            </div>
          ))}
        </dl>

        {!state.ready && (
          <Note>
            {waiting === 0
              ? "Nothing has happened yet that Ohala would be told about. Once something does, it is kept here until a gateway is configured."
              : `${waiting} ${waiting === 1 ? "event is" : "events are"} kept and will go in the order they happened, as soon as a gateway is configured. Nothing has been lost.`}
          </Note>
        )}

        {state.ready && failed === 0 && waiting === 0 && (
          <Note>Everything that has happened has been sent.</Note>
        )}

        {state.failed.length > 0 && <Failures events={state.failed} onRetry={onRetry} />}
      </div>
    </Section>
  )
}

function Failures({
  events,
  onRetry,
}: {
  events: OhalaEvent[]
  onRetry: (id: number) => Promise<{ ok: boolean; message?: string }>
}) {
  const [problem, setProblem] = useState<string | null>(null)
  const [done, setDone] = useState<number[]>([])
  const [busy, start] = useTransition()

  return (
    <div>
      <h3 className="callout">Given up on</h3>
      <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate">
        These stopped being retried. Fix what the reason names, then put them back in the
        queue: they go at once rather than at the back of an hour of waiting.
      </p>

      <div className="mt-3">
        <Table>
          <thead>
            <tr>
              <Th>What</Th>
              <Th>Reference</Th>
              <Th>Why it stopped</Th>
              <Th>{""}</Th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <Td>{KIND[event.event] ?? event.event}</Td>
                <Td>
                  <span className="font-mono text-xs">{event.subject}</span>
                </Td>
                <Td>
                  <span className="text-xs leading-relaxed text-slate">
                    {event.lastError ?? "No reason was recorded."}
                  </span>
                </Td>
                <Td>
                  {done.includes(event.id) ? (
                    <span className="text-xs text-slate">Back in the queue</span>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        start(async () => {
                          setProblem(null)
                          const answer = await onRetry(event.id)
                          if (answer.ok) setDone((old) => [...old, event.id])
                          else setProblem(answer.message ?? "That could not be put back.")
                        })
                      }
                      className="text-xs text-oxblood underline underline-offset-2 hover:no-underline disabled:opacity-55"
                    >
                      Try again
                    </button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {problem && (
        <div className="mt-3" role="alert">
          <Note tone="warn">{problem}</Note>
        </div>
      )}
    </div>
  )
}
