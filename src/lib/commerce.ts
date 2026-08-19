import type { Product, Variant } from "@/lib/catalogue"

/**
 * The storefront has to work in two states, and will for as long as the price
 * list is outstanding: a part with a price can be bought, and a part without one
 * can only be asked about. Every surface branches on this rather than inventing
 * a number or rendering "KES 0", which is the exact bug that stopped the old
 * store from selling anything.
 *
 * When the price list lands, nothing here changes. Parts simply become buyable.
 */
export function sellable(entry: Pick<Product, "priceKes"> | Pick<Variant, "priceKes">) {
  return typeof entry.priceKes === "number" && entry.priceKes > 0
}

/** The SKU a line in the cart refers to, once a variant has been chosen. */
export function skuFor(product: Product, variant?: Variant) {
  return variant?.sku ?? product.sku ?? product.slug
}

export function inStock(entry: { stock: number | null }) {
  // Stock is not tracked yet. Absent means unknown, which is not the same as
  // out of stock, so the counter's own answer stands until the data arrives.
  return entry.stock === null || entry.stock > 0
}
