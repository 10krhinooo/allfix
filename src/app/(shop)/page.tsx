import Image from "next/image"
import Link from "next/link"
import { Curtain } from "@/components/Curtain"
import { SystemPicker } from "@/components/SystemPicker"
import { TraceOnView } from "@/components/TraceOnView"
import { systems, ranges, rails, rods } from "@/lib/catalogue"
import { SHOP, whatsapp } from "@/lib/format"

/**
 * The marketing front door.
 *
 * An earlier version opened with "which rail do you already have?", which is
 * the right question for a customer replacing a broken stopper and the wrong
 * one for everybody else: it asks a first-time visitor to identify a track they
 * do not own yet, and it buries the fact that the shop measures, sews, fits and
 * motorises. The section matcher is still here, further down, where the repeat
 * parts customer will look for it.
 *
 * Every call to action on this page reaches something that exists today. The
 * highest-value jobs, motorisation and full curtain work, need a site survey
 * anyway, so the primary action is a conversation rather than a checkout.
 */

const SERVICES = [
  ["Installation", "Measured, drilled and hung. We fit what we sell."],
  ["Motorisation", "A driven track sized to your run, wired and set up."],
  ["Curtaining", "Made to your window, hemmed, pleated and finished."],
  ["Consultation", "Fabric, colour and hardware, in your home or on a call."],
]

const TRUST = [
  ["Delivered countrywide", "Or collect at the counter."],
  ["M-Pesa, card or bank", "Paid the way you already pay."],
  ["Our own fitters", "We hang it, and our workshop sews it."],
  ["On Njugu Lane", "A real counter, not a warehouse."],
]

