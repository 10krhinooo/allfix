import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { documentFor } from "@/lib/account"
import { sheetFromDocument } from "@/lib/documents"
import { DocumentSheet } from "@/components/account/DocumentSheet"

/**
 * A document the shop has issued.
 *
 * Looked up by reference and by who is asking, so a reference is not something
 * to walk through. Somebody else's is not found rather than forbidden, for the
 * same reason the account book answers that way: a 403 confirms it exists.
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

  return (
    <DocumentSheet
      sheet={sheetFromDocument(document)}
      customer={desk.name}
      email={desk.email}
      back={
        <Link
          href="/account/documents"
          className="border border-rule px-5 py-2.5 text-sm text-ink transition-colors hover:border-brass hover:text-brass"
        >
          Back to receipts
        </Link>
      }
    />
  )
}

export const metadata: Metadata = {
  title: "Your document",
  robots: { index: false, follow: false },
}
