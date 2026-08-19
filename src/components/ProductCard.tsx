import Link from "next/link"
import Image from "next/image"
import { imageFor, type Product } from "@/lib/catalogue"
import { priceOrAsk } from "@/lib/format"
import { sellable } from "@/lib/commerce"

export function ProductCard({ product }: { product: Product }) {
  const buyable = sellable(product)
  const variants = product.variants?.length ?? 0

  return (
    <li>
      <Link
        href={`/product/${product.slug}`}
        className="group flex h-full flex-col bg-paper p-4 transition-colors hover:bg-panel"
      >
        <div className="relative aspect-square overflow-hidden bg-white">
          <Image
            src={imageFor(product)}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 16vw"
            className="object-contain transition-transform duration-300 group-hover:scale-[1.04]"
          />
        </div>

        <p className="mt-3 font-display text-sm leading-snug font-semibold tracking-tight">
          {product.name}
        </p>
        <p className="callout mt-1">{product.componentLabel}</p>

        <p className={`mt-auto pt-3 text-sm ${buyable ? "font-mono text-ink" : "text-slate"}`}>
          {priceOrAsk(product.priceKes)}
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
