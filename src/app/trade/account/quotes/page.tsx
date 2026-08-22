import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { products } from "@/lib/catalogue"
import { quotesFor } from "@/lib/trade"
import { PageHead, Card, CardHeader, EmptyState } from "@/components/admin/parts"
import { QuoteCard } from "@/components/trade/records"
import { QuoteBuilder, type Pickable } from "@/components/trade/QuoteBuilder"

export const metadata: Metadata = { title: "Your quotes", robots: { index: false, follow: false } }

/**
 * Quotes, and the making of one.
 *
 * The builder sits on the same screen as the record rather than behind a button
 * of its own, because the commonest new quote is the last one with two lines
 * changed, and having both in view is what makes that a copy rather than a
 * fresh start.
 */
export default async function TradeQuotesPage() {
  const desk = await readDesk()
  if (!desk) redirect("/sign-in?next=%2Ftrade%2Faccount%2Fquotes")

  const quotes = quotesFor(desk.email)
  const awaitingYou = quotes.filter((quote) => quote.stage === "sent")

  /*
   * A compact projection for the builder, so the 200 KB of specs and copy behind
   * each product never reaches the client. The same reasoning as the shop's own
   * browser, and the reason the list is five string fields.
   */
  const pickable: Pickable[] = products
    .filter((product) => product.sku)
    .map((product) => ({
      slug: product.slug,
      ref: product.sku as string,
      name: product.name,
      listKes: product.priceKes,
      basis: product.priceBasis,
    }))

  return (
    <>
      <PageHead
        title="Quotes"
        lead={
          awaitingYou.length > 0
            ? `${awaitingYou.length} priced and held, waiting on your yes. A held quote keeps its figures until you answer.`
            : "Price a list before you promise it. A quote the counter has priced holds its figures until you answer."
        }
      />

      {quotes.length === 0 ? (
        <EmptyState
          title="No quotes yet"
          body="Send the counter a list and it comes back priced at your rate, held until you accept it."
        />
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => (
            <QuoteCard key={quote.reference} quote={quote} />
          ))}
        </div>
      )}

      <Card className="mt-6">
        <CardHeader
          title="A new quote"
          hint="Build the list here and the counter prices it at your rate."
        />
        <QuoteBuilder parts={pickable} account={desk.name} />
      </Card>
    </>
  )
}
