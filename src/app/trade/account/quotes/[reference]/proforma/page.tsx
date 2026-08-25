import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { quotesFor } from "@/lib/trade"
import { sheetFor } from "@/lib/documents"
import { DocumentSheet } from "@/components/account/DocumentSheet"

export const metadata: Metadata = {
  title: "Proforma invoice",
  robots: { index: false, follow: false },
}

/**
 * The proforma, against a quote rather than against an order.
 *
 * This is what a trade account actually needs from a quote: a sheet with the
 * figures on it, on the shop's letterhead, that an accounts department will
 * accept as the basis for a bank transfer. Handing one over is the step between
 * a price and an order, and until now the only way to get it was to ask the
 * counter to type one out.
 *
 * Only a quote the counter has priced can produce one. A quote still being
 * priced has no figures to hold, and a proforma with a blank total is a sheet
 * somebody will pay the wrong amount against, so that is not found rather than
 * refused. So is a quote belonging to somebody else: the account is read from
 * the session and the quote is looked up under it, never looked up by reference
 * and checked afterwards.
 */
export default async function QuoteProformaPage({
  params,
}: {
  params: Promise<{ reference: string }>
}) {
  const { reference } = await params
  const desk = await readDesk()
  if (!desk) {
    redirect(
      `/sign-in?next=%2Ftrade%2Faccount%2Fquotes%2F${encodeURIComponent(reference)}%2Fproforma`,
    )
  }

  const quote = quotesFor(desk.email).find((one) => one.reference === reference)
  if (!quote || quote.totalKes === null) notFound()

  return (
    <DocumentSheet
      sheet={sheetFor(quote, "proforma", "Against quote")}
      customer={desk.name}
      email={desk.email}
      back={
        <Link
          href="/trade/account/quotes"
          className="border border-rule px-5 py-2.5 text-sm text-ink transition-colors hover:border-brass hover:text-brass"
        >
          Back to your quotes
        </Link>
      }
    />
  )
}
