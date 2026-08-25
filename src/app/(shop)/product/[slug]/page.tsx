import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AddToCart } from "@/components/cart/AddToCart"
import { TradeRate } from "@/components/TradeRate"
import { Breadcrumbs, Button, JsonLd, WhatsAppIcon } from "@/components/ui"
import { ProductCard } from "@/components/ProductCard"
import {
  getComponent,
  getProduct,
  getRange,
  getSystem,
  imageFor,
  partsForRange,
  partsForSystem,
  products,
  type Product,
} from "@/lib/catalogue"
import { priceLine, inStock } from "@/lib/commerce"
import { price, SHOP, whatsapp } from "@/lib/format"

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) return {}

  const money = price(product.priceKes, product.priceBasis)
  const description = [
    product.summary || `${product.componentLabel} from ${SHOP.name}.`,
    money ? `${money}.` : "Price on request.",
    `In stock at ${SHOP.street}, ${SHOP.area}.`,
  ].join(" ")

  return {
    title: product.name,
    description: description.slice(0, 300),
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: { title: product.name, description: description.slice(0, 300) },
  }
}

/**
 * Structured data for one part.
 *
 * `offers` is written only when there is a real price. An Offer with price 0 is
 * exactly what the old store published to Google, and it is why the catalogue
 * was indexed as free merchandise. A part waiting on a price says nothing here
 * rather than saying zero.
 */
