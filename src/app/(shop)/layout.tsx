import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { JsonLd } from "@/components/ui"
import { SHOP, SITE } from "@/lib/format"

/**
 * The storefront's chrome.
 *
 * This sits in a route group rather than in the root layout so the staff
 * console can have chrome of its own. A console is not a shop: it has no
 * basket, no WhatsApp button and no reason to carry a footer full of customer
 * links, and a nested layout cannot take away what a parent already rendered.
 */

/**
 * Structured data the old site had none of. A LocalBusiness record is what puts
 * the Njugu Lane shop into a map result, which matters more than any on-page
 * change for a CBD counter trade.
 *
 * It belongs here rather than at the root: the console is not a shopfront and
 * has no business claiming to be one in a search result.
 */
function businessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "HardwareStore",
    name: SHOP.name,
    telephone: SHOP.phoneIntl,
    url: SITE,
    address: {
      "@type": "PostalAddress",
      streetAddress: SHOP.street,
      addressLocality: SHOP.area,
      addressCountry: "KE",
    },
    currenciesAccepted: "KES",
    paymentAccepted: "M-Pesa, Cash, Card, Bank transfer",
  }
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd schema={businessSchema()} />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
