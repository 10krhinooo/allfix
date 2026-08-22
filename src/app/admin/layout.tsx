import type { Metadata } from "next"
import { AdminShell } from "@/components/admin/AdminShell"
import type { Findable } from "@/components/admin/ConsoleSearch"
import { requireConsole } from "@/lib/admin/guard"
import { badgeRows, deskRows } from "@/lib/admin/rows"
import { ENQUIRIES } from "@/lib/admin/desk"

/**
 * Kept out of search results. A staff screen indexed once stays indexed long
 * after the mistake is noticed, and robots.txt disallows this path for the same
 * reason.
 */
export const metadata: Metadata = {
  title: "Counter console",
  robots: { index: false, follow: false },
}

/**
 * The console's own check, behind the proxy's.
 *
 * Two things happen here that could not happen in the old client side gate.
 * The identity is verified on the server, so the markup below is never built for
 * somebody who should not have it; and reading the cookie makes this whole
 * subtree dynamic, which it should always have been. A per visitor console has
 * no business being prerendered.
 *
 * The search index is built here rather than on each page because the search
 * lives in the chrome. It is deliberately three strings a row: the projection
 * `deskRows()` returns is already compact, and none of the specs or copy behind
 * it has any business in a console bundle.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const desk = await requireConsole()

  const rows = deskRows()

  const findable: Findable[] = [
    ...rows.map((row) => ({
      ref: row.ref,
      name: row.name,
      href: `/admin/parts?q=${encodeURIComponent(row.ref)}`,
      kind: "part" as const,
    })),
    ...ENQUIRIES.map((enquiry) => ({
      ref: enquiry.id,
      name: enquiry.name,
      href: `/admin/enquiries#${enquiry.id}`,
      kind: "enquiry" as const,
    })),
  ]

  return (
    <AdminShell desk={desk} findable={findable} badges={badgeRows(rows)}>
      {children}
    </AdminShell>
  )
}
