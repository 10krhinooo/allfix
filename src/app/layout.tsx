import type { Metadata } from "next"
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google"
import { SHOP, SITE } from "@/lib/format"
import { HINT } from "@/lib/admin/hint"
import { heroGateScript } from "@/lib/motion"
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
 * Three decisions that have to be made before the browser paints anything, so
 * all three are plain inline scripts rather than `next/script`.
 *
 * `beforeInteractive` reads as though it means before the page is drawn. It does
 * not. In the App Router it compiles to a push onto `self.__next_s`, which Next
 * drains in `app-bootstrap` once the client bundle has arrived: before
 * hydration, but long after the first paint. Every one of these exists to stop a
 * flash, so queueing all three behind the bundle defeated all three, and the
 * header shipped showing "Sign in" to people who were already signed in. A raw
 * script in the head runs while the parser is still in the head, which is the
 * whole requirement.
 */
const THEME =
  "try{var t=localStorage.getItem('allfix-theme');if(t==='dark')document.documentElement.dataset.theme='dark'}catch(e){}"

/*
 * Which of the header's two controls to show. The cookie carries a boolean and
 * nothing else, and every page that matters is guarded on the server anyway, so
 * the worst a forged one can do is show somebody the wrong label.
 */
const DESK =
  `try{if(/(^|;\\s*)${HINT}=1/.test(document.cookie))` +
  `document.documentElement.dataset.desk='1'}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-KE" className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <head>
        {/* The stored theme, so a visitor who chose dark never sees light. */}
        <script dangerouslySetInnerHTML={{ __html: THEME }} />
        {/* The door, so nobody signed in is offered the door. */}
        <script dangerouslySetInnerHTML={{ __html: DESK }} />
        {/*
          Whether the hero's curtain is going to open. It is drawn closed in the
          HTML so it is in place at first paint, which means the decision not to
          open it belongs here too: taken any later, a full screen of red is
          painted and then pulled away, which is the flash rather than the
          reveal. No script, no flag, no cloth.
        */}
        <script dangerouslySetInnerHTML={{ __html: heroGateScript() }} />
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