const QUOTE = whatsapp(
  "Hello AllFix, I would like a quote for curtains. Here is my window and what I have in mind:",
)
const SURVEY = whatsapp(
  "Hello AllFix, I am interested in motorised curtains and would like a site survey.",
)
export default async function Home() {
  const [allSystems, allRanges, allRails, allRods] = await Promise.all([
    systems(),
    ranges(),
    rails(),
    rods(),
  ])
  const flagship = allSystems.find((s) => s.flagship)

  return (
    <>
      {/* ---------------------------------------------------------- hero */}
      <section className="stage relative isolate overflow-hidden">
        <Curtain />

        <div className="shell relative z-10 py-20 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="callout">{SHOP.street} · {SHOP.area}</p>

              <h1 className="display-xl mt-5 max-w-[15ch] font-display font-semibold">
                Curtains that hang properly.
              </h1>

              {/* The brass rule the curtain ran off, left behind as the track. */}
              <div className="mt-8 h-px w-24 bg-stage-brass" />

              <p className="mt-8 max-w-xl text-lg leading-relaxed text-stage-ink/75">
                Rails, rods and motorised tracks, with the fittings that actually match them.
                We measure, we sew, and we come and hang it. Anywhere in Kenya.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <a
                  href={QUOTE}
                  className="rounded-sm bg-oxblood px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
                >
                  Get a free quote
                </a>
                <Link
                  href="/shop"
                  className="rounded-sm border border-stage-rule px-6 py-3.5 text-sm font-medium text-stage-ink transition-colors hover:border-stage-brass hover:text-stage-brass"
                >
                  Shop the range
                </Link>
                <a
                  href={`tel:${SHOP.phoneIntl}`}
                  className="font-mono text-sm text-stage-brass hover:underline"
                >
                  or call {SHOP.phone}
                </a>
              </div>
            </div>

            {/*
              The flagship track, on the black field it was shot on. This is the
              whole reason the hero is dark: the photograph has no edge against
              the stage, so the product appears to be lying on the page rather
              than inside a box cut into it.

              It is capped narrower than the column below the two column
              breakpoint. The shot is square, so at full phone width it stands
              as tall as it is wide and pushes the trust row off the screen.
            */}
            <figure className="relative mx-auto w-full max-w-xs lg:mx-0 lg:max-w-none">
              <Image
                src="/products/rlmotor_004.webp"
                alt="A motorised curtain track with its drive unit and runners"
                width={1200}
                height={1200}
                priority
                sizes="(max-width: 1024px) 20rem, 45vw"
                className="w-full"
              />
              <figcaption className="callout absolute bottom-6 left-0 w-full text-center">
                Motorised track · from KES 15,000, fitted
              </figcaption>
            </figure>
          </div>

          {/* Four cells, so the grid says four rather than letting auto-fill
              leave a fifth track empty at wide widths. */}
          <ul className="flush mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map(([title, line]) => (
              <li key={title} className="px-5 py-4">
                <p className="font-display text-base font-semibold">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-stage-ink/60">{line}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* --------------------------------------------------------- range */}
      <section className="shell py-16">
        <h2 className="display-lg font-display font-bold tracking-tight">
          Everything a curtain hangs on
        </h2>
        <p className="mt-2 max-w-xl text-slate">
          Priced, in stock, and on the shelf at the counter.
        </p>

        <ul className="flush mt-8 grid grid-cols-1 md:grid-cols-3">
          <li>
            <Link href="/systems" className="flex h-full flex-col bg-paper p-6 transition-colors hover:bg-brass-soft">
              <p className="callout">{allSystems.length} systems</p>
              <p className="mt-2 font-display text-xl font-semibold tracking-tight">Curtain rails</p>
              <p className="mt-2 text-sm leading-relaxed text-slate">
                Aluminium track from the slim #10 to the heavy #28, bendable for a bay,
                roller and zebra blinds, and every part that fits them.
              </p>
              <p className="mt-4 text-sm font-medium text-oxblood">Browse rails</p>
            </Link>
          </li>

          <li>
            <Link href="/shop/rod" className="flex h-full flex-col bg-paper p-6 transition-colors hover:bg-brass-soft">
              <p className="callout">{allRanges.length} finishes</p>
              <p className="mt-2 font-display text-xl font-semibold tracking-tight">Curtain rods</p>
              <p className="mt-2 text-sm leading-relaxed text-slate">
                Poles in antique brass, black, copper and silver, with finials, rings and tie
                backs to match. In 19, 25 and 28mm.
              </p>
              <p className="mt-4 text-sm font-medium text-oxblood">Browse rods</p>
            </Link>
          </li>

          <li>
            <Link href="/systems/motorised" className="flex h-full flex-col bg-paper p-6 transition-colors hover:bg-brass-soft">
              <p className="callout">Flagship</p>
              <p className="mt-2 font-display text-xl font-semibold tracking-tight">Motorised tracks</p>
              <p className="mt-2 text-sm leading-relaxed text-slate">
                Curtains that open on a remote, a wall switch, an app or a schedule. Fitted to
                a new track or to the one you already have.
              </p>
              <p className="mt-4 text-sm font-medium text-oxblood">See the motorised range</p>
            </Link>
          </li>
        </ul>
      </section>

      {/* ------------------------------------------------------ motorised */}
      {flagship && (
        <section className="bg-band text-white">
          <div className="shell grid gap-10 py-16 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/60">
                Flagship system
              </p>
              <h2 className="display-lg mt-3 font-display font-bold tracking-tight">
                Curtains that open on their own
              </h2>
              <p className="mt-4 max-w-lg leading-relaxed text-white/80">
                A driven track with the motor sized to the length and weight of the run. Runs on a
                remote, a wall switch or a schedule, and ties into a smart home. From{" "}
                <span className="font-mono">KES 15,000</span>, fitted.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href={SURVEY}
                  className="rounded-sm bg-white px-5 py-2.5 text-sm font-medium text-band transition-colors hover:bg-white/90"
                >
                  Book a site survey
                </a>
                <Link
                  href="/systems/motorised"
                  className="rounded-sm border border-white/35 px-5 py-2.5 text-sm text-white transition-colors hover:bg-white/10"
                >
                  See the range
                </Link>
              </div>
            </div>

            <dl
              className="auto-grid flush text-sm"
              style={{ ["--min" as string]: "11rem", ["--hairline" as string]: "rgba(255,255,255,0.15)" }}
            >
              {[
                ["Motors", "13W wifi, 45W, 75W"],
                ["Control", "Remote, switch, app"],
                ["Max run", "Sized on survey"],
                ["Fits", "New or existing track"],
              ].map(([label, value]) => (
                <div key={label} className="bg-band px-4 py-5">
                  {/* /80 rather than /55: at 11px on the oxblood band the
                      lighter one was 4.5:1 on nothing. */}
                  <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/80">{label}</dt>
                  <dd className="mt-1.5 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------ services */}
      <section className="border-b border-rule bg-panel">
        <div className="shell py-16">
          <h2 className="display-lg font-display font-bold tracking-tight">
            We measure, sew and fit it
          </h2>
          <p className="mt-2 max-w-xl text-slate">
            Buying the hardware is half of it. Tell us the window and we will handle the rest,
            from the fabric to the last bracket.
          </p>

          <ul className="auto-grid flush mt-8" style={{ ["--min" as string]: "17rem" }}>
            {SERVICES.map(([title, blurb]) => (
              <li key={title} className="bg-panel p-5">
                <p className="font-display font-semibold tracking-tight">{title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate">{blurb}</p>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={QUOTE}
              className="rounded-sm bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
            >
              Book a measure-up
            </a>
            <a href={`tel:${SHOP.phoneIntl}`} className="font-mono text-sm text-oxblood hover:underline">
              {SHOP.phone}
            </a>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- parts finder */}
      <section className="shell py-16">
        <p className="callout">Already have a rail</p>
        <h2 className="display-lg mt-3 font-display font-bold tracking-tight">
          Match the section, and the parts fit
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-slate">
          Replacing a runner or a stopper? Every rail has a shape you can see looking down the
          cut end of the track. Find yours and everything behind it is guaranteed to fit, so
          there is no guessing and no second trip to town.
        </p>

        <div className="mt-9">
          <TraceOnView>
            <SystemPicker list={allSystems} />
          </TraceOnView>
          <p className="mt-4 callout">
            Sections drawn to relative scale. Bring an offcut to the counter if you are unsure.
          </p>
        </div>

        <Link
          href="/shop"
          className="mt-8 inline-block text-sm text-slate underline-offset-4 hover:text-ink hover:underline"
        >
          Or browse all {allRails.length + allRods.length} parts
        </Link>
      </section>

      {/* ------------------------------------------------- trade + visit */}
      <section className="border-t border-rule">
        <div className="shell grid gap-8 py-16 lg:grid-cols-2">
          <div>
            <p className="callout">Trade</p>
            <h2 className="display-lg mt-3 font-display font-bold tracking-tight">
              Fundis, curtain makers and fit-out contractors
            </h2>
            <p className="mt-3 leading-relaxed text-slate">
              Open an account for 20% off list, bulk quantity entry, and a proforma invoice you can
              settle by bank transfer instead of paying at checkout.
            </p>
            {/* `/trade` is the page written for this click: the rate, what an
                account gets, and the application. Sending it to WhatsApp
                instead asked somebody to start a conversation to read a page
                the shop had already written. */}
            <Link
              href="/trade"
              className="mt-6 inline-block rounded-sm border border-ink px-6 py-3 text-sm font-medium transition-colors hover:bg-ink hover:text-paper"
            >
              Open a trade account
            </Link>
          </div>

          <div className="border border-rule p-6">
            <p className="callout">Visit the shop</p>
            <p className="mt-3 font-display text-xl font-semibold tracking-tight">
              {SHOP.street}, {SHOP.area}
            </p>
            <p className="mt-2 leading-relaxed text-slate">
              The full range is on the shelf. Bring your offcut and we will match the section
              across the counter.
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
