/**
 * Money and stock, in the terms a Nairobi shopper reads.
 *
 * A price of null is not zero and must never render as "KES 0" -- that is the
 * exact bug that made the old store unable to sell. An absent price says so.
 */
/**
 * What each basis is called on a price. "each" says nothing, because "KES 20
 * each" is how a counter quotes a runner and "KES 20" is how a shopper reads
 * it, but a track at 400 must never be mistaken for a whole track at 400.
 */
const BASIS: Record<string, string> = {
  each: "",
  metre: "per metre",
  pair: "per pair",
  box: "per box",
  roll: "per roll",
  length: "per length",
}

export function price(kes: number | null | undefined, basis?: string) {
  if (kes === null || kes === undefined) return null
  const suffix = basis ? BASIS[basis] ?? "" : ""
  return `KES ${kes.toLocaleString("en-KE")}${suffix ? ` ${suffix}` : ""}`
}

export function priceOrAsk(kes: number | null | undefined, basis?: string) {
  return price(kes, basis) ?? "Price on request"
}

export const SHOP = {
  name: "AllFix By Kipekee",
  street: "Njugu Lane",
  area: "Nairobi CBD",
  phone: "0759 963 137",
  phoneIntl: "+254759963137",
}

export function whatsapp(message: string) {
  return `https://wa.me/${SHOP.phoneIntl.replace("+", "")}?text=${encodeURIComponent(message)}`
}
