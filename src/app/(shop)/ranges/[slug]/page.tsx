import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ProductCard } from "@/components/ProductCard"
import { BulkAdd, type BulkPart } from "@/components/systems/BulkAdd"
import { Breadcrumbs, Button, Empty, JsonLd, WhatsAppIcon } from "@/components/ui"
import {
  getRange,
  partsForRangeByComponent,
  ranges,
  skuCountForRange,
} from "@/lib/catalogue"
import { SHOP, whatsapp } from "@/lib/format"

export async function generateStaticParams() {
  return (await ranges()).map((range) => ({ slug: range.slug }))
}

/**
 * Deliberately not `dynamicParams = false`, for the reason written out at
 * `/shop/[category]`: without a fallback Next throws NoFallbackError into the
 * server log on its way to the 404, and under the end to end suite that was
 * enough to fail an unrelated request on the next tick. Letting the page run
 * and refuse itself is the same 404 with none of that.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const range = await getRange(slug)
  if (!range) return {}

  const title = `${range.name} curtain rods and parts`
  const description =
    `${range.blurb} ${range.partCount} parts in ${range.name.toLowerCase()}, in ` +
    `${range.diameters.join(", ")}mm, in stock at ${SHOP.street}, ${SHOP.area}.`

  return {
    title,
    description,
    alternates: { canonical: `/ranges/${range.slug}` },
    openGraph: { title, description, url: `/ranges/${range.slug}` },
  }
}

export default async function RangePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const range = await getRange(slug)
  if (!range) notFound()

  const groups = await partsForRangeByComponent(range.slug)
  const skus = await skuCountForRange(range.slug)

  const bulk: BulkPart[] = groups.flatMap(({ component, parts }) =>
    parts
      .filter((part) => part.sku)
      .map((part) => ({
        sku: part.sku as string,
        name: part.name,
        component: component.name,
        priceKes: part.priceKes,
        priceBasis: part.priceBasis,
      })),
  )

  const ask = whatsapp(
    `Hello AllFix, I am after ${range.name.toLowerCase()} curtain rod parts.`,
  )

  return (
    <>
      <JsonLd schema={await schema(range.slug)} />

      {/* ---------------------------------------------------------- header */}
      <section className="drafting border-b border-rule">
        <div className="shell py-10 sm:py-14">
          <Breadcrumbs
            trail={[
              { href: "/", label: "Home" },
              { href: "/ranges", label: "Rod finishes" },
              { label: range.name },
            ]}
          />

          <div className="mt-6 flex flex-wrap items-start gap-x-12 gap-y-8">
            <span
              aria-hidden="true"
              className="size-32 shrink-0 rounded-full border border-rule"
              style={{ backgroundColor: range.swatch }}
            />

            <div className="min-w-[min(100%,22rem)] flex-1">
              <p className="callout text-brass">Rod finish</p>

              <h1 className="display-lg mt-2 font-display font-bold tracking-tight">
                {range.name} rods and their parts
              </h1>

              <p className="mt-3 max-w-2xl leading-relaxed text-slate">{range.blurb}</p>

              <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
                {[
                  ["Parts", String(range.partCount)],
                  ["Orderable SKUs", String(skus)],
                  ["Part types", String(groups.length)],
                  ["Bores", `${range.diameters.join(", ")}mm`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="callout">{label}</dt>
                    <dd className="mt-1 font-mono text-xl text-ink">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button href={`/shop/rod?range=${range.slug}`}>
                  Filter the {range.shortName.toLowerCase()} parts
                </Button>
                <Button href={ask} variant="whatsapp" size="md">
                  <WhatsAppIcon />
                  Ask about a {range.shortName.toLowerCase()} part
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ by the bore */}
      {range.diameters.length > 0 && (
        <section className="border-b border-rule bg-panel">
          <div className="shell flex flex-wrap items-center gap-x-6 gap-y-3 py-5">
            <p className="callout">Only one thickness?</p>
            {range.diameters.map((bore) => (
              <Link
                key={bore}
                href={`/shop/rod?range=${range.slug}&diameter=${bore}`}
                className="rounded-sm border border-rule bg-paper px-4 py-2 font-mono text-sm transition-colors hover:border-ink"
              >
                {bore}mm
              </Link>
            ))}
            {/* The bore filter is the shop's, not a second copy of it here: a
                filter combination is not a page, and giving it one would put
                twelve near-identical listings into the sitemap. */}
            <p className="text-sm leading-relaxed text-slate">
              Measure the pole across the end, not around it.
            </p>
          </div>
        </section>
      )}

      {/* ------------------------------------------------- jump to a part */}
      {groups.length > 0 && (
        <nav
          aria-label="Part types in this finish"
          className="sticky top-[var(--header-h)] z-30 border-b border-rule bg-paper/95 backdrop-blur"
        >
          <div className="shell flex items-center gap-5 overflow-x-auto py-3">
            <span className="callout whitespace-nowrap">Jump to</span>
            {groups.map(({ component, parts }) => (
              <a
                key={component.slug}
                href={`#${component.slug}`}
                className="whitespace-nowrap text-sm text-slate transition-colors hover:text-ink"
              >
                {component.name}{" "}
                <span className="font-mono text-xs text-mute">{parts.length}</span>
              </a>
            ))}
          </div>
        </nav>
      )}

      {/* ------------------------------------------------------- the parts */}
      <div className="shell py-12">
        <p className="max-w-2xl leading-relaxed text-slate">
          Everything below is in {range.name.toLowerCase()}. The list runs in the order the rod
          goes up, so the pole comes first and what holds and finishes it follows.
        </p>

        {groups.length === 0 ? (
          <div className="mt-8">
            <Empty title={`No ${range.name.toLowerCase()} parts are listed online yet`}>
              <p>
                The counter at {SHOP.street} carries more than the site lists. Send us the part you
                need and we will confirm it from the shelf.
              </p>
              <p className="mt-4">
                <a href={ask} className="font-medium text-oxblood underline underline-offset-4">
                  Ask on WhatsApp
                </a>{" "}
                <span className="text-mute">or call {SHOP.phone}</span>
              </p>
            </Empty>
          </div>
        ) : (
          groups.map(({ component, parts }) => (
            <section
              key={component.slug}
              id={component.slug}
              className="mt-12 scroll-mt-[calc(var(--header-h)+4rem)]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule pb-3">
                <h2 className="font-display text-xl font-semibold tracking-tight">
                  {component.name}
                </h2>
                <p className="callout">
                  {parts.length} {parts.length === 1 ? "part" : "parts"}
                </p>
              </div>

              {component.purpose && (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate">
                  {component.purpose}
                </p>
              )}

              <ul className="auto-grid flush mt-6" style={{ ["--min" as string]: "15rem" }}>
                {parts.map((product) => (
                  <ProductCard key={product.slug} product={product} />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      {/* --------------------------------------------------- bulk entry */}
      {groups.length > 0 && (
        <div className="shell pb-14">
          <BulkAdd parts={bulk} label={range.shortName.toLowerCase()} />
        </div>
      )}

      {/* -------------------------------------------------- wrong finish? */}
      <section className="border-t border-rule bg-panel">
        <div className="shell flex flex-wrap items-center justify-between gap-6 py-10">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Not {range.name.toLowerCase()} after all?
            </h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate">
              The four finishes sit side by side on one page. Mixing them is the one thing that
              shows from across the room, so it is worth looking before you order.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="/ranges" variant="secondary" size="sm">
              Compare every finish
            </Button>
            <Link
              href="/shop"
              className="self-center text-sm text-slate underline-offset-4 hover:text-ink hover:underline"
            >
              Browse every part
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

/**
 * A finish page is a category listing, and the old site published none of these.
 * The ItemList is what lets a search engine understand that this page holds the
 * parts rather than describing them.
 */
async function schema(slug: string) {
  const range = (await getRange(slug))!
  const parts = (await partsForRangeByComponent(slug)).flatMap((group) => group.parts)

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${range.name} curtain rods and parts`,
    description: range.blurb,
    url: `https://allfix.co.ke/ranges/${range.slug}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: parts.length,
      itemListElement: parts.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: product.name,
        url: `https://allfix.co.ke/product/${product.slug}`,
      })),
    },
  }
}
