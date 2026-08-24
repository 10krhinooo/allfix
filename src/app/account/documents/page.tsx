import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { price, hours, whatsapp } from "@/lib/format"
import { documentsFor, DOCUMENT_KIND } from "@/lib/account"
import { PageHead, EmptyState, Table, Th, Td, Pill, Note } from "@/components/admin/parts"

export const metadata: Metadata = {
  title: "Receipts and invoices",
  robots: { index: false, follow: false },
}

/**
 * The paper trail, listed rather than rendered.
 *
 * There is deliberately no download button. Phase 5 is what generates these as
 * documents, and a link that produced nothing, or produced an HTML page dressed
 * as a PDF, would be worse than the counter sending the real one. So the list
 * is real and the way to get a copy is to ask, which is what happens today.
 */
export default async function DocumentsPage() {
  const desk = await readDesk()
  if (!desk) redirect("/sign-in?next=%2Faccount%2Fdocuments")

  const documents = documentsFor(desk.email)

  return (
    <>
      <PageHead
        title="Receipts and invoices"
        lead="What you have been issued, against the order it belongs to."
      />

      {documents.length === 0 ? (
        <EmptyState
          title="Nothing issued yet"
          body="A receipt is issued when an order is paid, and a proforma when you ask for one before paying."
        />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Reference</Th>
                <Th>Kind</Th>
                <Th>Order</Th>
                <Th>Issued</Th>
                <Th align="right">Total</Th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.reference}>
                  <Td>
                    <span className="font-mono text-sm text-ink">{document.reference}</span>
                  </Td>
                  <Td>
                    <Pill tone={document.kind === "receipt" ? "quiet" : "waiting"}>
                      {DOCUMENT_KIND[document.kind]}
                    </Pill>
                  </Td>
                  <Td>
                    <span className="font-mono text-xs text-slate">{document.orderReference}</span>
                  </Td>
                  <Td>
                    <span className="text-xs text-slate">{hours(document.hoursAgo)}</span>
                  </Td>
                  <Td align="right">
                    <span className="font-mono text-sm text-ink">{price(document.totalKes)}</span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="mt-6">
            <Note>
              Need a copy for your records?{" "}
              <a
                href={whatsapp("Hello AllFix, could you send me a copy of this document:")}
                className="text-oxblood underline-offset-4 hover:underline"
              >
                Ask the counter
              </a>{" "}
              and we will send it over.
            </Note>
          </div>
        </>
      )}
    </>
  )
}
