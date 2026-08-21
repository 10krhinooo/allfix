import type { MetadataRoute } from "next"
import { SITE } from "@/lib/format"

/**
 * Robots, pointing crawlers at the sitemap. The storefront is open, because it
 * wants to be found. The counter console is not: it is staff-facing, and a
 * screen indexed once stays indexed long after the mistake is noticed. The
 * door, the trade desk and the API answer to a signed in person and have
 * nothing to offer a crawler either.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/sign-in", "/trade/account", "/api/"] },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  }
}
