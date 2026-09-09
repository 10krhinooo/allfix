import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumbs } from "@/components/ui"
import { ranges } from "@/lib/catalogue"
import { SHOP } from "@/lib/format"

/**
 * The rod half of the shop, picked the way a rod is actually picked.
 *
 * Rails have had `/systems` all along: eleven pages, each one a section drawing
 * a customer can hold their own track against. Rods had nothing between `/shop`
 * and a product, which meant seventy four parts were reachable only by working a
 * filter, and a search engine was never given a page to rank for "antique brass
 * curtain rod Nairobi". That is the same failure the old site had.
 *
 * Finish leads because finish is what cannot be mixed: a brass finial on a black
 * pole is wrong in a way a customer sees from the door, whereas a bore is a
 * measurement they can take. Diameter filters within it, on the finish page.
 */
export const metadata: Metadata = {
  title: "Curtain rod finishes",
  description:
    "Every curtain rod finish AllFix stocks: antique brass, copper, black and silver, with " +
    "poles, brackets, finials, rings and tie backs to match, in 19, 25 and 28mm.",
  alternates: { canonical: "/ranges" },
}

export default async function Ranges() {
  const all = await ranges()

  return (
    <div className="shell py-12">
      <Breadcrumbs trail={[{ href: "/", label: "Home" }, { label: "Rod finishes" }]} />

      <h1 className="display-lg mt-5 max-w-[20ch] font-display font-bold tracking-tight">
        Rods, by the finish they are in
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-slate">
        A rod is chosen by its metal first and its thickness second. Pick the finish and every
        bracket, finial, ring and tie back behind it is in the same one, in 19, 25 and 28mm.
      </p>

      <ul className="auto-grid flush mt-10" style={{ ["--min" as string]: "22rem" }}>
        {all.map((range) => (
          <li key={range.slug}>
            <Link
              href={`/ranges/${range.slug}`}
              className="flex h-full items-start gap-5 bg-paper p-6 transition-colors hover:bg-brass-soft"
            >
              {/* The swatch is the finish, so it is drawn rather than described.
                  Decorative: the name beside it is the accessible answer, and a
                  colour announced as "B08D57" helps nobody. */}
              <span
                aria-hidden="true"
                className="mt-1 size-14 shrink-0 rounded-full border border-rule"
                style={{ backgroundColor: range.swatch }}
              />
              <span>
                <span className="block font-display text-lg font-semibold tracking-tight">
                  {range.name}
                </span>
                <span className="mt-1.5 block text-sm leading-relaxed text-slate">
                  {range.blurb}
                </span>
                <span className="callout mt-3 block">
                  {range.partCount} parts · {range.diameters.join(", ")}mm
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 max-w-2xl text-sm leading-relaxed text-slate">
        Rails are a separate question and browse on their own axis: nothing that fits a #20 track
        fits a 28mm pole.{" "}
        <Link href="/systems" className="font-medium text-oxblood underline underline-offset-4">
          Compare the rail sections
        </Link>{" "}
        <span className="text-mute">
          or bring the part to the counter at {SHOP.street} and we will match it.
        </span>
      </p>
    </div>
  )
}
