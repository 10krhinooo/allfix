import type { Metadata } from "next"
import { Suspense } from "react"
import { Breadcrumbs } from "@/components/ui"
import { ShopBrowser } from "@/components/shop/ShopBrowser"
import { shopData } from "@/lib/shop"

export const metadata: Metadata = {
  title: "All parts",
  description:
    "Every curtain rail and curtain rod part AllFix stocks: tracks, brackets, runners, " +
    "stoppers, rods, finials, rings and tie backs, priced in KES. Njugu Lane, Nairobi CBD.",
  alternates: { canonical: "/shop" },
}

/**
 * The shop is a thin server shell around a client browser. The server builds
 * the compact catalogue projection once, so the 200 KB of specs and copy never
 * reach the client, and hands the browser the slim array it filters in memory.
 * The old site's browse and shop were disconnected, which is the failure this
 * page exists to close: here every filtered view is a real, shareable URL.
 */
export default function Shop() {
  const data = shopData()

  return (
    <div className="shell py-12">
      <Breadcrumbs trail={[{ href: "/", label: "Home" }, { label: "All parts" }]} />
      <Suspense>
        <ShopBrowser data={data} />
      </Suspense>
    </div>
  )
}
