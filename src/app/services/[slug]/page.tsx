import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Breadcrumbs, JsonLd, WhatsAppIcon } from "@/components/ui"
import { SHOP } from "@/lib/format"
import { getService, serviceEnquiry, services } from "@/lib/services"

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }))
}

/** Every service is known at build time, so an unknown slug is a 404. */
export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const service = getService(slug)
  if (!service) return {}

  const title = service.title
  const description = `${service.lead} ${service.body}`

  return {
    title,
    description,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: { title, description, url: `/services/${service.slug}` },
  }
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const service = getService(slug)
  if (!service) notFound()

  const others = services.filter((entry) => entry.slug !== service.slug)
  const enquiry = serviceEnquiry(service)

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.lead,
    areaServed: "Kenya",
    provider: { "@type": "HardwareStore", name: SHOP.name },
  }

  return (
    <>
      <JsonLd schema={schema} />

      {/* ------------------------------------------------------------ hero */}
      <section className="drafting border-b border-rule">
        <div className="shell py-12 sm:py-16">
          <Breadcrumbs
            trail={[
              { href: "/", label: "Home" },
              { href: "/services", label: "Services" },
              { label: service.title },
            ]}
          />

          <h1 className="display-lg mt-5 max-w-[20ch] font-display font-bold tracking-tight">
            {service.title}
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate">{service.lead}</p>
        </div>
      </section>

      {/* ---------------------------------------------------------- detail */}
      <section className="shell py-14">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div className="max-w-2xl">
            <p className="leading-relaxed text-slate">{service.intro}</p>

            <h2 className="mt-10 font-display text-lg font-semibold tracking-tight">
              What it includes
            </h2>
            <ul className="mt-4 space-y-2.5">
              {service.includes.map((item) => (
                <li key={item} className="flex gap-3 leading-relaxed text-slate">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 bg-brass" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href={enquiry}
                className="inline-flex items-center gap-2 rounded-sm bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
              >
                <WhatsAppIcon /> Enquire on WhatsApp
              </a>
              {service.action && (
                <Link
                  href={service.action.href}
                  className="rounded-sm border border-ink px-6 py-3 text-sm font-medium transition-colors hover:bg-ink hover:text-paper"
                >
                  {service.action.label}
                </Link>
              )}
              <a href={`tel:${SHOP.phoneIntl}`} className="font-mono text-sm text-oxblood hover:underline">
                or call {SHOP.phone}
              </a>
            </div>
          </div>

          {/* ------------------------------------------------------ aside */}
          <aside className="border border-rule">
            <div className="border-b border-rule px-6 py-5">
              <p className="callout">The rest of what we do</p>
            </div>
            <ul>
              {others.map((entry) => (
                <li key={entry.slug} className="border-b border-rule last:border-b-0">
                  <Link
                    href={`/services/${entry.slug}`}
                    className="group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-brass-soft"
                  >
                    <span>
                      <span className="block font-display font-semibold tracking-tight">
                        {entry.title}
                      </span>
                      <span className="mt-0.5 block text-sm text-slate">{entry.lead}</span>
                    </span>
                    <span aria-hidden="true" className="text-oxblood transition-transform group-hover:translate-x-0.5">
                      &rarr;
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t border-rule px-6 py-5">
              <p className="callout">Book it</p>
              <p className="mt-2 text-sm leading-relaxed text-slate">
                Prefer to set a date for a measure-up or survey?
              </p>
              <Link
                href="/book"
                className="mt-3 inline-block text-sm font-medium text-oxblood underline-offset-4 hover:underline"
              >
                Book a visit &rarr;
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
