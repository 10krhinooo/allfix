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
  const body = (
    <>
      <span className={`block font-mono text-3xl leading-none ${colour}`}>{value}</span>
      <span className="mt-2 block text-sm font-medium text-ink">{label}</span>
      {note && <span className="mt-1 block text-xs leading-relaxed text-slate">{note}</span>}
    </>
  )

  if (href) {
    return (
      <Link href={href} className="block px-5 py-5 transition-colors hover:bg-panel sm:px-6">
        {body}
      </Link>
    )
  }
  return <div className="px-5 py-5 sm:px-6">{body}</div>
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
