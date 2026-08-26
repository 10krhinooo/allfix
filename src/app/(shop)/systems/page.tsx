import type { Metadata } from "next"
import Link from "next/link"
import { Profile } from "@/components/Profile"
import { TraceOnView } from "@/components/TraceOnView"
import { Breadcrumbs } from "@/components/ui"
import { systems } from "@/lib/catalogue"

export const metadata: Metadata = {
  title: "Rail systems",
  description:
    "Every curtain rail system AllFix stocks, drawn as its cross-section: motorised, #20, " +
    "#28, #10 bendable, #17 groove rubber, KS, double rail and roman blind track, plus " +
    "roller and zebra blinds.",
}

export default function Systems() {
  return (
    <div className="shell py-12">
      <Breadcrumbs trail={[{ href: "/", label: "Home" }, { label: "Rail systems" }]} />

      <h1 className="display-lg mt-5 max-w-[20ch] font-display font-bold tracking-tight">
        Every rail we stock, in section
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-slate">
        A rail system is identified by its profile, the shape you see looking down the cut end of
        the track. Find yours here and every part behind it is guaranteed to fit.
      </p>

      <TraceOnView>
        <ul className="auto-grid flush mt-10" style={{ ["--min" as string]: "22rem" }}>
          {systems.map((system) => (
            <li key={system.slug}>
              <Link
                href={`/systems/${system.slug}`}
                className="group flex h-full items-start gap-5 bg-paper p-6 transition-colors hover:bg-brass-soft"
              >
                <span className="shrink-0 text-brass">
                  <Profile system={system.slug} size={96} animate dimensioned />
                </span>
                <span>
                  <span className="block font-display text-lg font-semibold tracking-tight">
                    {system.name}
                  </span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-slate">
                    {system.blurb}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </TraceOnView>
    </div>
  )
}
