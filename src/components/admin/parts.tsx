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
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        {lead && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate">{lead}</p>}
      </div>
      {children}
    </header>
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
    <Card>
      <CardHeader title={title} action={action} />
      {children}
    </Card>
  )
}

/**
 * The console's card.
 *
 * The worksheet used to be drawn as one continuous ruled sheet, hairlines edge
 * to edge, which is honest to the drafting language but gives four unrelated
 * things on a screen no separation at all: on a phone the price list ran
 * straight into the enquiry queue with a single rule between them. A card is
 * the same information with a boundary around it, which is what makes a screen
 * scannable rather than continuous.
 */
export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: React.ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    /*
     * `min-w-0` because a grid item defaults to `min-width: auto`, so a card
     * holding a table with a minimum width stretched its whole track instead of
     * letting the table scroll inside it, and took the page sideways on a phone.
     */
    <section
      className={`min-w-0 rounded-2xl border border-rule bg-paper ${padded ? "p-5" : ""} ${className}`}
    >
      {children}
    </section>
  )
}

export function CardHeader({
  title,
  hint,
  action,
}: {
  title: string
  hint?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="font-display text-[15px] font-semibold text-ink">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-slate">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

/**
 * A strip of counts across the top of a screen.
 *
 * `auto-fit` and not a fixed four, because People shows three and Today shows
 * four, and a fixed track leaves a card sized gap where the fourth would have
 * been.
 */
export function Stats({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-6 grid gap-4"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 14rem), 1fr))" }}
    >
      {children}
    </div>
  )
}

/**
 * One count, on its own card.
 *
 * The label leads and the figure follows it, which is the opposite of the
 * storefront's `Figure`. These are read one card at a time, looking for the
 * one thing that needs doing, rather than scanned down a column of numerals,
 * and a label that arrives after the number makes every card a small puzzle.
 *
 * `accent` is for the count that is the work. Exactly one card on a screen
 * should carry it, or none.
 */
export function Stat({
  label,
  value,
  hint,
  accent,
  href,
}: {
  label: string
  value: number | string
  hint?: string
  accent?: boolean
  href?: string
}) {
  const body = (
    <>
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-mute">{label}</p>
      <p
        className={`mt-2 font-mono text-2xl leading-none ${accent ? "text-oxblood" : "text-ink"}`}
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-slate">{hint}</p>}
    </>
  )

  const skin = `rounded-2xl border p-5 ${
    accent ? "border-oxblood/25 bg-oxblood/5" : "border-rule bg-paper"
  }`

  /*
   * The whole card is the link when there is one. A "read more" underneath
   * would be a second tab stop for the same destination, and on a touch screen
   * the card is what gets tapped anyway.
   */
  if (href) {
    return (
      <Link href={href} className={`${skin} block transition-colors hover:border-ink`}>
        {body}
      </Link>
    )
  }
  return <div className={skin}>{body}</div>
}

/**
 * A table that can be read on a phone.
 *
 * The minimum width is the point: below it the columns are scrolled sideways
 * rather than wrapped, because a price that has wrapped under its SKU is no
 * longer in a column and cannot be compared with the price above it.
 */
export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[34rem] text-left text-sm">{children}</table>
    </div>
  )
}

export function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode
  align?: "left" | "right"
}) {
  return (
    <th
      scope="col"
      className={`border-b border-rule py-2.5 pr-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-mute ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  align = "left",
  className = "",
}: {
  children: React.ReactNode
  align?: "left" | "right"
  className?: string
}) {
  return (
    <td
      className={`border-b border-rule py-3 pr-4 align-middle ${
        align === "right" ? "text-right" : ""
      } ${className}`}
    >
      {children}
    </td>
  )
}

/**
 * A state, as a word rather than a colour.
 *
 * The palette here is two colours and a grey, so a pill cannot carry meaning by
 * hue the way a five colour console does, and it should not try: the word is
 * the label and the tone only says how loudly to read it. Oxblood is something
 * to do, brass is waiting on somebody else, quiet is settled.
 */
export function Pill({
  tone = "quiet",
  children,
}: {
  tone?: "todo" | "waiting" | "quiet"
  children: React.ReactNode
}) {
  const skin =
    tone === "todo"
      ? "border-oxblood/30 bg-oxblood/5 text-oxblood"
      : tone === "waiting"
        ? "border-brass/40 bg-brass-soft text-brass"
        : "border-rule bg-panel text-slate"

  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${skin}`}
    >
      {children}
    </span>
  )
}

/** Nothing to show, said in the console's terms rather than the shop's. */
export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-rule py-14 text-center">
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm px-6 text-sm leading-relaxed text-slate">{body}</p>
    </div>
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
  /*
   * The scroller is the wrapper, not the fieldset. A fieldset carries a UA
   * `min-inline-size: min-content`, so `overflow-x-auto` on it did nothing: it
   * grew to its content and took the whole worksheet sideways with it on a
   * phone. The wrapper scrolls and the fieldset keeps its natural width, which
   * is what `w-max` says out loud.
   *
   * `relative` is load bearing and not styling. The radios are `sr-only`, which
   * is `position: absolute`, and an absolutely positioned box is only clipped by
   * an ancestor that sits between it and its containing block. Without this the
   * containing block was the sticky toolbar above, the hidden radios kept their
   * static offsets out at 600px, and the page scrolled sideways to reach inputs
   * nobody can see.
   */
  return (
    <div className="no-bar relative min-w-0 max-w-full overflow-x-auto">
      <fieldset className="flex w-max gap-1 rounded-full bg-panel p-1">
        <legend className="sr-only">{label}</legend>
        {options.map((option) => {
          const active = value === option.value
          return (
            <label
              key={option.value}
              className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                active ? "bg-paper text-ink shadow-sm" : "text-slate hover:text-ink"
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
    </div>
  )
}

/**
 * The bar that sticks under the console header.
 *
 * The offset comes from `--desk-header` in globals.css rather than a repeated
 * magic number, because the two used to be set independently and adjusting the
 * header's padding left the toolbar floating over the content it was meant to
 * sit below.
 *
 * It bleeds to the edges of the padded page and pads itself back, so the
 * hairline underneath runs the full width when the bar sticks. A bar that stops
 * short of the edges reads as a card that has come loose.
 */
export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky top-[var(--desk-header)] z-20 -mx-4 mb-6 border-b border-rule bg-panel/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      {children}
    </div>
  )
}
