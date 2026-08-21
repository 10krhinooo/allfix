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

const nextConfig: NextConfig = {
  async redirects() {
    return [
      ...WOOCOMMERCE_REDIRECTS.map(({ source, destination }) => ({
        source,
        destination,
        permanent: true,
      })),
      ...CONSOLE_REDIRECTS.map(({ source, destination }) => ({
        source,
        destination,
        permanent: false,
      })),
    ]
  },
}

export default nextConfig
