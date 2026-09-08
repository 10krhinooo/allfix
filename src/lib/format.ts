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

/**
 * The way to the counter.
 *
 * A link rather than an embedded map, and that is a decision. An embed means a
 * Google iframe and Google's script on every page that carries it, which would
 * be the first third party script in this repository, would need `frame-src`
 * and `script-src` opened in a CSP written to refuse exactly that, and would
 * load a map for every visitor on a phone in Nairobi whether or not they were
 * ever going to walk to the shop. A link costs nothing until somebody wants it,
 * and it opens the app they already have directions in.
 *
 * `ALLFIX_MAPS_URL` is the exact pin when the shop supplies one, which is the
 * only way to be exact: a shop front on Njugu Lane is not a coordinate this
 * repository can know, and a guessed one sends a customer to the wrong door.
 * Without it this searches for the shop by name and address, which is what a
 * person would type anyway.
 */
export function directions(): string {
  const pinned = process.env.NEXT_PUBLIC_ALLFIX_MAPS_URL?.trim()
  if (pinned) return pinned

  const query = [SHOP.name, SHOP.street, SHOP.area, SHOP.city, SHOP.country].join(", ")
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export const SHOP = {
  name: "AllFix By Kipekee",
  street: "Njugu Lane",
  area: "Nairobi CBD",
  city: "Nairobi",
  country: "Kenya",
  phone: "0759 963 137",
  phoneIntl: "+254759963137",
  email: "sales@allfix.co.ke",
  site: "allfix.co.ke",
}

/**
 * The trading details a document has to carry that a web page does not.
 *
 * A receipt or an invoice leaves the site: it is printed, filed, attached to an
 * expense claim and sometimes handed to an accountant, and by then nobody can
 * click a header to find out who issued it. So the sheet repeats what the page
 * takes for granted, in full.
 *
 * The registration and tax numbers are the shop's to supply and are not in the
 * repository. Until they are, the fields are absent rather than invented: a
 * plausible looking PIN on a tax invoice is worse than no PIN, because somebody
 * will file it and only find out at the wrong moment.
 */
export const COMPANY = {
  legalName: "AllFix By Kipekee",
  addressLines: [`${SHOP.street}, ${SHOP.area}`, `${SHOP.city}, ${SHOP.country}`],
  phone: SHOP.phone,
  email: SHOP.email,
  site: SHOP.site,
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
