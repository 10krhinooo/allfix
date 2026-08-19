import type { MetadataRoute } from "next"
import { SITE } from "@/lib/format"

/**
 * Robots, pointing crawlers at the sitemap. Everything is open: this is a
 * storefront that wants to be found, and there is nothing private to serve
 * until accounts and an admin console exist.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  }
}
