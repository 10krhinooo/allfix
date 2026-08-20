import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Profile } from "@/components/Profile"
import { ProductCard } from "@/components/ProductCard"
import { TraceOnView } from "@/components/TraceOnView"
import { Breadcrumbs, Button, Empty, WhatsAppIcon } from "@/components/ui"
import {
  getSystem,
  partsForSystemByComponent,
  skuCountForSystem,
  systems,
} from "@/lib/catalogue"
import { SHOP, whatsapp } from "@/lib/format"

export function generateStaticParams() {
  return systems.map((system) => ({ slug: system.slug }))
}

/** Every system is known at build time, so an unknown slug is a 404, not a fetch. */
export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const system = getSystem(slug)
  if (!system) return {}

  const title = `${system.name} curtain rail parts`
  const description =
    `${system.blurb} ${system.partCount} parts that fit a ${system.name} rail, ` +
    `in stock at ${SHOP.street}, ${SHOP.area}.`

  return {
    title,
    description,
    alternates: { canonical: `/systems/${system.slug}` },
    openGraph: { title, description, url: `/systems/${system.slug}` },
  }
}

export default async function SystemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const system = getSystem(slug)
  if (!system) notFound()

  const groups = partsForSystemByComponent(system.slug)
  const skus = skuCountForSystem(system.slug)
  const ask = whatsapp(
    `Hello AllFix, I have a ${system.name} curtain rail and I need parts for it.`,
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema(system.slug)) }}
      />

      {/* ---------------------------------------------------------- header */}
      <section className="drafting border-b border-rule">
        <div className="shell py-10 sm:py-14">
          <Breadcrumbs
            trail={[
              { href: "/", label: "Home" },
              { href: "/systems", label: "Rail systems" },
              { label: system.name },
            ]}
          />

          <div className="mt-6 flex flex-wrap items-start gap-x-12 gap-y-8">
            <TraceOnView>
              <span className="block text-brass">
                <Profile system={system.slug} size={168} animate dimensioned />
              </span>
            </TraceOnView>

            <div className="min-w-[min(100%,22rem)] flex-1">
              {system.flagship && <p className="callout text-brass">Flagship system</p>}

              <h1 className="display-lg mt-2 font-display font-bold tracking-tight">
                Parts for a {system.name} rail
              </h1>

              <p className="mt-3 max-w-2xl leading-relaxed text-slate">{system.blurb}</p>

              <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
                {[
                  ["Parts", String(system.partCount)],
                  ["Orderable SKUs", String(skus)],
                  ["Part types", String(groups.length)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="callout">{label}</dt>
                    <dd className="mt-1 font-mono text-xl text-ink">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button href={`/build?system=${system.slug}`}>Build a complete {system.shortName} rail</Button>
                <Button href={ask} variant="whatsapp" size="md">
                  <WhatsAppIcon />
                  Ask about a {system.shortName} part
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- jump to a part */}
      {groups.length > 0 && (
        <nav
          aria-label="Part types on this rail"
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

      {/* ----------------------------------------------------- the parts */}
      <div className="shell py-12">
        <p className="max-w-2xl leading-relaxed text-slate">
          Everything below fits a {system.name} rail. The list runs in the order the rail goes
          together, so the track comes first and the fittings follow it.
        </p>

        {groups.length === 0 ? (
          <div className="mt-8">
            <Empty title={`No ${system.name} parts are listed online yet`}>
              <p>
                The counter at {SHOP.street} carries more than the site lists. Send us the part you
                need and we will confirm it from the shelf.
              </p>
              <p className="mt-4">
                <a href={ask} className="font-medium text-oxblood underline-offset-4 hover:underline">
                  Ask on WhatsApp
                </a>{" "}
                <span className="text-mute">or call {SHOP.phone}</span>
              </p>
            </Empty>
          </div>
        ) : (
          groups.map(({ component, parts }) => (
            <section key={component.slug} id={component.slug} className="mt-12 scroll-mt-[calc(var(--header-h)+4rem)]">
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

      {/* ------------------------------------------------- wrong system? */}
      <section className="border-t border-rule bg-panel">
        <div className="shell flex flex-wrap items-center justify-between gap-6 py-10">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Not a {system.name} after all?
            </h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate">
              Compare your track against the other sections, or bring an offcut to the counter and
              we will name it across the counter in a minute.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="/systems" variant="secondary" size="sm">
              Compare every section
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
 * A system page is a category listing, and the old site published none of these.
 * The ItemList is what lets a search engine understand that this page holds the
 * parts rather than describing them.
 */
function schema(slug: string) {
  const system = getSystem(slug)!
  const parts = partsForSystemByComponent(slug).flatMap((group) => group.parts)

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Parts for a ${system.name} curtain rail`,
    description: system.blurb,
    url: `https://allfix.co.ke/systems/${system.slug}`,
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
