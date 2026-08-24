"use client"

import { useState } from "react"
import Link from "next/link"
import { saveProfile, useProfile, type Seed } from "@/lib/account-book"
import { SHOP } from "@/lib/format"
import { PageHead, Card, CardHeader, Note } from "@/components/admin/parts"
import { SignOutButton } from "@/components/admin/SignOutButton"

/**
 * A shopper's own details, and theirs to change.
 *
 * Not the counter's version of this screen. That one exists to answer "what
 * does my role let me do", which is a question somebody behind the counter has
 * and a customer does not: there is only one thing a customer's role lets them
 * do, which is shop, and printing a table of permissions they do not have is
 * telling them about a building they will never be in.
 *
 * It also drops the session note. At the counter, being honest that the cookie
 * is not revocable belongs on the screen where somebody would look for "sign
 * out everywhere" and not find it. A customer looking at their own address and
 * phone number is not that person, and the paragraph only worries them.
 *
 * Two fields, matching `PUT /api/me`. The email is the account's identity and
 * the address a reset link goes to, so changing one is a verification flow
 * rather than an edit, and it is shown but not editable here.
 */

const RULE =
  "mt-2 w-full border-0 border-b border-rule bg-transparent px-0 py-2 text-sm text-ink " +
  "outline-none transition-colors placeholder:text-mute focus:border-ink"

export function YourDetails({
  seed,
  email,
  name,
  phone,
}: {
  seed: Seed
  email: string
  name: string
  phone: string
}) {
  const profile = useProfile(seed, { name, phone })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(profile)
  const [saved, setSaved] = useState(false)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!draft.name.trim()) return
    saveProfile(seed, { name: draft.name.trim(), phone: draft.phone.trim() })
    setEditing(false)
    setSaved(true)
  }

  return (
    <>
      <PageHead title="Your details" lead="What we call you, and how we reach you about an order." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Your account"
            hint={saved && !editing ? "Saved" : undefined}
            action={
              editing ? undefined : (
                <button
                  type="button"
                  onClick={() => {
                    setDraft(profile)
                    setSaved(false)
                    setEditing(true)
                  }}
                  className="callout hover:text-ink"
                >
                  Edit
                </button>
              )
            }
          />

          {editing ? (
            <form onSubmit={submit} className="mt-4 space-y-5">
              <label className="block">
                <span className="callout">Name</span>
                <input
                  required
                  autoFocus
                  maxLength={120}
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  className={RULE}
                />
              </label>
              <label className="block">
                <span className="callout">Phone</span>
                <input
                  type="tel"
                  maxLength={32}
                  value={draft.phone}
                  onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
                  placeholder="07xx xxx xxx"
                  className={RULE}
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="bg-oxblood px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="border border-rule px-5 py-2.5 text-sm text-slate transition-colors hover:border-ink hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <dl className="divide-y divide-rule">
              <div className="flex items-baseline justify-between gap-4 py-3">
                <dt className="callout">Name</dt>
                <dd className="text-sm font-medium text-ink">{profile.name}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-3">
                <dt className="callout">Phone</dt>
                <dd className="font-mono text-xs text-slate">
                  {profile.phone || "Not given yet"}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-3">
                <dt className="callout">Email</dt>
                <dd className="min-w-0 truncate font-mono text-xs text-slate">{email}</dd>
              </div>
            </dl>
          )}
        </Card>

        <Card>
          <CardHeader title="Everything else" hint="Where the rest of it lives." />
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate">
            <li>
              <Link href="/account/addresses" className="text-ink hover:text-oxblood">
                Your addresses
              </Link>{" "}
              are where we deliver to, and checkout reaches for the default.
            </li>
            <li>
              <Link href="/account/orders" className="text-ink hover:text-oxblood">
                Your orders
              </Link>{" "}
              carry their own receipts and delivery notes.
            </li>
            <li>
              To change the email on this account, or if something is wrong we cannot fix from
              here, call the shop on{" "}
              <a href={`tel:${SHOP.phoneIntl}`} className="font-mono text-ink hover:underline">
                {SHOP.phone}
              </a>
              .
            </li>
          </ul>

          <div className="mt-6 border-t border-rule pt-4">
            <SignOutButton className="rounded-sm border border-ink px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper" />
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Note>
          Your email is how we know it is you and where a password reset goes, so changing it takes
          a confirmation. Ask at the counter and we will send one.
        </Note>
      </div>
    </>
  )
}
