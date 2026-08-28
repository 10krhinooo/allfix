"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardHeader, Note, PageHead, Section } from "@/components/admin/parts"
import type { PartEdit, Saved } from "@/lib/admin/catalogue-api"

/**
 * Adding a part, and altering one.
 *
 * One form for both, because they are the same object described twice and the
 * only real difference is the code: it decides everything else about a part and
 * so cannot change once anything points at it.
 *
 * The form is deliberately thin. It does not decide what a valid code is, what
 * kind of part a name describes or which system a prefix belongs to: the
 * service works all of that out from the code and the name, once, and refuses in
 * sentences written for whoever is standing at the counter. Those come back
 * verbatim. A second copy of those rules here would be a second set of answers
 * to disagree with.
 *
 * What it does do is say the rules out loud before somebody types, because they
 * are not guessable and the alternative is finding them one refusal at a time.
 */

const FIELD =
  "mt-1.5 w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ink"

/**
 * A labelled field whose hint is a description rather than part of its name.
 *
 * The console's older forms put the hint inside the `<label>`, which makes it
 * part of the accessible name: tab onto the field and a screen reader reads the
 * label and then the whole paragraph, every time, before saying what sort of
 * control it is. `aria-describedby` says the same words in the place meant for
 * them, so the name stays "Name" and the explanation follows it.
 */
function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: React.ReactNode
  children: (props: { id: string; describedBy?: string }) => React.ReactNode
}) {
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
  const hintId = `${id}-hint`
  return (
    <div>
      <label htmlFor={id} className="callout">
        {label}
      </label>
      {children({ id, describedBy: hint ? hintId : undefined })}
      {hint && (
        <span id={hintId} className="mt-1.5 block text-xs leading-relaxed text-slate">
          {hint}
        </span>
      )}
    </div>
  )
}

export interface PartFormValues extends PartEdit {
  slug?: string
}

