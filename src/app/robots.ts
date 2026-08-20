import type { MetadataRoute } from "next"
import { SITE } from "@/lib/format"

/**
 * Robots, pointing crawlers at the sitemap. The storefront is open, because it
 * wants to be found. The counter console is not: it is staff-facing, and a
 * screen indexed once stays indexed long after the mistake is noticed.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  }
}
