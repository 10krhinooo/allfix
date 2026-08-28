"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PartForm, type PartFormValues } from "@/components/admin/PartForm"
import { Card, CardHeader, Note } from "@/components/admin/parts"
import type { PartEdit, Saved } from "@/lib/admin/catalogue-api"

/**
 * One part, and the two ways it can leave the catalogue.
 *
 * They are not alternatives and the screen should not present them as a pair of
 * buttons. Retiring is the ordinary thing and it is reversible: the part goes
 * from the shop and stays on every order that carried it. Deleting is for a code
 * that was never real, it cannot be undone, and the service refuses it the
 * moment anything has been sold under the code, which is what actually keeps it
 * safe. So retiring sits with the part and deleting sits below a rule, in the
 * owner's half of the screen, with the refusal shown as the service words it.
 */
export function PartScreen({
  part,
  prefixes,
  owner,
  onSave,
  onRetire,
  onRestore,
  onRemove,
}: {
  part: PartFormValues & { slug: string; retiredAt?: string | null }
  prefixes: { rails: string[]; rods: string[] }
  owner: boolean
  onSave: (slug: string, values: PartEdit) => Promise<Saved>
  onRetire: (slug: string) => Promise<Saved>
  onRestore: (slug: string) => Promise<Saved>
  onRemove: (slug: string) => Promise<Saved>
}) {
  const router = useRouter()
  const [busy, start] = useTransition()
  const [problem, setProblem] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const retired = Boolean(part.retiredAt)

  function run(action: () => Promise<Saved>, thenGo?: string) {
    setProblem(null)
    start(async () => {
      const answer = await action()
      if (!answer.ok) {
        setProblem(answer.message)
        return
      }
      if (thenGo) router.push(thenGo)
      else router.refresh()
    })
  }

  return (
    <>
      <PartForm
        part={part}
        prefixes={prefixes}
        onSave={(values) => onSave(part.slug, values)}
      />

      <div className="mt-10 space-y-4">
        <Card>
          <CardHeader
            title={retired ? "This part is retired" : "Stop selling this"}
            hint={
              retired
                ? "It is off the shop and out of the configurator, and still on every order that carried it."
                : "It leaves the shop, its own page and the parts a system offers. It stays on every order that carried it, and you can put it back."
            }
            action={
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  run(() => (retired ? onRestore(part.slug) : onRetire(part.slug)))
                }
                className="rounded-sm border border-ink px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-55"
              >
                {retired ? "Sell it again" : "Retire it"}
              </button>
            }
          />
        </Card>

        {owner && (
          <Card>
            <CardHeader
              title="Remove it altogether"
              hint="For a code typed in by mistake. It cannot be undone, and it takes the part's price history and shelf record with it. Anything ever sold under this code is refused."
              action={
                confirming ? (
                  <span className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => onRemove(part.slug), "/admin/parts")}
                      className="rounded-sm bg-oxblood px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-oxblood-deep disabled:opacity-55"
                    >
                      {busy ? "Removing" : "Yes, remove it"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(false)}
                      className="text-xs font-medium text-slate hover:text-ink"
                    >
                      Keep it
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="rounded-sm border border-oxblood px-4 py-2 text-xs font-medium text-oxblood transition-colors hover:bg-oxblood hover:text-white"
                  >
                    Remove
                  </button>
                )
              }
            />
          </Card>
        )}

        {problem && (
          <Note tone="warn">
            <span role="alert">{problem}</span>
          </Note>
        )}
      </div>
    </>
  )
}
