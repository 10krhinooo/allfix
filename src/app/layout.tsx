import type { Metadata } from "next"
import Script from "next/script"
import { Archivo, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { SHOP } from "@/lib/format"
import "./globals.css"

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" })
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
})
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://allfix.co.ke"),
  title: {
    default: "AllFix By Kipekee: curtain rails, rods and the parts that fit them",
    template: "%s | AllFix By Kipekee",
  },
  description:
    "Curtain rails, rods, motorised systems and every fitting that goes with them. " +
    "Shop by your rail system so the parts you order actually fit. Njugu Lane, Nairobi CBD.",
  openGraph: {
    type: "website",
    siteName: SHOP.name,
    locale: "en_KE",
  },
}

/**
 * Structured data the old site had none of. A LocalBusiness record is what puts
 * the Njugu Lane shop into a map result, which matters more than any on-page
 * change for a CBD counter trade.
 */
function businessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "HardwareStore",
    name: SHOP.name,
    telephone: SHOP.phoneIntl,
    url: "https://allfix.co.ke",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-KE" className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <head>
        {/*
          Applies the stored choice before the first paint. Without it a visitor
          who chose dark gets a flash of light while React hydrates.
        */}
        <Script id="allfix-theme" strategy="beforeInteractive">
          {"try{var t=localStorage.getItem('allfix-theme');if(t==='dark')document.documentElement.dataset.theme='dark'}catch(e){}"}
        </Script>
      </head>
      <body className="flex min-h-screen flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema()) }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