function productSchema(product: Product, photo: string | null) {
  const line = priceLine(product)
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku ?? undefined,
    description: product.summary || product.description || undefined,
    image: photo ? `https://allfix.co.ke${photo}` : undefined,
    brand: { "@type": "Brand", name: SHOP.name },
    ...(line.buyable && product.priceKes
      ? {
          offers: {
            "@type": "Offer",
            price: product.priceKes,
            priceCurrency: "KES",
            availability: inStock(product)
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            seller: { "@type": "Organization", name: SHOP.name },
          },
        }
      : {}),
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) notFound()

  const line = priceLine(product)
  const photo = imageFor(product)
  const component = getComponent(product.component)
  const range = product.range ? getRange(product.range) : undefined
  const system = product.system ? getSystem(product.system) : undefined

  const order = whatsapp(
    `Hello AllFix, I would like to order:\n${product.name}` +
      `${product.sku ? ` (${product.sku})` : ""}\nQuantity: `,
  )

  // What else fits the same rail, or matches the same finish. A part is rarely
  // bought alone: the reason the old store lost orders is that nothing told a
  // customer what went with what.
  const siblings = (range ? partsForRange(range.slug) : system ? partsForSystem(system.slug) : [])
    .filter((other) => other.slug !== product.slug && other.component !== product.component)
    .slice(0, 6)

  return (
    <div className="shell py-12">
      <Breadcrumbs
        trail={[
          { href: "/", label: "Home" },
          { href: "/shop", label: "All parts" },
          ...(system ? [{ href: `/systems/${system.slug}`, label: system.name }] : []),
          ...(range ? [{ href: `/shop?range=${range.slug}`, label: range.name }] : []),
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* ------------------------------------------------------ picture */}
        <div className="relative aspect-square overflow-hidden border border-rule bg-shot">
          {photo ? (
            <Image
              src={photo}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-contain"
              priority
            />
          ) : (
            <div className="drafting flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <p className="font-display font-semibold tracking-tight">Photograph to come</p>
              <p className="text-sm leading-relaxed text-slate">
                This part is on the shelf at {SHOP.street}. Ask us for a photo and we will send
                one from the counter.
              </p>
            </div>
          )}
        </div>

        {/* -------------------------------------------------------- detail */}
        <div>
          <p className="callout">{product.componentLabel}</p>
          <h1 className="display-lg mt-2 font-display font-bold tracking-tight">{product.name}</h1>

          {product.sku && <p className="callout mt-2">SKU {product.sku}</p>}

          <p
            className={`mt-5 text-2xl ${line.buyable ? "font-mono font-medium text-ink" : "text-slate"}`}
          >
            {line.text}
          </p>
          {line.note && <p className="mt-1.5 text-sm text-slate">{line.note}</p>}

          {/* Nothing for a retail visitor, and nothing for a part priced on
              request. The page is prerendered, so the account behind it is read
              in the browser rather than here. */}
          <TradeRate listKes={product.priceKes} basis={product.priceBasis} />

          {product.summary && (
            <p className="mt-5 leading-relaxed text-slate">{product.summary}</p>
          )}

          {/* Variants are shown as a list rather than a picker: choosing one is a
              cart concern, and there is no cart until the backend lands. */}
          {product.variants && product.variants.length > 1 && (
            <div className="mt-7">
              <p className="callout">{product.variantAxis ?? "Options"}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <li
                    key={variant.sku}
                    className="inline-flex items-center gap-2 rounded-sm border border-rule px-3 py-1.5 text-sm"
                  >
                    <span
                      aria-hidden="true"
                      className="h-3.5 w-3.5 rounded-full border border-rule"
                      style={{ background: variant.swatch }}
                    />
                    {variant.label}
                    <span className="font-mono text-xs text-mute">
                      {price(variant.priceKes, variant.priceBasis) ?? "on request"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* A part priced on request gets no basket button, because the order
              endpoint refuses to check one out. Offering it here would be a
              button whose only outcome is a refusal three screens later. */}
          {line.buyable && product.sku && (
            <div className="mt-8">
              <AddToCart sku={product.sku} />
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <Button href={order} variant={line.buyable ? "secondary" : "whatsapp"}>
              {!line.buyable && <WhatsAppIcon />}
              {line.buyable ? "Or ask on WhatsApp" : "Ask for a price"}
            </Button>
            <Button href={`tel:${SHOP.phoneIntl}`} variant="secondary">
              Call {SHOP.phone}
            </Button>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate">
            Collect at {SHOP.street}, {SHOP.area}, or we deliver countrywide. M-Pesa, card, cash
            or bank transfer.
          </p>

          {/* --------------------------------------------------- fitment */}
          {product.universal ? (
            <p className="mt-7 border-t border-rule pt-5 text-sm leading-relaxed text-slate">
              Attaches to the curtain rather than the track, so it works with every rail system
              we stock.
            </p>
          ) : (
            system && (
              <p className="mt-7 border-t border-rule pt-5 text-sm leading-relaxed text-slate">
                Fits the{" "}
                <Link href={`/systems/${system.slug}`} className="text-oxblood underline-offset-4 hover:underline">
                  {system.name}
                </Link>{" "}
                rail system.
              </p>
            )
          )}

          {range && (
            <p className="mt-7 border-t border-rule pt-5 text-sm leading-relaxed text-slate">
              Part of the{" "}
              <Link href={`/shop?range=${range.slug}`} className="text-oxblood underline-offset-4 hover:underline">
                {range.name}
              </Link>{" "}
              rod range
              {product.diameter ? `, for ${product.diameter}mm poles` : ""}.
            </p>
          )}

          {component?.purpose && (
            <p className="mt-3 text-sm leading-relaxed text-slate">{component.purpose}</p>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------------- specs */}
      {product.specs.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold tracking-tight">Specification</h2>
          <dl className="mt-4 border-t border-rule">
            {product.specs.map((spec) => (
              <div
                key={spec.label}
                className="flex flex-wrap gap-x-6 gap-y-1 border-b border-rule py-3 text-sm"
              >
                <dt className="w-48 shrink-0 text-slate">{spec.label}</dt>
                <dd className="font-medium">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {product.description && (
        <section className="mt-12 max-w-3xl">
          <h2 className="font-display text-xl font-semibold tracking-tight">Details</h2>
          <p className="mt-3 leading-relaxed text-slate">{product.description}</p>
        </section>
      )}

      {/* -------------------------------------------------------- siblings */}
      {siblings.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            {range ? `Goes with the ${range.name} range` : `Also fits a ${system?.name} rail`}
          </h2>
          <ul className="auto-grid flush mt-5" style={{ ["--min" as string]: "15rem" }}>
            {siblings.map((other) => (
              <ProductCard key={other.slug} product={other} />
            ))}
          </ul>
        </section>
      )}

      <JsonLd schema={productSchema(product, photo)} />
    </div>
  )
}
