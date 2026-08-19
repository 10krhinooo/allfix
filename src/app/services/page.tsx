import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumbs, JsonLd, WhatsAppIcon } from "@/components/ui"
import { SHOP, whatsapp } from "@/lib/format"

export const metadata: Metadata = {
  title: "Services",
  description:
    "AllFix measures, assembles, sews, fits and motorises curtains across Kenya. Installation, " +
    "rail assembly, made-to-measure curtaining, motorisation and in-home consultation, from the " +
    "counter on Njugu Lane.",
}

/**
 * The services page.
 *
 * Selling the hardware is half the business; fitting it is the other half, and
 * the higher-value half. Every card hands off to WhatsApp pre-filled for that
 * service rather than to a booking form, because these jobs are quoted after a
 * measure-up, not bought at a checkout, and the booking route does not exist
 * yet. The one job a customer can self-serve, speccing a rail, points at
 * `/build`, which does.
 */

interface Service {
  slug: string
  title: string
  lead: string
  body: string
  points: string[]
  cta: string
  message: string
}

const SERVICES: Service[] = [
  {
    slug: "installation",
    title: "Installation",
    lead: "We fit what we sell.",
    body:
      "Our own fitters measure, drill and hang, on concrete, timber or a plasterboard ceiling. " +
      "The rail comes off our shelf, so the brackets, runners and stoppers are guaranteed to " +
      "match, and nothing is left for a second trip to town.",
    points: ["Ceiling or wall mount", "Levelled and packed off true", "Rails, rods and blinds"],
    cta: "Book a fitting",
    message:
      "Hello AllFix, I would like my curtains fitted. Here is the window and where I am:",
  },
  {
    slug: "assembling",
    title: "Rail assembly",
    lead: "Cut, counted and ready to mount.",
    body:
      "Bringing your own fitter, or fitting it yourself? We cut the track to your length, add the " +
      "brackets at one per metre, thread the runners and cap both ends, so the kit arrives assembled " +
      "rather than as a bag of parts. Tell us the run with the configurator and we build to it.",
    points: ["Track cut to length", "Runners threaded and counted", "Joints made for long spans"],
    cta: "Spec a rail",
    message:
      "Hello AllFix, I would like a rail assembled to my measurements. Here is the run:",
  },
  {
    slug: "curtaining",
    title: "Made-to-measure curtaining",
    lead: "Sewn to your window in our workshop.",
    body:
      "Choose the fabric and we cut, hem, pleat and finish it to the drop you actually have, not to " +
      "a standard size. Pinch, pencil or wave heading, lined or sheer, weighted to hang clean. The " +
      "curtains and the track that carries them come from the same counter.",
    points: ["Pinch, pencil or wave", "Lined, blackout or sheer", "Hemmed and weighted"],
    cta: "Get a curtain quote",
    message:
      "Hello AllFix, I would like a quote for curtains. Here is my window and what I have in mind:",
  },
  {
    slug: "motorisation",
    title: "Motorisation",
    lead: "Curtains that open on their own.",
    body:
      "A driven track with the motor sized to the length and weight of the run, wired in and set up " +
      "to a remote, a wall switch, an app or a schedule, and tied into a smart home. Fitted to a new " +
      "track or retrofitted to the one you already have. The span is sized on a survey.",
    points: ["Remote, switch, app or schedule", "New or existing track", "From KES 15,000, fitted"],
    cta: "Book a site survey",
    message:
      "Hello AllFix, I am interested in motorised curtains and would like a site survey.",
  },
  {
    slug: "consultation",
    title: "Consultation",
    lead: "Fabric, colour and hardware, worked out with you.",
    body:
      "Not sure where to start? We talk through fabric, colour, heading and the right rail for the " +
      "window and the wall, in your home or over a call. It is the first step on the bigger jobs and " +
      "it is what stops a wrong order before it is cut.",
    points: ["In your home or on a call", "Fabric and colour matching", "The right rail for the wall"],
    cta: "Arrange a consultation",
    message:
      "Hello AllFix, I would like a consultation about curtains for my home. Here is what I am after:",
  },
]

const QUOTE = whatsapp(
  "Hello AllFix, I would like a quote. Here is my window and what I have in mind:",
)

const schema = {
  "@context": "https://schema.org",
  "@graph": SERVICES.map((service) => ({
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
          {SERVICES.map((service, index) => (
            <li key={service.slug} id={service.slug} className="flex h-full flex-col bg-paper p-7">
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

              <div className="mt-auto pt-6">
                {service.slug === "assembling" ? (
                  <Link
                    href="/build"
                    className="inline-flex items-center gap-2 rounded-sm border border-ink px-5 py-2.5 text-sm font-medium transition-colors hover:bg-ink hover:text-paper"
                  >
                    {service.cta}
                  </Link>
                ) : (
                  <a
                    href={whatsapp(service.message)}
                    className="inline-flex items-center gap-2 rounded-sm border border-ink px-5 py-2.5 text-sm font-medium transition-colors hover:bg-ink hover:text-paper"
                  >
                    <WhatsAppIcon /> {service.cta}
                  </a>
                )}
              </div>
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
