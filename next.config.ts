import type { NextConfig } from "next"

/**
 * The old WooCommerce site is the only search presence AllFix has, and its
 * indexed category URLs would 404 against the new structure. Each is redirected
 * to the page that now does its job, so the ranking and any inbound links carry
 * over instead of being lost.
 *
 * These are permanent redirects, which Next serves as 308 rather than 301: a 308
 * consolidates ranking the same way a 301 does, and unlike the historical 301 it
 * preserves the request method.
 *
 * Sources carry no trailing slash even though WordPress wrote the URLs with one.
 * Next normalises a trailing slash away before custom redirects run, so an old
 * `/finials/` URL reaches this table as `/finials` (the slashed form redirects
 * here in one further hop). Adding explicit slashed sources would be dead
 * entries, never matched.
 */
const WOOCOMMERCE_REDIRECTS: { source: string; destination: string }[] = [
  { source: "/curtain-rails", destination: "/systems" },
  { source: "/motorised-rails", destination: "/systems/motorised" },
  { source: "/curtain-rods", destination: "/shop?family=rod" },
  { source: "/finials", destination: "/shop?part=finial" },
  { source: "/rings", destination: "/shop?part=ring" },
  { source: "/tie-backs", destination: "/shop?part=tie-back" },
  { source: "/end-cups", destination: "/shop?part=end-cup" },
  { source: "/rail-accessories", destination: "/shop?family=rail" },
  { source: "/rods-accessories", destination: "/shop?family=rod" },
]

/**
 * The console's own history. Prices and the shot list merged into one parts
 * worksheet, and the counter's figures linked straight into both, so the old
 * paths redirect rather than 404. Next carries the query string across, which
 * is what keeps `?show=unpriced` landing on the filtered view.
 *
 * Temporary rather than permanent: these are staff paths behind a sign in, and
 * a 308 would be cached in a browser long after the console moves on again.
 */
const CONSOLE_REDIRECTS: { source: string; destination: string }[] = [
  { source: "/admin/prices", destination: "/admin/parts" },
  { source: "/admin/shots", destination: "/admin/parts?show=unshot" },
]

/**
 * The headers every response carries.
 *
 * A shop that takes money is worth attacking, and none of these existed. They
 * are cheap and they are all deny-by-default: the page may not be framed, forms
 * may not post anywhere else, `<base>` may not be rewritten, plugins may not
 * load, and the browser may not guess a content type.
 *
 * `script-src` is the one compromise, and it is deliberate rather than
 * forgotten. A nonce is the strict answer, and the Next documentation is
 * explicit that generating one requires dynamic rendering on every page: this
 * storefront prerenders 154 product pages, nine system pages and the front page,
 * and turning all of them dynamic to harden a header would cost the thing the
 * catalogue is for. Next also inlines its own flight payload into prerendered
 * HTML, so hashes cannot cover it either. So inline script is allowed, and what
 * remains is still worth having: no script from another origin can run, nothing
 * can be posted to another origin, and the page cannot be put in a frame.
 *
 * `connect-src` names the API when there is one, because the enquiry form posts
 * to it from the browser. Everything else the storefront fetches is its own.
 */
const API = process.env.NEXT_PUBLIC_API_URL

const CSP = [
  "default-src 'self'",
  // 'unsafe-eval' in development only: React uses eval there to rebuild server
  // stack traces in the browser, and neither React nor Next uses it in a
  // production build.
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  // React writes inline style attributes, which is what this covers. The
  // stylesheet itself is Tailwind's, served from this origin.
  "style-src 'self' 'unsafe-inline'",
  // `data:` and `blob:` are next/image's own, for the placeholder and for the
  // optimiser's output.
  "img-src 'self' data: blob:",
  // Self hosted through next/font. Nothing is fetched from a font CDN.
  "font-src 'self'",
  `connect-src 'self'${API ? ` ${API}` : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ")

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  // Belt and braces with frame-ancestors, for anything that predates CSP.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // The path a customer was on is nobody else's business. The origin still
  // travels, so referral traffic is still attributed.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // None of these are used, and a shop has no business asking for any of them.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
]

const nextConfig: NextConfig = {
  // The version of the framework is a free hint to somebody deciding which
  // exploit to try first.
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }]
  },

  async redirects() {
    return [
      ...WOOCOMMERCE_REDIRECTS.map(({ source, destination }) => ({
        source,
        destination,
        permanent: true,
      })),
      // The client renumbered the bendable line from #15 to #10 in the August
      // sheet, which moves the system page with it. Permanent, like the
      // WooCommerce entries above and for the same reason: the old URL is
      // indexed and there is a page still doing its job.
      {
        source: "/systems/15-bendable",
        destination: "/systems/10-bendable",
        permanent: true,
      },
      ...CONSOLE_REDIRECTS.map(({ source, destination }) => ({
        source,
        destination,
        permanent: false,
      })),
    ]
  },
}

export default nextConfig
