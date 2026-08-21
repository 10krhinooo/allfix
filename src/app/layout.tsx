import type { Metadata } from "next"
import Script from "next/script"
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google"
import { SHOP, SITE } from "@/lib/format"
import "./globals.css"

/**
 * Fraunces sets the headlines: a face with actual craft in it, for a shop that
 * sews and fits soft furnishing, against the IBM Plex sans and mono that carry
 * the technical half of the business, the SKUs, dimensions and spec tables.
 * The `opsz` axis is the point of it, so the axes are requested explicitly.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
})
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
  metadataBase: new URL(SITE),
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-KE" className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <head>
        {/*
          Applies the stored choice before the first paint. Without it a visitor
          who chose dark gets a flash of light while React hydrates.
        */}
        <Script id="allfix-theme" strategy="beforeInteractive">
          {"try{var t=localStorage.getItem('allfix-theme');if(t==='dark')document.documentElement.dataset.theme='dark'}catch(e){}"}
        </Script>
        {/*
          Which of the header's two controls to show, decided before the first
          paint for the same reason the theme is: the alternative is a visitor
          watching Sign in turn into Your account after hydration. The cookie
          carries a boolean and nothing else, and the pages that matter are
          guarded on the server regardless.
        */}
        <Script id="allfix-desk" strategy="beforeInteractive">
          {"try{if(document.cookie.indexOf('allfix_desk=1')>-1)document.documentElement.dataset.desk='1'}catch(e){}"}
        </Script>
        {/*
          The hero curtain is drawn closed in the HTML so it is in place at
          first paint. Without JavaScript it could never open again, so it is
          never drawn at all.
        */}
        <noscript>
          <style>{".curtain{display:none!important}"}</style>
        </noscript>
      </head>
      {/*
        Deliberately bare. The chrome lives in the route groups: the storefront
        has a header, a footer and a shop's structured data, and the staff
        console has none of them. Everything common to both, the fonts, the
        theme and the stylesheet, is what is left here.
      */}
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  )
}
