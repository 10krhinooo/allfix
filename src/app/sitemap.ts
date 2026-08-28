import type { MetadataRoute } from "next"
import { products, systems } from "@/lib/catalogue"
import { SITE } from "@/lib/format"
import { services } from "@/lib/services"
import { CATEGORIES } from "@/lib/shop"

/**
 * The sitemap the old store never had.
 *
 * Every indexable route, built from the same catalogue the pages render, so a
 * new system or product appears here the moment it exists rather than being
 * remembered into a hand-kept list. Priorities rank the browse axes and the
 * product pages above the marketing and legal chrome, because those are the
 * pages worth ranking for a parts search.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const at = (path: string): string => `${SITE}${path}`

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: at("/"), changeFrequency: "weekly", priority: 1 },
    { url: at("/systems"), changeFrequency: "monthly", priority: 0.9 },
    { url: at("/shop"), changeFrequency: "weekly", priority: 0.9 },
    { url: at("/build"), changeFrequency: "monthly", priority: 0.8 },
    { url: at("/services"), changeFrequency: "monthly", priority: 0.7 },
    { url: at("/trade"), changeFrequency: "monthly", priority: 0.6 },
    { url: at("/book"), changeFrequency: "yearly", priority: 0.5 },
    { url: at("/privacy"), changeFrequency: "yearly", priority: 0.2 },
    { url: at("/terms"), changeFrequency: "yearly", priority: 0.2 },
  ]

  // A category is a page rather than a filtered view of one. Rails have had
  // eleven of these at `/systems/[slug]` all along; rods had none at all, so
  // half the catalogue was reachable only by filtering and no search engine
  // ever saw it.
  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
    url: at(`/shop/${category.id}`),
    changeFrequency: "weekly",
    priority: 0.85,
  }))

  const systemRoutes: MetadataRoute.Sitemap = (await systems()).map((system) => ({
    url: at(`/systems/${system.slug}`),
    changeFrequency: "monthly",
    priority: 0.8,
  }))

  const serviceRoutes: MetadataRoute.Sitemap = services.map((service) => ({
    url: at(`/services/${service.slug}`),
    changeFrequency: "monthly",
    priority: 0.6,
  }))

  const productRoutes: MetadataRoute.Sitemap = (await products()).map((product) => ({
    url: at(`/product/${product.slug}`),
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...systemRoutes,
    ...serviceRoutes,
    ...productRoutes,
  ].map((entry) => ({ ...entry, lastModified: now }))
}
