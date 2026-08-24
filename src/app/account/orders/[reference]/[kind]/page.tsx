import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { ordersFor } from "@/lib/account"
import { isSheetKind, sheetFromOrder, sheetsFor } from "@/lib/documents"
import { DocumentSheet } from "@/components/account/DocumentSheet"

export const metadata: Metadata = {
  title: "Your document",
  robots: { index: false, follow: false },
}

/**
 * A document issued against an order rather than filed in its own right.
 *
 * There is never a second delivery note for the same order, so the reference is
 * derived from the order's and nothing is stored. What can be issued depends on
 * where the order has got to: a receipt is only true once the money has arrived,
 * and a delivery note is pointless for a collection.
 *
 * A kind the order cannot produce is not found rather than refused, which is the
 * same answer a made up kind gets. Neither tells anybody anything.
 */
export default async function OrderDocumentPage({
  params,
}: {
  params: Promise<{ reference: string; kind: string }>
}) {
  const { reference, kind } = await params
  const desk = await readDesk()
  if (!desk) {
    redirect(
      `/sign-in?next=%2Faccount%2Forders%2F${encodeURIComponent(reference)}%2F${encodeURIComponent(kind)}`,
    )
  }

  const order = ordersFor(desk.email).find((one) => one.reference === reference)
  if (!order || !isSheetKind(kind) || !sheetsFor(order).includes(kind)) notFound()

  return (
    <DocumentSheet
      sheet={sheetFromOrder(order, kind)}
      customer={desk.name}
      email={desk.email}
      back={
        <Link
          href="/account/orders"
          className="border border-rule px-5 py-2.5 text-sm text-ink transition-colors hover:border-brass hover:text-brass"
        >
          Back to your orders
        </Link>
      }
    />
  )
}