export function PartForm({
  part,
  prefixes,
  onSave,
}: {
  /** Absent when adding. Present, with its slug, when altering. */
  part?: PartFormValues
  /** The codes the shop actually files parts under, read from the catalogue. */
  prefixes: { rails: string[]; rods: string[] }
  onSave: (values: PartEdit) => Promise<Saved>
}) {
  const adding = !part?.slug
  const router = useRouter()

  const [sku, setSku] = useState(part?.sku ?? "")
  const [name, setName] = useState(part?.name ?? "")
  const [summary, setSummary] = useState(part?.summary ?? "")
  const [description, setDescription] = useState(part?.description ?? "")
  const [imageName, setImageName] = useState(part?.imageName ?? "")
  const [categories, setCategories] = useState(part?.categories ?? "")
  const [busy, start] = useTransition()
  const [problem, setProblem] = useState<string | null>(null)

  const isRod = sku.trim().toUpperCase().startsWith("RD#")

  function submit() {
    setProblem(null)
    start(async () => {
      /*
       * Only what somebody actually filled in.
       *
       * The service reads an absent field as unchanged, which is the same rule
       * a blank cell follows in an uploaded sheet. Sending "" instead would
       * clear a summary nobody touched.
       */
      const values: PartEdit = { name: name.trim() || undefined }
      if (adding) values.sku = sku.trim()
      if (summary.trim()) values.summary = summary.trim()
      if (description.trim()) values.description = description.trim()
      if (imageName.trim()) values.imageName = imageName.trim()
      if (adding && isRod && categories.trim()) values.categories = categories.trim()

      const answer = await onSave(values)
      if (!answer.ok) {
        setProblem(answer.message)
        return
      }
      router.push(adding ? `/admin/parts/${answer.slug}` : "/admin/parts")
    })
  }

  const ready = name.trim().length > 0 && (!adding || sku.trim().length > 0)

  return (
    <>
      <PageHead
        title={adding ? "Add a part" : part!.name || "Alter a part"}
        lead={
          adding
            ? "The code decides the rest: which family it is, which system or finish it belongs to, and what kind of part it is."
            : "The code and the address stay as they are. Everything else can be corrected."
        }
      >
        <Link href="/admin/parts" className="callout hover:text-ink">
          Back to the worksheet
        </Link>
      </PageHead>

      <div className="space-y-6">
        <Section title="What it is">
          <div className="space-y-5">
            <Field
              label="Product code"
              hint={
                adding ? (
                  <>
                    A rail code starts <span className="font-mono">RL#</span> and a rod code{" "}
                    <span className="font-mono">RD#</span>, then a prefix the shop stocks:{" "}
                    <span className="font-mono">{prefixes.rails.join(", ")}</span> for rails,{" "}
                    <span className="font-mono">{prefixes.rods.join(", ")}</span> for rods. A code
                    the shop does not file parts under is refused, because there would be no page
                    the part appears on.
                  </>
                ) : (
                  "A code cannot change. It is what past orders, the shelf count and the price history all point at."
                )
              }
            >
              {({ id, describedBy }) => (
                <input
                  id={id}
                  aria-describedby={describedBy}
                  value={sku}
                  onChange={(event) => setSku(event.target.value)}
                  disabled={!adding}
                  placeholder="RL#20_012"
                  className={`${FIELD} font-mono disabled:bg-rule/20 disabled:text-slate`}
                />
              )}
            </Field>

            <Field
              label="Name"
              hint={
                adding
                  ? "What kind of part it is comes out of the name, so it has to contain the word: bracket, runner, stopper, track, finial and so on. It also becomes the address of the part on the shop."
                  : "The address stays where it was, so every link to this part still works. Only what a customer reads changes."
              }
            >
              {({ id, describedBy }) => (
                <input
                  id={id}
                  aria-describedby={describedBy}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="#20 Single Ceiling Bracket"
                  className={FIELD}
                />
              )}
            </Field>

            {adding && isRod && (
              <Field
                label="Categories"
                hint={
                  <>
                    Rods only, and the one thing the name of a rod does not say. It reads as
                    something, then <span className="font-mono">&gt;</span>, then one of rods,
                    brackets, finials, end cups, rings, tie backs or corner joints.
                  </>
                }
              >
                {({ id, describedBy }) => (
                  <input
                    id={id}
                    aria-describedby={describedBy}
                    value={categories}
                    onChange={(event) => setCategories(event.target.value)}
                    placeholder="Curtain rods > Finials"
                    className={FIELD}
                  />
                )}
              </Field>
            )}
          </div>
        </Section>

        <Section title="What it says on the shop">
          <div className="space-y-5">
            <Field label="Summary" hint="The one line under the name, on the card and at the top of the page.">
              {({ id, describedBy }) => (
                <input
                  id={id}
                  aria-describedby={describedBy}
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  className={FIELD}
                />
              )}
            </Field>

            <Field label="Description">
              {({ id }) => (
                <textarea
                  id={id}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={5}
                  className={FIELD}
                />
              )}
            </Field>

            <Field
              label="The shot it is waiting for"
              hint="What to call the photograph when it is taken, so the shot list reads as instructions. A part with a photograph does not need one."
            >
              {({ id, describedBy }) => (
                <input
                  id={id}
                  aria-describedby={describedBy}
                  value={imageName}
                  onChange={(event) => setImageName(event.target.value)}
                  placeholder="#20-Single-Ceiling-Bracket"
                  className={FIELD}
                />
              )}
            </Field>
          </div>
        </Section>

        {!adding && (
          <Card>
            <CardHeader
              title="The price is set on the worksheet"
              hint="Not here, and deliberately: a zero is refused there and the change is recorded against whoever made it."
              action={
                <Link
                  href={`/admin/parts?q=${encodeURIComponent(part!.sku ?? part!.slug ?? "")}`}
                  className="callout hover:text-ink"
                >
                  Price it
                </Link>
              }
            />
          </Card>
        )}

        {problem && (
          <Note tone="warn">
            <span role="alert">{problem}</span>
          </Note>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            disabled={!ready || busy}
            onClick={submit}
            className="rounded-sm bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep disabled:cursor-not-allowed disabled:opacity-55"
          >
            {busy ? "Saving" : adding ? "Add the part" : "Save"}
          </button>
          <Link href="/admin/parts" className="text-sm text-slate hover:text-ink">
            Cancel
          </Link>
        </div>
      </div>
    </>
  )
}
