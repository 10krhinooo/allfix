import { products, imageFor } from "@/lib/catalogue"
import type { PriceBasis } from "@/lib/catalogue"
import { sellable } from "@/lib/commerce"

/**
 * Just enough of a part for a basket line to draw itself.
 *
 * The basket lives in the browser and the catalogue does not: 200 KB of specs
 * and copy has no business in a bundle so a cart page can print six names. So
 * the server sends this instead, which is the same arrangement `/shop` already
 * uses, and it carries only what a line shows.
 *
 * The price here is for display. What the customer is charged is resolved on
 * the server at the moment of ordering, from the catalogue and their tier, and
 * checkout shows the total that came back rather than one added up in the
 * browser. If the two ever disagree, the server is right.
 */
export interface BasketPart {
  sku: string
  slug: string
  name: string
  priceKes: number | null
  priceBasis: PriceBasis
  /**
   * The optimised file the migration wrote, already resolved to a path, or null
   * for a part still waiting on a shoot.
   *
   * Resolved here rather than in the component, because `product.image` is the
   * old WooCommerce URL and not a filename. Handing that straight to `next/image`
   * asks for `/products/https://allfix.co.ke/...`, which is what it was doing.
   */
  image: string | null
}

export function basketCatalogue(): Record<string, BasketPart> {
  const table: Record<string, BasketPart> = {}
  for (const product of products) {
    if (!product.sku) continue
    table[product.sku] = {
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      priceKes: product.priceKes,
      priceBasis: product.priceBasis,
      image: imageFor(product),
    }
  }
  return table
}

/** Whether a part can be checked out at all, which is the same rule the server applies. */
export function buyable(part: BasketPart | undefined): boolean {
  return Boolean(part) && sellable({ priceKes: part!.priceKes })
}
