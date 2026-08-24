"use client"

import { useState } from "react"
import type { Address } from "@/lib/account"
import { useBook, saveAddress, removeAddress, makeDefault, type Seed } from "@/lib/account-book"
import { Card, CardHeader, EmptyState, Note, Pill } from "@/components/admin/parts"

/**
 * The delivery book.
 *
 * A label rather than an address is what the list leads on, because that is how
 * somebody picks one at checkout: "Home", not "Mwiki Road, Sunton". Directions
 * get their own field and are not optional decoration in Nairobi, where a gate
 * colour and a landmark find a house that a plot number does not.
 */

const RULE =
  "mt-2 w-full border-0 border-b border-rule bg-transparent px-0 py-2 text-sm text-ink " +
  "outline-none transition-colors placeholder:text-mute focus:border-ink"

const BLANK: Omit<Address, "id"> = {
  label: "",
  recipient: "",
  phone: "",
  line: "",
  area: "",
  town: "Nairobi",
  directions: null,
  isDefault: false,
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="callout">{label}</span>
      {children}
    </label>
  )
}

export function Addresses({ seed }: { seed: Seed }) {
  const book = useBook(seed)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<Omit<Address, "id"> | null>(null)

  function start(address?: Address) {
    setEditing(address?.id ?? "new")
    setDraft(address ? { ...address } : { ...BLANK, isDefault: book.addresses.length === 0 })
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!draft) return
    saveAddress(seed, draft, editing === "new" ? undefined : (editing ?? undefined))
    setEditing(null)
    setDraft(null)
  }

  return (
    <>
      {book.addresses.length === 0 && !draft ? (
        <EmptyState
          title="No addresses yet"
          body="Add one and checkout will already know where your order is going."
        />
      ) : (
        <div className="space-y-4">
          {book.addresses.map((address) => (
            <Card key={address.id}>
              <CardHeader
                title={address.label}
                hint={address.recipient}
                action={address.isDefault ? <Pill tone="waiting">Default</Pill> : undefined}
              />
              <address className="mt-4 text-sm not-italic leading-relaxed text-slate">
                {address.line}, {address.area}
                <br />
                {address.town}
                <br />
                <span className="font-mono text-xs">{address.phone}</span>
                {address.directions && (
                  <>
                    <br />
                    <span className="text-xs">{address.directions}</span>
                  </>
                )}
              </address>
              <div className="mt-4 flex flex-wrap gap-4 border-t border-rule pt-3">
                <button type="button" onClick={() => start(address)} className="callout hover:text-ink">
                  Edit
                </button>
                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() => makeDefault(seed, address.id)}
                    className="callout hover:text-ink"
                  >
                    Make default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeAddress(seed, address.id)}
                  className="callout ml-auto text-oxblood hover:text-oxblood-deep"
                >
                  Remove
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {draft ? (
        <form onSubmit={submit} className="mt-6 border border-rule p-6">
          <h2 className="font-display text-lg font-semibold">
            {editing === "new" ? "A new address" : "Edit this address"}
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="What you call it">
              <input
                required
                autoFocus
                maxLength={60}
                value={draft.label}
                onChange={(event) => setDraft({ ...draft, label: event.target.value })}
                placeholder="Home"
                className={RULE}
              />
            </Field>
            <Field label="Who receives it">
              <input
                required
                maxLength={160}
                value={draft.recipient}
                onChange={(event) => setDraft({ ...draft, recipient: event.target.value })}
                className={RULE}
              />
            </Field>
            <Field label="Phone">
              <input
                required
                type="tel"
                maxLength={32}
                value={draft.phone}
                onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
                placeholder="07xx xxx xxx"
                className={RULE}
              />
            </Field>
            <Field label="Street or building">
              <input
                required
                maxLength={200}
                value={draft.line}
                onChange={(event) => setDraft({ ...draft, line: event.target.value })}
                className={RULE}
              />
            </Field>
            <Field label="Estate or area">
              <input
                required
                maxLength={120}
                value={draft.area}
                onChange={(event) => setDraft({ ...draft, area: event.target.value })}
                className={RULE}
              />
            </Field>
            <Field label="Town">
              <input
                maxLength={120}
                value={draft.town}
                onChange={(event) => setDraft({ ...draft, town: event.target.value })}
                className={RULE}
              />
            </Field>
          </div>

          <div className="mt-5">
            <Field label="How the rider finds it">
              <textarea
                rows={2}
                maxLength={2000}
                value={draft.directions ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, directions: event.target.value || null })
                }
                placeholder="Green gate opposite the chemist, second house after the borehole."
                className={RULE}
              />
            </Field>
          </div>

          <label className="mt-5 flex items-center gap-3">
            <input
              type="checkbox"
              checked={draft.isDefault}
              onChange={(event) => setDraft({ ...draft, isDefault: event.target.checked })}
              className="h-4 w-4 accent-oxblood"
            />
            <span className="text-sm text-slate">Deliver here unless I say otherwise</span>
          </label>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              className="bg-oxblood px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
            >
              Save address
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null)
                setDraft(null)
              }}
              className="border border-rule px-6 py-2.5 text-sm text-slate transition-colors hover:border-ink hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => start()}
          className="mt-6 border border-rule px-6 py-2.5 text-sm text-ink transition-colors hover:border-brass hover:text-brass"
        >
          Add an address
        </button>
      )}

      <div className="mt-8">
        <Note>
          The default is the one checkout reaches for. Directions matter more than a plot number
          here, so say what the rider should look for.
        </Note>
      </div>
    </>
  )
}
