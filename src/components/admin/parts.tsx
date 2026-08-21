import Link from "next/link"

/**
 * The console's own small vocabulary.
 *
 * The storefront's primitives assume a page that is selling something: a
 * `shell` with generous margins, headlines set in Fraunces at display sizes,
 * one idea per screen. A counter screen is the opposite of that. It is a
 * worksheet, read at arm's length by somebody with a phone in the other hand,
 * so it is dense, ruled, and set in mono wherever a figure has to be compared
 * with the figure above it.
 */

export function PageHead({
  title,
  lead,
  children,
}: {
  title: string
  lead?: string
  children?: React.ReactNode
}) {
  return (
    <div className="drafting border-b border-rule px-5 py-7 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
          {lead && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate">{lead}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}

/**
 * A number and what it counts, with the count first.
 *
 * The label sits under the figure rather than over it because these are read by
 * scanning down a row of numbers for the one that is not zero.
 */
export function Figure({
  value,
  label,
  note,
  tone = "ink",
  href,
}: {
  value: number | string
  label: string
  note?: string
  tone?: "ink" | "warn" | "quiet"
  href?: string
}) {
  const colour = tone === "warn" ? "text-oxblood" : tone === "quiet" ? "text-mute" : "text-ink"

  /*
   * The number and its label are one statement, so they are marked up as one:
   * a description list, with the figure as the term. Read as three loose spans
   * they were announced as a single run of text, and when the tile was a link
   * the note became part of the link's name, so every tile read as a paragraph.
   */
  const body = (
    <>
      <dt className={`block font-mono text-3xl leading-none ${colour}`}>{value}</dt>
      <dd className="mt-2 block text-sm font-medium text-ink">{label}</dd>
      {note && <dd className="mt-1 block text-xs leading-relaxed text-slate">{note}</dd>}
    </>
  )

  if (href) {
    return (
      <div className="px-5 py-5 sm:px-6">
        <dl>{body}</dl>
        <Link
          href={href}
          className="mt-3 inline-block text-xs font-medium text-oxblood hover:underline"
        >
          {/* Named for where it goes, so a screen reader hears four distinct
              destinations rather than four identical "read more" links. */}
          Open {label}
        </Link>
      </div>
    )
  }
  return (
    <dl className="px-5 py-5 sm:px-6">{body}</dl>
  )
}

/**
 * A ruled strip of figures.
 *
 * `auto-fit` rather than the storefront's `auto-grid`, which uses `auto-fill`.
 * The difference matters here: fill keeps the empty tracks it made room for, and
 * because `.flush` draws its hairlines on the cells, an empty track at the end
 * of the strip renders as a ruled box with nothing in it. Fit collapses them, so
 * three figures make three columns and four make four.
 */
export function Figures({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flush grid border-b border-rule bg-paper"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 13rem), 1fr))" }}
    >
      {children}
    </div>
  )
}

export function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="px-5 py-8 sm:px-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="callout">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

/**
 * What a part costs, in the console's terms rather than the shop's.
 *
 * The storefront says "Price on request" to a customer, which is the right
 * thing to tell somebody trying to buy. It is the wrong thing to tell the
 * counter, where the same state means "nobody has priced this yet" and is the
 * work. So an unpriced part is drawn as a ruled blank: a line waiting to be
 * filled in, which is what it is.
 */
export function Blank({ children }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex min-w-24 items-end border-b border-dashed border-mute pb-0.5 text-xs text-mute">
      {children ?? " "}
    </span>
  )
}

/**
 * The aside that says what is real and what is standing in.
 *
 * Four screens had this box pasted byte for byte, at three different sizes,
 * which is how the same note quietly drifts out of date on one screen and not
 * another.
 */
export function Note({
  tone = "brass",
  children,
}: {
  tone?: "brass" | "warn"
  children: React.ReactNode
}) {
  const colour = tone === "warn" ? "border-oxblood bg-oxblood/5" : "border-brass bg-brass-soft"
  return (
    <p className={`max-w-xs border-l-2 px-3 py-2 text-xs leading-relaxed ${colour}`}>{children}</p>
  )
}

/**
 * One of several, as a radio group.
 *
 * The worksheet and the enquiry queue both had this as a row of buttons
 * carrying `aria-pressed`, which describes four independent toggles that happen
 * to look exclusive. A screen reader then announces "pressed" or "not pressed"
 * four times and never "one of five". Radios say the true thing, and the labels
 * keep the segmented look.
 */
export function Choices<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (next: T) => void
}) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => {
        const active = value === option.value
        return (
          <label
            key={option.value}
            className={`cursor-pointer rounded-sm border px-3 py-1.5 text-xs transition-colors ${
              active
                ? "border-ink bg-ink text-paper"
                : "border-rule text-slate hover:border-ink hover:text-ink"
            }`}
          >
            <input
              type="radio"
              className="sr-only"
              checked={active}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        )
      })}
    </fieldset>
  )
}

/**
 * The bar that sticks under the console header.
 *
 * The height comes from `--desk-header` in globals.css rather than a repeated
 * magic number, because the two used to be set independently and adjusting the
 * header's padding left the toolbar floating over the content it was meant to
 * sit below.
 */
export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky top-[var(--desk-header)] z-30 border-b border-rule bg-paper px-5 py-3 sm:px-8">
      {children}
    </div>
  )
}
