import type { Metadata, Viewport } from "next"
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google"
import { SHOP, SITE } from "@/lib/format"
import { preflight } from "@/lib/head-scripts"
import { Painted } from "@/components/Painted"
import { IdleWatch } from "@/components/IdleWatch"
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

/*
 * The plaster ground, so the browser's own chrome is not the one thing on a
 * phone that stayed white.
 *
 * Its own export rather than a key in `metadata`, which is where it used to
 * live and where Next 16 now refuses it. Not the `prefers-color-scheme` form
 * either: the shop has one ground and it is this one whatever the device is
 * set to.
 */
export const viewport: Viewport = {
  themeColor: "#f3ebdd",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The script below writes `data-desk` and `data-hero` onto this element
    // before React ever sees it, which is the whole point of it. React compares
    // what it rendered on the server with what is in the document and warns
    // about attributes it did not put there, so it is told not to. This
    // suppresses one level, the attributes of `<html>` itself, and nothing
    // inside it.
    <html
      lang="en-KE"
      suppressHydrationWarning
      className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <head>
        {/*
          Who is at the door, and whether the hero's curtain is going to open.
          Both are drawn in the HTML as they are on a first visit, so the
          decision to draw them otherwise has to be taken before that paint:
          taken any later, a full screen of cloth is painted and then pulled
          away, which is the flash rather than the reveal.
        */}
        <script dangerouslySetInnerHTML={{ __html: preflight() }} />
      </head>
      {/*
        Deliberately bare. The chrome lives in the route groups: the storefront
        has a header, a footer and a shop's structured data, and the staff
        console has none of them. Everything common to both, the fonts, the
        theme and the stylesheet, is what is left here.
      */}
      <body className="flex min-h-screen flex-col">
        {/* Renders nothing. It marks the document as having painted, which is
            what tells the page curtain that an arrival is a navigation and not a
            page load, including an arrival out of the console. */}
        <Painted />
        <IdleWatch />
        {children}
      </body>
    </html>
  )
}
