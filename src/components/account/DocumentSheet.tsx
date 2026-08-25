import Image from "next/image"
import { price, hours, COMPANY } from "@/lib/format"
import { lineTotal } from "@/lib/account"
import { SHEETS, type Sheet } from "@/lib/documents"
import { PrintButton } from "@/components/account/PrintButton"

/**
 * A document, drawn once for all four kinds.
 *
 * Four separate templates drift, and the first thing to go is the address
 * block: an invoice wearing a receipt's footer is worse than no invoice. So the
 * differences live in `SHEETS` as data and this renders whichever it is handed.
 *
 * Fixed to a light ground in both themes. It is a document rather than a
 * screen, and somebody printing a dark one empties a cartridge to no purpose.
 * The `print:` rules drop the chrome and the button, so what comes out of the
 * printer, or out of "save as PDF", is the sheet and nothing else.
 *
 * It carries the logo and the full trading details, which a web page can leave
 * to its header and this cannot. A document leaves the site: it is printed,
 * filed, attached to an expense claim, handed to an accountant, and by then
 * nobody can click anything to find out who issued it.
 */
export function DocumentSheet({
  sheet,
  customer,
  email,
  back,
}: {
  sheet: Sheet
  customer: string
  email: string
  /** The way back, rendered by the caller because only it knows where from. */
  back: React.ReactNode
}) {
  const spec = SHEETS[sheet.kind]
  const subtotal = sheet.lines.reduce((sum, line) => sum + (lineTotal(line) ?? 0), 0)

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
        <PrintButton />
        {back}
      </div>

      <article className="mx-auto max-w-2xl border border-rule bg-white p-8 text-neutral-900 sm:p-12 print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-neutral-300 pb-6">
          <div>
            {/* The light variant, always. This sheet is white in both themes and
                on paper, so the theme-driven swap would put the lifted wordmark
                on white and wash it out. */}
            <Image
              src="/brand/allfix-logo.png"
              alt={COMPANY.legalName}
              width={168}
              height={48}
              className="h-12 w-auto"
            />
            <address className="mt-3 text-sm not-italic leading-relaxed text-neutral-600">
              {COMPANY.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              <span className="block">{COMPANY.phone}</span>
              <span className="block">{COMPANY.email}</span>
              <span className="block">{COMPANY.site}</span>
            </address>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
              {spec.title}
            </p>
            <p className="mt-2 font-mono text-lg">{sheet.reference}</p>
            <p className="mt-1 text-sm text-neutral-600">Issued {hours(sheet.hoursAgo)}</p>
          </div>
        </header>

        <div className="flex flex-wrap justify-between gap-6 border-b border-neutral-300 py-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
              {spec.showsMoney ? "Billed to" : "Deliver to"}
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              {customer}
              <br />
              {spec.showsMoney ? email : (sheet.deliverTo ?? email)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
              {sheet.againstLabel ?? "Against order"}
            </p>
            <p className="mt-2 font-mono text-sm">{sheet.orderReference}</p>
          </div>
        </div>

        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-300">
              <th className="pb-2 font-mono text-xs uppercase tracking-[0.14em] text-neutral-500">
                Part
              </th>
              <th className="pb-2 text-right font-mono text-xs uppercase tracking-[0.14em] text-neutral-500">
                Qty
              </th>
              {/* A delivery note carries no money at all. It travels with the
                  goods, and the rider, the gateman and whoever signs for it
                  have no business seeing what the customer paid. */}
              {spec.showsMoney && (
                <>
                  <th className="pb-2 text-right font-mono text-xs uppercase tracking-[0.14em] text-neutral-500">
                    Each
                  </th>
                  <th className="pb-2 text-right font-mono text-xs uppercase tracking-[0.14em] text-neutral-500">
                    Total
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sheet.lines.map((line) => (
              <tr key={line.ref} className="border-b border-neutral-200">
                <td className="py-3">
                  {line.name}
                  <span className="ml-2 font-mono text-xs text-neutral-500">{line.ref}</span>
                </td>
                <td className="py-3 text-right font-mono">
                  {line.quantity}
                  <span className="ml-1 text-xs text-neutral-500">{line.basis}</span>
                </td>
                {spec.showsMoney && (
                  <>
                    <td className="py-3 text-right font-mono">{price(line.unitKes)}</td>
                    <td className="py-3 text-right font-mono">{price(lineTotal(line))}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {spec.showsMoney ? (
          <div className="mt-6 flex justify-end">
            <dl className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-600">Subtotal</dt>
                <dd className="font-mono">{price(subtotal)}</dd>
              </div>
              <div className="flex justify-between border-t border-neutral-300 pt-2">
                <dt className="font-medium">{spec.settledLabel}</dt>
                <dd className="font-mono text-lg">{price(sheet.totalKes ?? subtotal)}</dd>
              </div>
            </dl>
          </div>
        ) : (
          /* Somewhere to sign, which is what a delivery note is for. */
          <div className="mt-10 flex flex-wrap gap-10">
            {["Received by", "Date"].map((label) => (
              <div key={label} className="min-w-[12rem] flex-1">
                <div className="h-10 border-b border-neutral-400" />
                <p className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-neutral-500">
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}

        <footer className="mt-10 border-t border-neutral-300 pt-6 text-sm leading-relaxed text-neutral-600">
          <p>{spec.footer}</p>
          {/* Repeated at the foot, because a sheet gets read from the bottom as
              often as the top, and a second page has no header on it. */}
          <p className="mt-4 font-mono text-xs text-neutral-500">
            {COMPANY.legalName} · {COMPANY.addressLines.join(" · ")} · {COMPANY.phone} ·{" "}
            {COMPANY.email}
          </p>
        </footer>
      </article>
    </>
  )
}
