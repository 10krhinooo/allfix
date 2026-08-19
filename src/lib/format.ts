/**
 * Money and stock, in the terms a Nairobi shopper reads.
 *
 * A price of null is not zero and must never render as "KES 0" -- that is the
 * exact bug that made the old store unable to sell. An absent price says so.
 */
export function price(kes: number | null | undefined) {
  if (kes === null || kes === undefined) return null
  return `KES ${kes.toLocaleString("en-KE")}`
}

export function priceOrAsk(kes: number | null | undefined) {
  return price(kes) ?? "Price on request"
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
