import Link from "next/link"
import Image from "next/image"
import { imageFor, type Product } from "@/lib/catalogue"
import { priceLine } from "@/lib/commerce"

export function ProductCard({ product }: { product: Product }) {
  const price = priceLine(product)
  const variants = product.variants?.length ?? 0
  const photo = imageFor(product)

  return (
    <li>
      <Link
        href={`/product/${product.slug}`}
        className="group flex h-full flex-col bg-paper p-4 transition-colors hover:bg-panel"
      >
        {/*
          The well is the colour of the photographs' own field. 56 of the 62
          shots are white hardware on near-black, so on a white card each one
          reads as a black tile punched into the grid. Against `--shot` the
          photograph has no edge and the part appears to sit on the page.
        */}
        <div className="relative aspect-square overflow-hidden bg-shot">
          {photo ? (
            <Image
              src={photo}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 16vw"
              className="object-contain transition-transform duration-300 group-hover:scale-[1.04]"
            />
          ) : (
            // The rod line and everything the client's sheet added has not been
            // photographed yet. A drafting placeholder keeps the grid even and
            // says the part is real, which a broken image would not.
            <div className="drafting flex h-full items-center justify-center border border-rule">
              <span className="callout px-3 text-center">Photograph to come</span>
            </div>
          )}
        </div>

        <p className="mt-3 font-display text-sm leading-snug font-semibold tracking-tight">
          {product.name}
        </p>
        <p className="callout mt-1">{product.componentLabel}</p>

        <p className={`mt-auto pt-3 text-sm ${price.buyable ? "font-mono text-ink" : "text-slate"}`}>
          {price.text}
        </p>

        {variants > 1 && (
          <p className="callout mt-1">
            {variants} {product.variantAxis?.toLowerCase() ?? "option"} choices
          </p>
        )}
      </Link>
    </li>
  )
}
