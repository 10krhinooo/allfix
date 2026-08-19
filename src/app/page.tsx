import Link from "next/link"
import { SystemPicker } from "@/components/SystemPicker"
import { TraceOnView } from "@/components/TraceOnView"
import { systems, componentsInOrder } from "@/lib/catalogue"
import { SHOP } from "@/lib/format"

const SERVICES = [
  ["Installation", "Measured, drilled and hung. We fit what we sell."],
  ["Motorisation", "A driven track sized to your run, wired and set up."],
  ["Curtaining", "Made to your window, hemmed, pleated and finished."],
  ["Consultation", "Fabric, colour and hardware, in your home or on a call."],
]

export default function Home() {
  const flagship = systems.find((s) => s.flagship)

  return (
    <>
      {/* ---------------------------------------------------------- hero */}
      <section className="drafting border-b border-rule">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <p className="callout">Njugu Lane · Nairobi CBD</p>

          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] font-bold tracking-tight sm:text-6xl">
            Which rail do you<br />
            already have?
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate">
            Match the cut end of your track to a section below. Everything behind it fits,
            so there is no guessing and no second trip to town.
          </p>

          <div className="mt-12">
            <TraceOnView>
              <SystemPicker list={systems} />
            </TraceOnView>
            <p className="mt-4 callout">
              Sections drawn to relative scale. Bring an offcut to the counter if you are unsure.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/build"
              className="rounded-sm bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
            >
              Build a complete rail
            </Link>
            <Link href="/shop" className="text-sm text-slate underline-offset-4 hover:text-ink hover:underline">
              Or browse every part
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ motorised */}
      {flagship && (
        <section className="bg-band text-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/60">
                Flagship system
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Curtains that open on their own
              </h2>
              <p className="mt-4 max-w-lg leading-relaxed text-white/80">
                A driven track with the motor sized to the length and weight of the run. Runs on a
                remote, a wall switch or a schedule, and ties into a smart home. From{" "}
                <span className="font-mono">KES 15,000</span>.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/systems/motorised"
                  className="rounded-sm bg-white px-5 py-2.5 text-sm font-medium text-band transition-colors hover:bg-white/90"
                >
                  See the motorised range
                </Link>
                <Link
                  href="/book"
                  className="rounded-sm border border-white/35 px-5 py-2.5 text-sm text-white transition-colors hover:bg-white/10"
                >
                  Book a site survey
                </Link>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-px bg-white/15 text-sm">
              {[
                ["Motors", "13W wifi, 45W, 75W"],
                ["Control", "Remote, switch, app"],
                ["Max run", "Sized on survey"],
                ["Fits", "New or existing track"],
              ].map(([label, value]) => (
                <div key={label} className="bg-band px-4 py-5">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/55">{label}</dt>
                  <dd className="mt-1.5 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------- by part */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Or go straight to the part
        </h2>
        <p className="mt-2 text-slate">
          Everything for a curtain rail, on the shelf at the counter.
        </p>

        <ul className="mt-8 grid gap-px bg-rule sm:grid-cols-2 lg:grid-cols-3">
          {componentsInOrder().map((component) => (
            <li key={component.slug}>
              <Link
                href={`/shop?part=${component.slug}`}
                className="flex h-full flex-col bg-paper p-5 transition-colors hover:bg-panel"
              >
                <span className="font-display font-semibold tracking-tight">{component.name}</span>
                <span className="mt-1.5 text-sm leading-relaxed text-slate">{component.purpose}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------------ services */}
      <section className="border-y border-rule bg-panel">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            We also fit it
          </h2>
          <p className="mt-2 max-w-xl text-slate">
            Buying the parts is half of it. Our fitters measure, drill and hang, and our workshop
            sews the curtains that go on them.
          </p>

          <ul className="mt-8 grid gap-px bg-rule sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map(([title, blurb]) => (
              <li key={title} className="bg-panel p-5">
                <p className="font-display font-semibold tracking-tight">{title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate">{blurb}</p>
              </li>
            ))}
          </ul>

          <Link
            href="/book"
            className="mt-8 inline-block rounded-sm bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
          >
            Book a measure-up
          </Link>
        </div>
      </section>

      {/* --------------------------------------------------------- trade */}
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-16 lg:grid-cols-2">
        <div>
          <p className="callout">Trade</p>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Fundis, curtain makers and fit-out contractors
          </h2>
          <p className="mt-3 leading-relaxed text-slate">
            Open an account for 20% off list, bulk quantity entry, and a proforma invoice you can
            settle by bank transfer instead of paying at checkout.
          </p>
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
      </section>
    </>
  )
}
