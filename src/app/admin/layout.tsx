import type { Metadata } from "next"
import { AdminShell } from "@/components/admin/AdminShell"

/**
 * Kept out of search results. The console holds nothing secret today, being a
 * prototype over the public catalogue, but a staff screen indexed once stays
 * indexed, and robots.txt disallows this path for the same reason.
 */
export const metadata: Metadata = {
  title: "Counter console",
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
