import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { documentFor, DOCUMENT_KIND, lineTotal } from "@/lib/account"
import { price, hours, SHOP } from "@/lib/format"
import { PrintButton } from "@/components/account/PrintButton"

export const metadata: Metadata = {
  title: "Your document",
  robots: { index: false, follow: false },
}

/**
 * A receipt or a proforma, rendered as the document itself.
 *
 * Not a PDF built on a server. The browser already has a typesetter and a PDF
 * writer in it, and "print to PDF" produces a file the customer chose the name
 * and the location of, on a device that was never asked to trust a download.
 * The stylesheet does the work: `print:` rules drop the console chrome and the
 * button, so what comes out is the sheet and nothing else.
 *
 * The document is looked up by reference *and* by who is asking, so a reference
 * is not something to walk through. Somebody else's is not found rather than
 * forbidden, for the same reason the account book answers that way: a 403 would
 * confirm the document exists.
 */
export default async function DocumentPage({
  params,
}: {
  params: Promise<{ reference: string }>
}) {
  const { reference } = await params
  const desk = await readDesk()
  if (!desk) redirect(`/sign-in?next=%2Faccount%2Fdocuments%2F${encodeURIComponent(reference)}`)

  const document = documentFor(desk.email, reference)
  if (!document) notFound()

  const subtotal = document.lines.reduce((sum, line) => sum + (lineTotal(line) ?? 0), 0)
  const isReceipt = document.kind === "receipt"

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
        <PrintButton />
        <Link
          href="/account/documents"
          className="border border-rule px-5 py-2.5 text-sm text-ink transition-colors hover:border-brass hover:text-brass"
        >
          Back to receipts
        </Link>
      </div>

      {/* The sheet. Fixed to a light ground in both themes, because it is a
          document rather than a screen and a customer printing a dark one
          empties a cartridge to no purpose. */}
      <article className="mx-auto max-w-2xl border border-rule bg-white p-8 text-neutral-900 sm:p-12 print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-neutral-300 pb-6">
          <div>
            <p className="font-display text-xl font-bold tracking-tight">{SHOP.name}</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {SHOP.street}, {SHOP.area}
              <br />
              {SHOP.phone}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
              {DOCUMENT_KIND[document.kind]}
            </p>
            <p className="mt-2 font-mono text-lg">{document.reference}</p>
            <p className="mt-1 text-sm text-neutral-600">Issued {hours(document.hoursAgo)}</p>
          </div>
        </header>

        <div className="flex flex-wrap justify-between gap-6 border-b border-neutral-300 py-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
              Billed to
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              {desk.name}
              <br />
              {desk.email}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
              Against order
            </p>
            <p className="mt-2 font-mono text-sm">{document.orderReference}</p>
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
              <th className="pb-2 text-right font-mono text-xs uppercase tracking-[0.14em] text-neutral-500">
                Each
              </th>
              <th className="pb-2 text-right font-mono text-xs uppercase tracking-[0.14em] text-neutral-500">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {document.lines.map((line) => (
              <tr key={line.ref} className="border-b border-neutral-200">
                <td className="py-3">
                  {line.name}
                  <span className="ml-2 font-mono text-xs text-neutral-500">{line.ref}</span>
                </td>
                <td className="py-3 text-right font-mono">
                  {line.quantity}
                  <span className="ml-1 text-xs text-neutral-500">{line.basis}</span>
                </td>
                <td className="py-3 text-right font-mono">{price(line.unitKes)}</td>
                <td className="py-3 text-right font-mono">{price(lineTotal(line))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-600">Subtotal</dt>
              <dd className="font-mono">{price(subtotal)}</dd>
            </div>
            <div className="flex justify-between border-t border-neutral-300 pt-2">
              <dt className="font-medium">{isReceipt ? "Paid" : "Due"}</dt>
              <dd className="font-mono text-lg">{price(document.totalKes)}</dd>
            </div>
          </dl>
        </div>

        <footer className="mt-10 border-t border-neutral-300 pt-6 text-sm leading-relaxed text-neutral-600">
          {isReceipt ? (
            <p>Thank you. This is your receipt, and it is the reference to quote if you call.</p>
          ) : (
            <p>
              This is a proforma invoice and not a demand for payment. It holds the figures for
              bank transfer. Call the shop on {SHOP.phone} to confirm before paying.
            </p>
          )}
        </footer>
      </article>
    </>
  )
}
