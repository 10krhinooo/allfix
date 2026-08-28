import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Breadcrumbs } from "@/components/ui"
import { ShopBrowser } from "@/components/shop/ShopBrowser"
import { CATEGORIES, shopData, type Category } from "@/lib/shop"
import { SITE } from "@/lib/format"

/**
 * A category as a page of its own, rather than a query string on `/shop`.
 *
 * Rails have had eleven of these all along, at `/systems/[slug]`, statically
 * generated and in the sitemap. Rods had nothing: the only way to them was
 * `/shop?family=rod`, which no sitemap lists and no search engine treats as a
 * page. Half the catalogue was unreachable except by filtering, which is the
 * same failure the old site had and the reason `/shop` exists.
 *
 * The browser underneath is the same one, opened on a category. Everything it
 * does afterwards is still a query string, because a filter combination is not
 * a page and pretending otherwise makes a sitemap of noise.
 */

/*
 * Deliberately not `dynamicParams = false`, which is what `/systems/[slug]`
 * uses. With it, Next never runs this page for a param it did not prerender: it
 * goes looking for a fallback, finds none, and throws NoFallbackError into the
 * server log. The visitor still gets a 404, but the server has taken an internal
 * error to produce it, and under the end to end suite that was enough to make an
 * unrelated request to /shop fail on the next tick.
 *
 * Letting the page run and refuse itself is the same 404 with none of that, and
 * the three real categories are still prerendered by generateStaticParams below.
 */
export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.id }))
}

const COPY: Record<Category, { title: string; description: string }> = {
  rail: {
    title: "Curtain rails and parts",
    description:
      "Curtain track and every part that fits it: brackets, runners, stoppers, joints and " +
      "the tapes and hooks that dress the curtain. Priced in KES. Njugu Lane, Nairobi CBD.",
  },
  blind: {
    title: "Blinds",
    description:
      "Roman, roller and zebra blinds, quoted by the metre with their fittings included. " +
      "Njugu Lane, Nairobi CBD.",
  },
  rod: {
    title: "Curtain rods",
    description:
      "Curtain poles in antique brass, copper, black and silver, with finials, rings, " +
      "end cups and tie backs to match. Priced in KES. Njugu Lane, Nairobi CBD.",
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  const copy = COPY[category as Category]
  if (!copy) return {}

  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: `/shop/${category}` },
  }
}

export default async function ShopCategory({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  const known = CATEGORIES.find((c) => c.id === category)
  if (!known) notFound()

  const data = await shopData()
  const copy = COPY[known.id]

  return (
    <div className="shell py-12">
      <Breadcrumbs
        trail={[
          { href: "/", label: "Home" },
          { href: "/shop", label: "All parts" },
          { label: known.label },
        ]}
      />
      <Suspense>
        <ShopBrowser data={data} category={known.id} />
      </Suspense>

      {/*
        The same collection markup the system pages carry, so a category is a
        page to a search engine rather than a filtered view of another one.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: copy.title,
            description: copy.description,
            url: `${SITE}/shop/${known.id}`,
          }),
        }}
      />
    </div>
  )
}
