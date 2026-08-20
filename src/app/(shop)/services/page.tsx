import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumbs, JsonLd, WhatsAppIcon } from "@/components/ui"
import { SHOP, whatsapp } from "@/lib/format"
import { services } from "@/lib/services"

export const metadata: Metadata = {
  title: "Services",
  description:
    "AllFix measures, assembles, sews, fits and motorises curtains across Kenya. Installation, " +
    "rail assembly, made-to-measure curtaining, motorisation and in-home consultation, from the " +
    "counter on Njugu Lane.",
}

/**
 * The services index.
 *
 * Selling the hardware is half the business; fitting it is the other half, and
 * the higher-value half. Each card opens the service's own page for the detail,
 * and the whole page carries a measure-up call to action, because these jobs are
 * quoted after a survey rather than bought at a checkout.
 */

const QUOTE = whatsapp(
  "Hello AllFix, I would like a quote. Here is my window and what I have in mind:",
)

const schema = {
  "@context": "https://schema.org",
  "@graph": services.map((service) => ({
    "@type": "Service",
    name: service.title,
    description: service.lead,
    areaServed: "Kenya",
    provider: { "@type": "HardwareStore", name: SHOP.name },
  })),
}

export default function Services() {
  return (
    <>
      <JsonLd schema={schema} />

      {/* ------------------------------------------------------------ hero */}
      <section className="drafting border-b border-rule">
        <div className="shell py-14 sm:py-20">
          <Breadcrumbs trail={[{ href: "/", label: "Home" }, { label: "Services" }]} />

          <h1 className="display-xl mt-5 max-w-[18ch] font-display font-bold tracking-tight">
            We measure, sew and fit it
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate">
            Buying the hardware is half the job. Tell us the window and we handle the rest, from the
            fabric to the last bracket, and we come and hang it. Anywhere in Kenya.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href={QUOTE}
              className="inline-flex items-center gap-2 rounded-sm bg-oxblood px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
            >
              <WhatsAppIcon /> Get a free quote
            </a>
            <a href={`tel:${SHOP.phoneIntl}`} className="font-mono text-sm text-oxblood hover:underline">
              or call {SHOP.phone}
            </a>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- services */}
      <section className="shell py-16">
        <ul className="auto-grid flush bg-paper" style={{ ["--min" as string]: "22rem" }}>
          {services.map((service, index) => (
            <li key={service.slug} id={service.slug}>
              <Link
                href={`/services/${service.slug}`}
                className="group flex h-full flex-col bg-paper p-7 transition-colors hover:bg-brass-soft"
              >
                <p className="callout">
                  {String(index + 1).padStart(2, "0")} · {service.lead}
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">
                  {service.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate">{service.body}</p>

                <ul className="mt-4 space-y-1.5">
                  {service.points.map((point) => (
                    <li key={point} className="flex gap-2 text-sm text-slate">
                      <span aria-hidden="true" className="text-brass">·</span>
                      {point}
                    </li>
                  ))}
                </ul>

                <span className="mt-auto pt-6 text-sm font-medium text-oxblood">
                  Read more
                  <span aria-hidden="true" className="ml-1 inline-block transition-transform group-hover:translate-x-0.5">
                    &rarr;
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------------------------------------------------------- how it works */}
      <section className="border-y border-rule bg-panel">
        <div className="shell py-16">
          <p className="callout">How a job runs</p>
          <h2 className="display-lg mt-3 font-display font-bold tracking-tight">
            From your window to hung curtains
          </h2>

          <ol className="auto-grid mt-8 bg-rule" style={{ ["--min" as string]: "15rem" }}>
            {[
              ["Talk it through", "Send the window on WhatsApp or call the counter. We advise on rail, fabric and heading."],
              ["Measure up", "We come and measure, or you send the drop. Motorised and full curtain jobs get a site survey."],
              ["We build and sew", "Track cut and assembled, curtains made to the measurement in our workshop."],
              ["Fitted and packed off", "Our fitters hang it, level it and clear up. Delivered and installed across Kenya."],
            ].map(([title, line], index) => (
              <li key={title} className="bg-panel px-5 py-6">
                <p className="font-mono text-sm text-brass">{String(index + 1).padStart(2, "0")}</p>
                <p className="mt-2 font-display font-semibold tracking-tight">{title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate">{line}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* --------------------------------------------------------- closing cta */}
      <section className="shell py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="display-lg font-display font-bold tracking-tight">
              Tell us the window
            </h2>
            <p className="mt-3 max-w-lg leading-relaxed text-slate">
              A photo and a rough width is enough to start. We will come back with what it needs and
              what it costs, before anything is cut.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <a
                href={QUOTE}
                className="inline-flex items-center gap-2 rounded-sm bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
              >
                <WhatsAppIcon /> Get a free quote
              </a>
              <Link
                href="/build"
                className="rounded-sm border border-ink px-6 py-3 text-sm font-medium transition-colors hover:bg-ink hover:text-paper"
              >
                Build a rail yourself
              </Link>
            </div>
          </div>

          <div className="border border-rule p-6">
            <p className="callout">Visit the counter</p>
            <p className="mt-3 font-display text-xl font-semibold tracking-tight">
              {SHOP.street}, {SHOP.area}
            </p>
            <p className="mt-2 leading-relaxed text-slate">
              The full range is on the shelf. Bring your offcut and we will match the section across
              the counter.
            </p>
            <a href={`tel:${SHOP.phoneIntl}`} className="mt-5 inline-block font-mono text-lg text-oxblood">
              {SHOP.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
