/**
 * Invented work, so the console can be shown doing its job.
 *
 * None of this is real. There is no orders table and no enquiries table yet:
 * the storefront's quote, survey and trade forms all compose a WhatsApp message
 * rather than posting anywhere, which is honest but leaves nothing for a queue
 * to hold. These stand in for what those forms will write once they post.
 *
 * They are written as the shop's actual work rather than as lorem ipsum, with
 * Nairobi addresses and the jobs this business is really asked for, because a
 * queue full of "Test User 1" tells you nothing about whether the screen is the
 * right shape for the work.
 */

export type { EnquiryKind } from "@/lib/enquiry"
import type { EnquiryKind } from "@/lib/enquiry"

export interface Enquiry {
  id: string
  kind: EnquiryKind
  name: string
  phone: string
  area: string
  /** How long ago it came in, in hours, so the seed does not age into nonsense. */
  hoursAgo: number
  summary: string
  detail: string
  /** The rail or rod the enquiry is about, where the customer knew. */
  system: string | null
}

export const KIND_LABEL: Record<EnquiryKind, string> = {
  quote: "Quote",
  survey: "Site visit",
  trade: "Trade account",
  parts: "Parts",
}

export const ENQUIRIES: Enquiry[] = [
  {
    id: "e-1042",
    kind: "survey",
    name: "Wanjiru Kamau",
    phone: "0722 418 093",
    area: "Kileleshwa",
    hoursAgo: 2,
    summary: "Motorised track, two bedrooms, wants a survey before ordering",
    detail:
      "Sitting room bay is roughly 4.2m and she wants one motor for it. Two bedrooms at about "
      + "2.4m each on ordinary track. Asked whether the motor can be worked from a phone. "
      + "Available Thursday or Friday morning.",
    system: "motorised",
  },
  {
    id: "e-1041",
    kind: "parts",
    name: "Peter Ochieng",
    phone: "0733 265 741",
    area: "Kasarani",
    hoursAgo: 5,
    summary: "Needs runners and two end stoppers for a #20 rail",
    detail:
      "Has the rail already, moved house and the fittings did not come with it. Counted about "
      + "6m of track. Asked whether the white runners fit the rubber version too.",
    system: "20",
  },
  {
    id: "e-1039",
    kind: "quote",
    name: "Amina Yusuf",
    phone: "0710 884 220",
    area: "South B",
    hoursAgo: 21,
    summary: "Full curtaining for a three bedroom, fabric and fitting",
    detail:
      "Wants sheers and blackout in all rooms, and asked for the fabric to be sourced as well. "
      + "Mentioned a budget in the region of 90,000 and wants it done before the end of the month.",
    system: null,
  },
  {
    id: "e-1036",
    kind: "trade",
    name: "Njoroge Interiors",
    phone: "0748 552 118",
    area: "Industrial Area",
    hoursAgo: 30,
    summary: "Curtain maker asking about trade rates and account terms",
    detail:
      "Fits out serviced apartments, says roughly 40 windows a month. Asked what the trade "
      + "discount is and whether there is credit. Wants a price list rather than a quote.",
    system: null,
  },
  {
    id: "e-1034",
    kind: "survey",
    name: "Grace Mutiso",
    phone: "0726 903 447",
    area: "Syokimau",
    hoursAgo: 49,
    summary: "Roman blinds for four windows, unsure of the measurements",
    detail:
      "Asked for someone to come and measure. Windows are in a new build and she does not want "
      + "to order the wrong length. Weekends only.",
    system: "roman-blind",
  },
  {
    id: "e-1030",
    kind: "parts",
    name: "Hassan Ali",
    phone: "0759 118 602",
    area: "Eastleigh",
    hoursAgo: 74,
    summary: "Finials for a 28mm brass pole, wants to match what he has",
    detail:
      "Sent a photo of the pole. Looks like the antique brass range. One finial broke and he "
      + "wants a matching pair rather than a single.",
    system: null,
  },
]

export interface Person {
  email: string
  name: string
  role: "ADMIN" | "STAFF" | "TRADE" | "CUSTOMER"
  /** What the person is here to do, in the shop's own terms. */
  post: string
  active: boolean
}

/**
 * The roles are the ones the backend already seeds, not invented for this
 * screen. Trade and customer appear so the difference is visible: staff work
 * the counter, trade buy at a tier, and a customer is neither.
 */
export const PEOPLE: Person[] = [
  { email: "hafsah@allfix.co.ke", name: "Hafsah Ngechi", role: "ADMIN", post: "Owner", active: true },
  { email: "counter@allfix.co.ke", name: "Dennis Kimani", role: "STAFF", post: "Counter, Njugu Lane", active: true },
  { email: "workshop@allfix.co.ke", name: "Faith Auma", role: "STAFF", post: "Workshop and fitting", active: true },
  { email: "njoroge@interiors.co.ke", name: "Njoroge Interiors", role: "TRADE", post: "Curtain maker", active: true },
  { email: "p.ochieng@gmail.com", name: "Peter Ochieng", role: "CUSTOMER", post: "Retail", active: true },
  { email: "old.counter@allfix.co.ke", name: "Brian Otieno", role: "STAFF", post: "Counter, left the shop", active: false },
]

export const ROLE_NOTE: Record<Person["role"], string> = {
  ADMIN: "Everything, including who else gets in.",
  STAFF: "The counter: prices, enquiries and orders.",
  TRADE: "Buys at trade rates. No console access.",
  CUSTOMER: "A shopper. No console access.",
}
