import Link from "next/link"
import { Logo } from "@/components/Logo"
import { SHOP } from "@/lib/format"
import { AuthStage } from "@/components/auth/AuthStage"
import { RiseIn } from "@/components/auth/RiseIn"

/**
 * The door, on a stage.
 *
 * Two halves. The right is the sheet the shop draws everything on: ruled lines
 * to write on, mono callouts for the labels, a title block at the head and the
 * counter's address at the foot. A field with a line under it is a field you
 * fill in; a field in a rounded box is furniture.
 *
 * The left is the dark house, running the rail sections. That half exists
 * because a form alone on a page is what every login on the internet looks
 * like, and this is the moment somebody is deciding whether the shop is real.
 * It carries no information the form needs, which is why it is `aria-hidden`
 * and why it is dropped entirely below `lg`: a phone gets the sheet, full
 * width, and loses nothing.
 *
 * Sitting outside both route groups is deliberate. A door is not a shopfront
 * and not a counter, so it wears no header or footer, and being outside
 * `(shop)` also keeps `PageCurtain` off it: a wipe belongs between two pages of
 * a shop, and this is the way in.
 */
export function Sheet({
  label,
  title,
  lead,
  stageLine = "Curtains that hang properly.",
  children,
  footer,
}: {
  label: string
  title: string
  lead?: string
  /** The line on the dark half. Each door says something a little different. */
  stageLine?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <AuthStage line={stageLine} />

      <div className="drafting flex items-center justify-center bg-panel px-4 py-10 sm:px-8">
        <RiseIn className="w-full max-w-md border border-rule bg-paper">
          <div className="flex items-center justify-between gap-4 border-b border-rule px-6 py-4">
            <Link href="/" title="Back to the shop" className="transition-opacity hover:opacity-70">
              <Logo height={34} alt="AllFix By Kipekee, back to the shop" />
            </Link>
            <span className="callout">{label}</span>
          </div>

          <div className="px-6 py-7 sm:px-8">
            <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
            {lead && <p className="mt-2 text-sm leading-relaxed text-slate">{lead}</p>}
            {children}
          </div>

          {footer && (
            <div className="border-t border-rule px-6 py-4 text-sm text-slate sm:px-8">{footer}</div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule bg-panel px-6 py-3 sm:px-8">
            <span className="callout">
              {SHOP.street}, {SHOP.area}
            </span>
            <a href={`tel:${SHOP.phoneIntl}`} className="font-mono text-xs text-slate hover:text-ink">
              {SHOP.phone}
            </a>
          </div>
        </RiseIn>
      </div>
    </main>
  )
}

/** A ruled line to write on, which is what a field is on a drawing. */
export const RULE =
  "mt-1 w-full border-0 border-b border-rule bg-transparent px-0 py-2 text-sm text-ink " +
  "outline-none transition-colors placeholder:text-mute focus:border-ink disabled:opacity-55"

export function Field({
  label,
  note,
  trailing,
  children,
}: {
  label: string
  note?: React.ReactNode
  /**
   * A control that sits on the line but is not part of it, such as the show and
   * hide toggle on a password.
   *
   * Rendered outside the `<label>` on purpose. A wrapping label takes its
   * accessible name from all the text inside it, so a button in there made the
   * field announce itself as "Password Show", and the name changed every time
   * somebody pressed it.
   */
  trailing?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="relative block">
      <label className="block">
        <span className="flex items-baseline justify-between gap-3">
          <span className="callout">{label}</span>
          {note && <span className="font-mono text-[11px] text-mute">{note}</span>}
        </span>
        {children}
      </label>
      {trailing}
    </div>
  )
}

export function Problem({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="border-l-2 border-oxblood bg-oxblood/5 px-3 py-2 text-sm leading-relaxed text-ink"
    >
      {children}
    </p>
  )
}
