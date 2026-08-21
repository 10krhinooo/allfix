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

/**
 * The canonical origin, used for metadata, the sitemap, robots and the
 * structured-data URLs. It is the domain the old store already ranks on, so
 * canonicals point here even while the site is served from a Vercel URL, to
 * consolidate that history rather than split it across two hosts.
 */
export const SITE = "https://allfix.co.ke"

export function whatsapp(message: string) {
  return `https://wa.me/${SHOP.phoneIntl.replace("+", "")}?text=${encodeURIComponent(message)}`
}

/**
 * When an enquiry arrived, as a clock time rather than a relative one.
 *
 * Pure, unlike "20 minutes ago": the same timestamp always reads the same, so
 * it cannot go stale while a counter screen sits open all afternoon, and it
 * cannot differ between the server's render and the browser's. "14:32, 3 Aug"
 * is also what gets repeated down a phone.
 */
export function arrived(at: number) {
  return new Date(at).toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** How long ago a seeded enquiry came in, which is stored as an offset so it does not age. */
export function hours(ago: number) {
  if (ago < 1) return "just now"
  if (ago < 24) return `${ago}h ago`
  const days = Math.round(ago / 24)
  return days === 1 ? "yesterday" : `${days} days ago`
}
