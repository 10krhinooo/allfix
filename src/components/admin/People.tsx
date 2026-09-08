"use client"

import { useState, useTransition } from "react"
import { Card, CardHeader, EmptyState, Pill } from "@/components/admin/parts"
import { useFades } from "@/lib/notice"
import type { Account, Changed, Tier } from "@/lib/admin/people-service"

/**
 * Who gets in, and as what.
 *
 * This screen was a poster. It listed the roster and said, correctly, that
 * granting a role happened somewhere else, because there was nowhere else: no
 * endpoint set a role or a tier, so the only way to make somebody a trade
 * customer was a SQL update against production. The shop advertises a trade
 * account in the strip above every page and hands the application off to
 * WhatsApp, which nobody could then act on.
 *
 * Every rule is the service's and every refusal is shown in the service's own
 * words. A console that invented its own wording for "this is the only
 * administrator left" would drift from the rule the moment either changed, and
 * the person reading it would be told something that is no longer true.
 */

/** The roles an owner may hand out. Platform access is not among them. */
const ROLES = [
  { code: "ADMIN", label: "Owner", note: "Everything, including this screen." },
  { code: "STAFF", label: "Counter", note: "Prices, orders, the shelf and enquiries." },
  { code: "TRADE", label: "Trade", note: "Buys at the shop's advertised rate." },
] as const

export function People({
  accounts,
  tiers,
  live,
  onGrant,
  onTier,
  onSuspend,
}: {
  accounts: Account[]
  tiers: Tier[]
  /** False when nobody could be asked, which means nothing here can be changed. */
  live: boolean
  onGrant: (id: string, role: string, granted: boolean) => Promise<Changed>
  onTier: (id: string, code: string | null) => Promise<Changed>
  onSuspend: (id: string, suspended: boolean) => Promise<Changed>
}) {
  const [problem, setProblem] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [busy, start] = useTransition()

  // Confirmations take themselves away and refusals do not, which is the rule
  // this console already follows: a refusal is something somebody has to read.
  useFades(done !== null, () => setDone(null))

  function run(what: string, action: () => Promise<Changed>) {
    setProblem(null)
    start(async () => {
      const answer = await action()
      if (answer.ok) setDone(what)
      else setProblem(answer.message)
    })
  }

  if (accounts.length === 0) {
    return <EmptyState title="Nobody yet" body="Accounts appear here as people register." />
  }

  return (
    <>
      {problem && (
        <div
          role="alert"
          className="mb-4 border-l-2 border-oxblood bg-oxblood/5 px-4 py-3 text-sm leading-relaxed text-ink"
        >
          {problem}
        </div>
      )}
      <p role="status" className="callout mb-4 block h-4">
        {done ?? ""}
      </p>

      <div className="space-y-4">
        {accounts.map((account) => (
          <Card key={account.email}>
            <CardHeader
              title={account.name}
              hint={account.email}
              action={
                account.status === "SUSPENDED" ? (
                  <Pill tone="todo">Suspended</Pill>
                ) : account.emailVerified ? (
                  <Pill tone="quiet">Active</Pill>
                ) : (
                  <Pill tone="waiting">Not verified</Pill>
                )
              }
            />

            {/* Wraps on a phone rather than scrolling, because these are
                controls: something you cannot see is something you cannot
                press, and a row of switches is not a table of figures. */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {ROLES.map((role) => {
                const held = account.roles.includes(role.code)
                return (
                  <button
                    key={role.code}
                    type="button"
                    disabled={!live || busy}
                    aria-pressed={held}
                    title={role.note}
                    onClick={() =>
                      run(
                        held
                          ? `${role.label} taken from ${account.name}`
                          : `${role.label} given to ${account.name}`,
                        () => onGrant(account.id, role.code, !held),
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
                      held
                        ? "border-ink bg-ink text-paper"
                        : "border-rule text-slate hover:border-ink hover:text-ink"
                    }`}
                  >
                    {role.label}
                  </button>
                )
              })}

              <span className="ml-auto flex items-center gap-2">
                {account.roles.includes("TRADE") && (
                  <label className="flex items-center gap-2">
                    <span className="callout">Rate</span>
                    <select
                      disabled={!live || busy}
                      value={account.tier ?? ""}
                      onChange={(event) =>
                        run(
                          `${account.name} moved to ${event.target.value || "no tier"}`,
                          () => onTier(account.id, event.target.value || null),
                        )
                      }
                      className="rounded-sm border border-rule bg-paper px-2 py-1 text-xs outline-none focus:border-ink disabled:opacity-55"
                    >
                      <option value="">No tier</option>
                      {tiers.map((each) => (
                        <option key={each.code} value={each.code}>
                          {each.name}, {Math.round(each.discountRate * 100)}% off
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <button
                  type="button"
                  disabled={!live || busy}
                  onClick={() =>
                    run(
                      account.status === "SUSPENDED"
                        ? `${account.name} let back in`
                        : `${account.name} suspended`,
                      () => onSuspend(account.id, account.status !== "SUSPENDED"),
                    )
                  }
                  className="rounded-sm border border-oxblood px-3 py-1 text-xs font-medium text-oxblood transition-colors hover:bg-oxblood hover:text-white disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {account.status === "SUSPENDED" ? "Let back in" : "Suspend"}
                </button>
              </span>
            </div>

            {account.tradeRate !== null && (
              <p className="mt-3 text-xs text-slate">
                Buys at {Math.round(account.tradeRate * 100)}% off list, on every part.
              </p>
            )}
          </Card>
        ))}
      </div>
    </>
  )
}
